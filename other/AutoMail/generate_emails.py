import argparse
import os
import re
import shutil
import unicodedata
from datetime import datetime
from pathlib import Path

import pandas as pd


STRICT_MODE = True
TOLERANCIA_MONTOS = 2.0


def normalize_token(value):
    if pd.isna(value):
        return ''
    text = str(value).strip()
    text = re.sub(r'\s+', ' ', text)
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(ch for ch in text if not unicodedata.combining(ch))
    return text.lower()


def normalize_name(value):
    token = normalize_token(value)
    # Strip trailing/leading NBSP and whitespace variants
    token = token.strip('\xa0').strip()
    return token


def is_blank_name(value):
    token = normalize_name(value)
    return token in {'', 'nan', 'none', '(en blanco)', 'terapeuta',
                     'nombre terapeuta', 'total general', 'nombre tp'}


def to_number(value):
    if pd.isna(value):
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip().replace('$', '').replace(' ', '')
    if text == '' or text.lower() in {'nan', 'none', '-'}:
        return 0.0

    if re.match(r'^-?\d{1,3}(\.\d{3})+(,\d+)?$', text):
        text = text.replace('.', '').replace(',', '.')
    elif re.match(r'^-?\d{1,3}(,\d{3})+(\.\d+)?$', text):
        text = text.replace(',', '')
    else:
        text = text.replace(',', '.')

    try:
        return float(text)
    except ValueError:
        return 0.0


def format_money(val):
    numeric = to_number(val)
    if numeric == 0:
        return ' <span style="float: left;">$</span> -'
    return f' <span style="float: left;">$</span> {int(round(numeric)):,}'.replace(',', '.')


def format_money_simple(val):
    numeric = to_number(val)
    if numeric == 0:
        return '$ -'
    return f'$ {int(round(numeric)):,}'.replace(',', '.')


# ---------------------------------------------------------------------------
#  DATA LOADING — adapted to the new base.xlsx schema (April 2026)
# ---------------------------------------------------------------------------

def load_resumen(file_path):
    """Reads the 'Resumen' sheet (replaces old 'CUADRO TERAPEUTAS').

    Header row is row 5 (0‑indexed row 4).
    Columns:
        Col2  RUT
        Col3  NOMBRE TERAPEUTA
        Col4  B2C
        Col5  HOTEL
        Col6  B2B
        Col7  ALIANZA
        Col8  MARKETING
        Col9  EVENTO B2B
        Col10 TURNO HOTEL DT
        Col11 EVENTO MKT
        Col12 INCIDENCIAS
        Col13 MONTO BOLETA
        Col14 DEUDA TOTAL
        Col15 DCTO QUINCENA
        Col16 % DCTO
        Col17 DEUDA RESTANTE
        Col18 A PAGO QUINCENA
    """
    raw = pd.read_excel(file_path, sheet_name='Resumen', header=None)

    # Locate header row by looking for 'NOMBRE TERAPEUTA'
    header_idx = None
    for idx in range(min(20, len(raw))):
        row_tokens = [normalize_token(c) for c in raw.iloc[idx]]
        if 'nombre terapeuta' in row_tokens:
            header_idx = idx
            break
    if header_idx is None:
        raise ValueError("No se encontró la fila de encabezados en la hoja 'Resumen'")

    raw.columns = raw.iloc[header_idx].apply(
        lambda v: str(v).strip() if not pd.isna(v) else '')
    df = raw.iloc[header_idx + 1:].copy().reset_index(drop=True)

    # Normalise column names for easier access
    col_map = {}
    for c in df.columns:
        t = normalize_token(c)
        if t in ('nombre terapeuta',):
            col_map[c] = 'Nombre Terapeuta'
        elif t == 'rut':
            col_map[c] = 'RUT'
        elif t == 'b2c':
            col_map[c] = 'B2C'
        elif t == 'hotel':
            col_map[c] = 'HOTEL'
        elif t == 'b2b':
            col_map[c] = 'B2B'
        elif t == 'alianza':
            col_map[c] = 'ALIANZA'
        elif t == 'marketing':
            col_map[c] = 'MARKETING'
        elif t == 'certificado b2c':
            col_map[c] = 'CERTIFICADO B2C'
        elif t == 'certificado b2b':
            col_map[c] = 'CERTIFICADO B2B'
        elif t == 'evento b2b':
            col_map[c] = 'EVENTO B2B'
        elif t in ('turno hotel dt',):
            col_map[c] = 'TURNO HOTEL DT'
        elif t == 'evento mkt':
            col_map[c] = 'EVENTO MKT'
        elif t == 'incidencias':
            col_map[c] = 'Incidencias'
        elif t == 'monto boleta':
            col_map[c] = 'Monto Boleta'
        elif t == 'deuda total':
            col_map[c] = 'Deuda total'
        elif t in ('dcto quincena', 'descuento acad/mats', 'descuento'):
            col_map[c] = 'Descuento Acad/Mats'
        elif t in ('% dcto', '% descontado'):
            col_map[c] = '% descontado'
        elif t == 'deuda restante':
            col_map[c] = 'Deuda Restante'
        elif t in ('a pago quincena', 'monto a transferir'):
            col_map[c] = 'Monto a transferir'

    df = df.rename(columns=col_map)

    # Filter out rows without a valid therapist name
    if 'Nombre Terapeuta' in df.columns:
        df = df[~df['Nombre Terapeuta'].apply(is_blank_name)]

    # Compute aggregate columns matching old schema
    svc_cols = [c for c in ('B2C', 'HOTEL', 'B2B', 'ALIANZA', 'MARKETING', 'CERTIFICADO B2C', 'CERTIFICADO B2B')
                if c in df.columns]
    evt_cols = [c for c in ('EVENTO B2B', 'TURNO HOTEL DT', 'EVENTO MKT')
                if c in df.columns]

    for c in svc_cols + evt_cols + ['Incidencias', 'Monto Boleta',
                                     'Deuda total', 'Descuento Acad/Mats',
                                     'Deuda Restante', 'Monto a transferir']:
        if c in df.columns:
            df[c] = df[c].apply(to_number)

    df['Servicios'] = df[svc_cols].sum(axis=1) if svc_cols else 0.0
    df['Eventos'] = df[evt_cols].sum(axis=1) if evt_cols else 0.0

    # Ensure essential columns
    for col in ('Incidencias', 'Monto Boleta', 'Deuda total',
                'Descuento Acad/Mats', '% descontado', 'Deuda Restante',
                'Monto a transferir'):
        if col not in df.columns:
            df[col] = 0.0

    df = df.reset_index(drop=True)
    return df


def load_servicios(file_path):
    """Reads the 'BASE' sheet for service detail (replaces old 'Detalle Tps').

    The first 14 columns (A‑N) in Base are formula‑generated summaries.
    We read the file with data_only semantics via pandas (which gets cached
    values when the file was last saved with Excel open).

    Row 2 = headers:
        Col1 Terapeuta   Col2 RUT   Col3 Comisión   Col4 Fecha reserva
        Col5 Línea de negocio     Col6 Categoría   Col7 Tipo
        Col8 Duración    Col9 Servicio   Col10 Comuna
        Col11 Detalle    Col12 Calificación servicio
        Col13 Calificación terapeuta   Col14 Comentario usuario
    """
    raw = pd.read_excel(file_path, sheet_name='BASE', header=None)

    # Locate header row containing 'Terapeuta' and 'Comisión'
    header_idx = None
    for idx in range(min(10, len(raw))):
        row_tokens = [normalize_token(c) for c in raw.iloc[idx]]
        if 'terapeuta' in row_tokens and any('comision' in t for t in row_tokens):
            header_idx = idx
            break
    if header_idx is None:
        raise ValueError("No se encontró la fila de encabezados en la hoja 'BASE'")

    # Only take the first 15 columns (the summary columns)
    raw = raw.iloc[:, :15]
    raw.columns = raw.iloc[header_idx].apply(
        lambda v: str(v).strip() if not pd.isna(v) else '')
    df = raw.iloc[header_idx + 1:].copy().reset_index(drop=True)

    # Normalise column names
    rename = {}
    for c in df.columns:
        t = normalize_token(c)
        if t == 'terapeuta':
            rename[c] = 'Nombre Terapeuta'
        elif t == 'rut':
            rename[c] = 'RUT'
        elif t in ('comision', 'comision tp'):
            rename[c] = 'Comisión Tp'
        elif t == 'fecha reserva':
            rename[c] = 'Fecha reserva'
        elif t in ('linea de negocio',):
            rename[c] = 'Línea de negocio'
        elif t in ('categoria',):
            rename[c] = 'Categoría'
        elif t == 'tipo':
            rename[c] = 'Tipo'
        elif t in ('duracion',):
            rename[c] = 'Duración'
        elif t == 'servicio':
            rename[c] = 'Servicio'
        elif t == 'comuna':
            rename[c] = 'Comuna'
        elif t == 'detalle':
            rename[c] = 'Detalle'
        elif t in ('calificacion servicio', 'calificacion del servicio'):
            rename[c] = 'Calificación del servicio'
        elif t in ('calificacion terapeuta', 'calificacion del terapeuta'):
            rename[c] = 'Calificación del terapeuta'
        elif t in ('comentario usuario', 'comentario del usuario'):
            rename[c] = 'Comentario del usuario'
        elif t in ('tipo de servicio',):
            rename[c] = 'Tipo de Servicio'

    df = df.rename(columns=rename)

    if 'Nombre Terapeuta' in df.columns:
        df = df[~df['Nombre Terapeuta'].apply(is_blank_name)]

    df = df.reset_index(drop=True)
    return df


def load_eventos(file_path):
    """Reads the 'Eventos B2B_MKT y Turnos DT' sheet."""
    raw = pd.read_excel(
        file_path, sheet_name='Eventos B2B_MKT y Turnos DT', header=None)

    # Locate header row containing 'Nombre Tp' or 'Terapeuta' + 'Fecha Evento'
    header_idx = None
    for idx in range(min(20, len(raw))):
        row_tokens = [normalize_token(c) for c in raw.iloc[idx]]
        if 'nombre tp' in row_tokens and 'fecha evento' in row_tokens:
            header_idx = idx
            break
        if 'terapeuta' in row_tokens and 'fecha evento' in row_tokens:
            header_idx = idx
            break
    if header_idx is None:
        raise ValueError(
            "No se encontró la fila de encabezados en 'Eventos B2B_MKT y Turnos DT'")

    raw.columns = raw.iloc[header_idx].apply(
        lambda v: str(v).strip() if not pd.isna(v) else '')
    df = raw.iloc[header_idx + 1:].copy().reset_index(drop=True)

    rename = {}
    for c in df.columns:
        t = normalize_token(c)
        if t in ('nombre tp', 'terapeuta', 'nombre terapeuta'):
            rename[c] = 'Nombre Terapeuta'
        elif t == 'rut':
            rename[c] = 'RUT'
        elif t == 'fecha evento':
            rename[c] = 'Fecha Evento'
        elif t in ('cliente / evento', 'cliente', 'cliente/evento'):
            rename[c] = 'Cliente'
        elif t in ('hrs evento', 'hrs', 'duracion'):
            rename[c] = 'Duración'
        elif t in ('tipo servicio', 'servicio'):
            rename[c] = 'Servicio'
        elif t in ('comision', 'monto'):
            rename[c] = 'Monto'
        elif t in ('linea de negocio',):
            rename[c] = 'Línea de Negocio'

    df = df.rename(columns=rename)

    if 'Nombre Terapeuta' in df.columns:
        df = df[~df['Nombre Terapeuta'].apply(is_blank_name)]

    df = df.reset_index(drop=True)
    return df


def load_incidencias(file_path):
    """Reads the 'Incidencias' sheet."""
    raw = pd.read_excel(file_path, sheet_name='Incidencias', header=None)

    # Locate header row containing 'Terapeuta' + 'Monto Incidencia'
    header_idx = None
    for idx in range(min(20, len(raw))):
        row_tokens = [normalize_token(c) for c in raw.iloc[idx]]
        if 'terapeuta' in row_tokens and any('monto' in t for t in row_tokens):
            header_idx = idx
            break
    if header_idx is None:
        raise ValueError(
            "No se encontró la fila de encabezados en 'Incidencias'")

    raw.columns = raw.iloc[header_idx].apply(
        lambda v: str(v).strip() if not pd.isna(v) else '')
    df = raw.iloc[header_idx + 1:].copy().reset_index(drop=True)

    rename = {}
    for c in df.columns:
        t = normalize_token(c)
        if t in ('terapeuta', 'nombre tp', 'nombre terapeuta'):
            rename[c] = 'Nombre Terapeuta'
        elif t == 'rut':
            rename[c] = 'RUT'
        elif t in ('quinc.', 'quincena'):
            rename[c] = 'Quincena'
        elif t == 'fecha reserva':
            rename[c] = 'Fecha Incidencia'
        elif t == 'hora reserva':
            rename[c] = 'Hora Reserva'
        elif t == 'nombre cliente':
            rename[c] = 'Nombre Cliente'
        elif t in ('linea de negocio',):
            rename[c] = 'Línea de Negocio'
        elif t in ('monto incidencia tps', 'monto'):
            rename[c] = 'Monto'
        elif t == 'tipo de incidencia':
            rename[c] = 'Tipo de Incidencia'
        elif t in ('detalle incidencia', 'comentario', 'observaciones'):
            rename[c] = 'Comentario'
        elif t in ('mes', 'mes pago'):
            rename[c] = 'Mes'

    df = df.rename(columns=rename)

    if 'Nombre Terapeuta' in df.columns:
        df = df[~df['Nombre Terapeuta'].apply(is_blank_name)]

    df = df.reset_index(drop=True)
    return df


# ---------------------------------------------------------------------------
#  HTML GENERATION
# ---------------------------------------------------------------------------

def generate_html_for_therapist(name, t_row, df_servicios, df_eventos, df_incidencias, periodo_str):
    servicios_total = t_row['Servicios']
    eventos_total = t_row['Eventos']
    incidencias_total = t_row['Incidencias']
    monto_boleta = t_row['Monto Boleta']
    deuda_total = t_row['Deuda total']
    descuento = t_row['Descuento Acad/Mats']
    pct_descontado = t_row['% descontado']
    if not pd.isna(pct_descontado) and str(pct_descontado).strip() != '':
        pct_val = to_number(pct_descontado)
        # If value is already a fraction (e.g. 0.06), convert to percentage
        if abs(pct_val) < 1:
            pct_descontado = f"{int(round(pct_val * 100))}%"
        else:
            pct_descontado = f"{int(round(pct_val))}%"
    else:
        pct_descontado = '0%'
    deuda_restante = t_row['Deuda Restante']
    monto_transferir = t_row['Monto a transferir']

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Servicios - {name}</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 13px; color: #000000; padding: 20px;">

    <div style="margin-bottom: 20px;">
        <p>Hola {name.split()[0]},</p> Espero que estés bien.<br>
        Te envío el resumen de los servicios realizados {periodo_str}.
    </div>

    <table style="border-collapse: collapse; white-space: nowrap; font-size: 12px; margin-bottom: 25px;" border="1" cellpadding="4" cellspacing="0">
        <tr style="text-align: center; font-weight: bold;">
            <td style="background-color: #92d050; border: 1px solid #a6a6a6;">Terapeuta</td>
            <td style="background-color: #92d050; border: 1px solid #a6a6a6;">Servicios</td>
            <td style="background-color: #92d050; border: 1px solid #a6a6a6;">Eventos</td>
            <td style="background-color: #92d050; border: 1px solid #a6a6a6;">Incidencias</td>
            <td style="background-color: #92d050; border: 1px solid #a6a6a6;">Monto Boleta</td>
            <td style="background-color: #eaeaea; border: 1px solid #a6a6a6;">Deuda total</td>
            <td style="background-color: #eaeaea; border: 1px solid #a6a6a6;">Descuento Acad/Mats</td>
            <td style="background-color: #eaeaea; border: 1px solid #a6a6a6;">% descontado</td>
            <td style="background-color: #eaeaea; border: 1px solid #a6a6a6;">Deuda Restante</td>
            <td style="background-color: #b7dee8; border: 1px solid #a6a6a6;">Monto a transferir</td>
        </tr>
        <tr>
            <td style="border: 1px solid #a6a6a6;">{name}</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money(servicios_total)}</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money(eventos_total)}</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money(incidencias_total)}</td>
            <td style="border: 1px solid #a6a6a6; text-align: right; font-weight: bold;">{format_money(monto_boleta)}</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money(deuda_total)}</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money(descuento)}</td>
            <td style="border: 1px solid #a6a6a6; text-align: center;">{pct_descontado}</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money(deuda_restante)}</td>
            <td style="border: 1px solid #a6a6a6; text-align: right; font-weight: bold;">{format_money(monto_transferir)}</td>
        </tr>
    </table>
"""

    # -- SERVICIOS table --
    html += f"""
    <table style="border-collapse: collapse; white-space: nowrap; font-size: 12px; margin-bottom: 25px;" border="1" cellpadding="4" cellspacing="0">
        <tr style="font-weight: bold; background-color: #dfa8e4;">
            <td colspan="10" style="border: 1px solid #a6a6a6;">SERVICIOS</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money_simple(servicios_total)}</td>
        </tr>
        <tr style="text-align: center; font-weight: bold; background-color: #dfa8e4;">
            <td style="border: 1px solid #a6a6a6;">Nombre Terapeuta</td>
            <td style="border: 1px solid #a6a6a6;">Comisión Tp</td>
            <td style="border: 1px solid #a6a6a6;">Fecha reserva</td>
            <td style="border: 1px solid #a6a6a6;">Categoría</td>
            <td style="border: 1px solid #a6a6a6;">Tipo</td>
            <td style="border: 1px solid #a6a6a6;">Duración</td>
            <td style="border: 1px solid #a6a6a6;">Servicio</td>
            <td style="border: 1px solid #a6a6a6;">Comuna</td>
            <td style="background-color: #fce4d6; color: #002060; border: 1px solid #a6a6a6;">Calificación<br>del servicio</td>
            <td style="background-color: #fce4d6; color: #002060; border: 1px solid #a6a6a6;">Calificación<br>del terapeuta</td>
            <td style="background-color: #fce4d6; color: #002060; border: 1px solid #a6a6a6;">Comentario del usuario</td>
        </tr>
"""
    if len(df_servicios) == 0:
        html += '<tr style="text-align: center;"><td colspan="11" style="border: 1px solid #a6a6a6;">(Sin servicios)</td></tr>'
    else:
        for _, row in df_servicios.iterrows():
            comision = format_money_simple(
                row.get('Comisión Tp', 0)).replace('$ ', '')
            fecha = str(row.get('Fecha reserva', '')).split(' ')[0]
            cat = row.get('Categoría', '')
            tipo = row.get('Tipo', '')
            duracion = row.get('Duración', '')
            servicio = row.get('Servicio', '')
            comuna = row.get('Comuna', '')

            calif_serv = row.get('Calificación del servicio', '')
            calif_ter = row.get('Calificación del terapeuta', '')
            comentario = row.get('Comentario del usuario', '')

            calif_serv = '' if pd.isna(calif_serv) or str(calif_serv).strip() in ('(en blanco)', '-1', '-1.0') else str(
                calif_serv).replace('.0', '')
            calif_ter = '' if pd.isna(calif_ter) or str(calif_ter).strip() in ('(en blanco)', '-1', '-1.0') else str(
                calif_ter).replace('.0', '')
            comentario = '' if pd.isna(comentario) else str(comentario).strip()

            html += f"""        <tr>
            <td style="border: 1px solid #a6a6a6;">{name}</td>
            <td style="border: 1px solid #a6a6a6; font-weight: bold; text-align: right;">{comision}</td>
            <td style="border: 1px solid #a6a6a6; text-align: center;">{fecha}</td>
            <td style="border: 1px solid #a6a6a6;">{cat}</td>
            <td style="border: 1px solid #a6a6a6;">{tipo}</td>
            <td style="border: 1px solid #a6a6a6; text-align: center;">{duracion}</td>
            <td style="border: 1px solid #a6a6a6;">{servicio}</td>
            <td style="border: 1px solid #a6a6a6;">{comuna}</td>
            <td style="border: 1px solid #a6a6a6; text-align: center;">{calif_serv}</td>
            <td style="border: 1px solid #a6a6a6; text-align: center;">{calif_ter}</td>
            <td style="border: 1px solid #a6a6a6;">{comentario}</td>
        </tr>\n"""
    html += '    </table>\n'

    # -- EVENTOS table --
    html += f"""
    <table style="border-collapse: collapse; white-space: nowrap; font-size: 12px; margin-bottom: 25px;" border="1" cellpadding="4" cellspacing="0">
        <tr style="font-weight: bold; background-color: #b7dee8;">
            <td colspan="5" style="border: 1px solid #a6a6a6;">EVENTOS</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money_simple(eventos_total)}</td>
        </tr>
        <tr style="font-weight: bold; background-color: #b7dee8; text-align: center;">
            <td style="border: 1px solid #a6a6a6;">Terapeuta</td>
            <td style="border: 1px solid #a6a6a6;">Fecha Evento</td>
            <td style="border: 1px solid #a6a6a6;">Cliente</td>
            <td style="border: 1px solid #a6a6a6;">Duración</td>
            <td style="border: 1px solid #a6a6a6;">Servicio</td>
            <td style="border: 1px solid #a6a6a6;">Monto</td>
        </tr>
"""
    if len(df_eventos) == 0:
        html += '<tr style="text-align: center;"><td colspan="6" style="border: 1px solid #a6a6a6;">(Sin eventos)</td></tr>'
    else:
        for _, row in df_eventos.iterrows():
            fecha = str(row.get('Fecha Evento', '')).split(' ')[0]
            cliente = row.get('Cliente', '')
            if pd.isna(cliente):
                cliente = ''
            duracion = str(row.get('Duración', '')).replace('.0', '')
            servicio = row.get('Servicio', '')
            if pd.isna(servicio):
                servicio = ''
            monto = row.get('Monto', 0)

            html += f"""        <tr style="text-align: center;">
            <td style="text-align: left; border: 1px solid #a6a6a6;">{name}</td>
            <td style="border: 1px solid #a6a6a6;">{fecha}</td>
            <td style="text-align: left; border: 1px solid #a6a6a6;">{cliente}</td>
            <td style="border: 1px solid #a6a6a6;">{duracion}</td>
            <td style="text-align: left; border: 1px solid #a6a6a6;">{servicio}</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money_simple(monto)}</td>
        </tr>\n"""
    html += '    </table>\n'

    # -- INCIDENCIAS table (with new fields: Tipo de Incidencia, Nombre Cliente) --
    html += f"""
    <table style="border-collapse: collapse; white-space: nowrap; font-size: 12px; margin-bottom: 25px;" border="1" cellpadding="4" cellspacing="0">
        <tr style="font-weight: bold; background-color: #ebf1de;">
            <td colspan="7" style="border: 1px solid #a6a6a6;">INCIDENCIAS</td>
            <td style="border: 1px solid #a6a6a6; text-align: right;">{format_money_simple(incidencias_total)}</td>
        </tr>
        <tr style="text-align: center; font-weight: bold; background-color: #ebf1de;">
            <td style="border: 1px solid #a6a6a6;">Terapeuta</td>
            <td style="border: 1px solid #a6a6a6;">Quincena</td>
            <td style="border: 1px solid #a6a6a6;">Fecha Incidencia</td>
            <td style="border: 1px solid #a6a6a6;">Nombre Cliente</td>
            <td style="border: 1px solid #a6a6a6;">Tipo de Incidencia</td>
            <td style="border: 1px solid #a6a6a6;">Comentario</td>
            <td style="border: 1px solid #a6a6a6;">Monto</td>
            <td style="border: 1px solid #a6a6a6;">Mes</td>
        </tr>
"""
    if len(df_incidencias) == 0:
        html += """<tr style="text-align: center;">
            <td style="border: 1px solid #a6a6a6;">(Sin incidencias)</td>
            <td style="border: 1px solid #a6a6a6;"></td>
            <td style="border: 1px solid #a6a6a6;"></td>
            <td style="border: 1px solid #a6a6a6;"></td>
            <td style="border: 1px solid #a6a6a6;"></td>
            <td style="border: 1px solid #a6a6a6;"></td>
            <td style="border: 1px solid #a6a6a6;"></td>
            <td style="border: 1px solid #a6a6a6;"></td>
        </tr>\n"""
    else:
        for _, row in df_incidencias.iterrows():
            quincena = str(row.get('Quincena', '')).replace('.0', '')
            fecha = str(row.get('Fecha Incidencia', '')).split(' ')[0]
            nombre_cli = row.get('Nombre Cliente', '')
            if pd.isna(nombre_cli):
                nombre_cli = ''
            tipo_inc = row.get('Tipo de Incidencia', '')
            if pd.isna(tipo_inc):
                tipo_inc = ''
            comentario = row.get('Comentario', '')
            if pd.isna(comentario):
                comentario = ''
            monto = row.get('Monto', 0)
            mes = row.get('Mes', '')
            if pd.isna(mes):
                mes = ''

            monto_str = format_money_simple(monto)
            if to_number(monto) < 0:
                monto_str = f'<span style="color: red;">{monto_str}</span>'

            html += f"""        <tr style="text-align: center;">
            <td style="border: 1px solid #a6a6a6;">{name}</td>
            <td style="border: 1px solid #a6a6a6;">{quincena}</td>
            <td style="border: 1px solid #a6a6a6;">{fecha}</td>
            <td style="border: 1px solid #a6a6a6;">{nombre_cli}</td>
            <td style="border: 1px solid #a6a6a6;">{tipo_inc}</td>
            <td style="border: 1px solid #a6a6a6;">{comentario}</td>
            <td style="border: 1px solid #a6a6a6;">{monto_str}</td>
            <td style="border: 1px solid #a6a6a6;">{mes}</td>
        </tr>\n"""

    html += """    </table>

    <div style="font-size: 13px; line-height: 1.4;">
        <span style="color: #548235; font-weight: bold; font-size: 14px; text-decoration: underline;">Importante a recordar:</span><br><br>
        Al igual que en las quincenas pasadas, no debes generar las boletas, ya que, serán generadas directamente por el área contable, y estas las puedes revisar en el portal del SII.<br>
        <b>Recordar que para el año 2026 la retención del SII es del 15,25% sobre el monto bruto.</b><br>
        Como recordatorio, el descuento de las deudas corresponden a un máximo de 20% sobre el total de servicios bruto y el descuento se realiza al monto líquido.<br>
        Si necesitas detalle de tu deuda, me indicas por correo para enviarla.<br><br>
        <u>Cualquier duda de los pagos o solicitud, responder a este correo con el detalle de la consulta o toda la información necesaria para revisar el caso.</u><br>
        <br>
        Saludos!
    </div>

</body>
</html>
"""
    return html


# ---------------------------------------------------------------------------
#  NAME KEY HELPERS
# ---------------------------------------------------------------------------

def build_name_key_column(df):
    if len(df) == 0:
        df['_name_key'] = []
        return df
    df['_name_key'] = df['Nombre Terapeuta'].apply(normalize_name)
    return df


def normalize_rut(value):
    """Normalize RUT for matching: strip, uppercase, remove dots."""
    if pd.isna(value):
        return ''
    text = str(value).strip().replace('.', '').replace(' ', '').upper()
    text = text.strip('\xa0')
    return text


def build_rut_key_column(df):
    """Add _rut_key column for matching between sheets."""
    if len(df) == 0:
        df['_rut_key'] = []
        return df
    if 'RUT' in df.columns:
        df['_rut_key'] = df['RUT'].apply(normalize_rut)
    else:
        # Fallback to name-based key if no RUT column
        df['_rut_key'] = df['Nombre Terapeuta'].apply(normalize_name)
    return df


# ---------------------------------------------------------------------------
#  VALIDATION
# ---------------------------------------------------------------------------

def validate_integrity(df_cuadro, df_servicios, df_eventos, df_incidencias):
    errors = []
    warnings = []
    details = []

    df_cuadro = df_cuadro.copy()
    df_servicios = df_servicios.copy()
    df_eventos = df_eventos.copy()
    df_incidencias = df_incidencias.copy()

    for col in ['Servicios', 'Eventos', 'Incidencias', 'Monto Boleta',
                'Deuda total', 'Descuento Acad/Mats', '% descontado',
                'Deuda Restante', 'Monto a transferir']:
        if col in df_cuadro.columns:
            df_cuadro[col] = df_cuadro[col].apply(to_number)

    if 'Comisión Tp' in df_servicios.columns:
        df_servicios['Comisión Tp'] = df_servicios['Comisión Tp'].apply(
            to_number)
    if 'Monto' in df_eventos.columns:
        df_eventos['Monto'] = df_eventos['Monto'].apply(to_number)
    if 'Monto' in df_incidencias.columns:
        df_incidencias['Monto'] = df_incidencias['Monto'].apply(to_number)

    df_cuadro = build_rut_key_column(df_cuadro)
    if len(df_servicios) > 0:
        df_servicios = build_rut_key_column(df_servicios)
    if len(df_eventos) > 0:
        df_eventos = build_rut_key_column(df_eventos)
    if len(df_incidencias) > 0:
        df_incidencias = build_rut_key_column(df_incidencias)

    valid_keys = set(df_cuadro['_rut_key'].dropna().tolist())

    for df_name, detail_df, amount_col in [
        ('BASE (servicios)', df_servicios, 'Comisión Tp'),
        ('Eventos B2B_MKT y Turnos DT', df_eventos, 'Monto'),
        ('Incidencias', df_incidencias, 'Monto'),
    ]:
        if len(detail_df) == 0:
            continue

        for _, row in detail_df.iterrows():
            key = row.get('_rut_key', '')
            if key in valid_keys:
                continue
            amount = to_number(row.get(amount_col, 0))
            if amount != 0:
                errors.append(
                    f"{df_name}: terapeuta no presente en RESUMEN -> '{row.get('Nombre Terapeuta')}'"
                )

    for _, row in df_cuadro.iterrows():
        key = row['_rut_key']
        name = row['Nombre Terapeuta']

        exp_serv = to_number(row.get('Servicios', 0))
        exp_evt = to_number(row.get('Eventos', 0))
        exp_inc = to_number(row.get('Incidencias', 0))

        act_serv = 0.0
        if len(df_servicios) > 0:
            act_serv = df_servicios.loc[df_servicios['_rut_key']
                                        == key, 'Comisión Tp'].sum()

        act_evt = 0.0
        if len(df_eventos) > 0:
            act_evt = df_eventos.loc[df_eventos['_rut_key']
                                     == key, 'Monto'].sum()

        act_inc = 0.0
        if len(df_incidencias) > 0:
            act_inc = df_incidencias.loc[df_incidencias['_rut_key'] == key, 'Monto'].sum(
            )

        if abs(exp_serv - act_serv) > TOLERANCIA_MONTOS:
            errors.append(
                f"{name}: Servicios no cuadra (RESUMEN={int(round(exp_serv))}, DETALLE={int(round(act_serv))})"
            )
        if abs(exp_evt - act_evt) > TOLERANCIA_MONTOS:
            errors.append(
                f"{name}: Eventos no cuadra (RESUMEN={int(round(exp_evt))}, DETALLE={int(round(act_evt))})"
            )
        if abs(exp_inc - act_inc) > TOLERANCIA_MONTOS:
            errors.append(
                f"{name}: Incidencias no cuadra (RESUMEN={int(round(exp_inc))}, DETALLE={int(round(act_inc))})"
            )

        if (exp_serv > 0 or exp_evt > 0 or exp_inc > 0) and key == '':
            warnings.append(
                f'Nombre vacío detectado en RESUMEN con montos: {row.to_dict()}')

        details.append({
            'name': str(name),
            'servicios_cuadro': exp_serv,
            'servicios_detalle': act_serv,
            'servicios_delta': exp_serv - act_serv,
            'eventos_cuadro': exp_evt,
            'eventos_detalle': act_evt,
            'eventos_delta': exp_evt - act_evt,
            'incidencias_cuadro': exp_inc,
            'incidencias_detalle': act_inc,
            'incidencias_delta': exp_inc - act_inc,
        })

    return errors, warnings, details


# ---------------------------------------------------------------------------
#  REPORT LOG
# ---------------------------------------------------------------------------

def write_report_log(report_path, status, strict_mode, tolerancia_montos, file_path,
                     df_cuadro, df_servicios, df_eventos, df_incidencias,
                     errors, warnings, details, generated_files):
    lines = []
    lines.append(
        f'=== AutoMail Audit Report | {datetime.now().isoformat(timespec="seconds")} ===')
    lines.append(f'Estado: {status}')
    lines.append(f'Archivo fuente: {file_path}')
    lines.append(f'STRICT_MODE: {strict_mode}')
    lines.append(f'TOLERANCIA_MONTOS: {tolerancia_montos}')
    lines.append(f'Terapeutas en resumen: {len(df_cuadro)}')
    lines.append(f'Filas servicios: {len(df_servicios)}')
    lines.append(f'Filas eventos: {len(df_eventos)}')
    lines.append(f'Filas incidencias: {len(df_incidencias)}')
    lines.append(f'Archivos generados: {generated_files}')
    lines.append(f'Advertencias: {len(warnings)}')
    lines.append(f'Errores: {len(errors)}')
    lines.append('')

    if warnings:
        lines.append('[ADVERTENCIAS]')
        for item in warnings:
            lines.append(f' - {item}')
        lines.append('')

    if errors:
        lines.append('[ERRORES]')
        for item in errors:
            lines.append(f' - {item}')
        lines.append('')

    lines.append('[CONCILIACION POR TERAPEUTA]')
    for d in details:
        lines.append(
            f" - {d['name']} | "
            f"Servicios C={int(round(d['servicios_cuadro']))} D={int(round(d['servicios_detalle']))} Δ={int(round(d['servicios_delta']))}; "
            f"Eventos C={int(round(d['eventos_cuadro']))} D={int(round(d['eventos_detalle']))} Δ={int(round(d['eventos_delta']))}; "
            f"Incidencias C={int(round(d['incidencias_cuadro']))} D={int(round(d['incidencias_detalle']))} Δ={int(round(d['incidencias_delta']))}"
        )

    with open(report_path, 'w', encoding='utf-8') as report_file:
        report_file.write('\n'.join(lines) + '\n')


def run_autemail_pipeline(file_path, output_dir, report_path, zip_path=None,
                          strict_mode=STRICT_MODE,
                          tolerancia_montos=TOLERANCIA_MONTOS):
    source_path = Path(file_path)
    output_dir = Path(output_dir)
    report_path = Path(report_path)
    zip_path = Path(zip_path) if zip_path else report_path.with_name('mail_generados.zip')

    output_dir.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    # --- Determine date range from BASE sheet ---
    try:
        df_base_dates = pd.read_excel(source_path, sheet_name='BASE', header=1)
        fecha_col = None
        for c in df_base_dates.columns:
            if normalize_token(c) == 'fecha reserva':
                fecha_col = c
                break
        if fecha_col is None:
            fecha_col = df_base_dates.columns[3]

        fechas = pd.to_datetime(df_base_dates[fecha_col], errors='coerce').dropna()
        if len(fechas) > 0:
            f_min, f_max = fechas.min(), fechas.max()
            meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                     "julio", "agosto", "septiembre", "octubre",
                     "noviembre", "diciembre"]
            if f_min.month == f_max.month and f_min.year == f_max.year:
                periodo_str = (f"entre el {f_min.day} y el {f_max.day} de "
                               f"{meses[f_min.month - 1]} de {f_max.year}")
            elif f_min.year == f_max.year:
                periodo_str = (f"entre el {f_min.day} de {meses[f_min.month - 1]} "
                               f"y el {f_max.day} de {meses[f_max.month - 1]} "
                               f"de {f_max.year}")
            else:
                periodo_str = (f"entre el {f_min.day} de {meses[f_min.month - 1]} "
                               f"de {f_min.year} y el {f_max.day} de "
                               f"{meses[f_max.month - 1]} de {f_max.year}")
        else:
            periodo_str = "el período evaluado"
    except Exception as e:
        print("Advertencia: No se pudo leer la fecha de la pestaña BASE:", e)
        periodo_str = "el período evaluado"

    # --- Load all data sources ---
    df_cuadro = load_resumen(source_path)
    df_servicios = load_servicios(source_path)
    df_eventos = load_eventos(source_path)
    df_incidencias = load_incidencias(source_path)

    for optional_col in ['Calificación del servicio',
                         'Calificación del terapeuta',
                         'Comentario del usuario']:
        if optional_col not in df_servicios.columns:
            df_servicios[optional_col] = ''

    for optional_col in ['Nombre Cliente', 'Tipo de Incidencia']:
        if optional_col not in df_incidencias.columns:
            df_incidencias[optional_col] = ''

    # --- Validation ---
    errors, warnings, details = validate_integrity(
        df_cuadro, df_servicios, df_eventos, df_incidencias)

    if warnings:
        print('ADVERTENCIAS DE CALIDAD DE DATOS:')
        for item in warnings:
            print(f' - {item}')

    if errors and strict_mode:
        print('ERRORES DE INTEGRIDAD. Se bloquea la generación de correos:')
        for item in errors:
            print(f' - {item}')
        write_report_log(
            report_path=report_path,
            status='BLOQUEADO_POR_INTEGRIDAD',
            strict_mode=strict_mode,
            tolerancia_montos=tolerancia_montos,
            file_path=str(source_path),
            df_cuadro=df_cuadro,
            df_servicios=df_servicios,
            df_eventos=df_eventos,
            df_incidencias=df_incidencias,
            errors=errors,
            warnings=warnings,
            details=details,
            generated_files=0
        )
        return {
            'status': 'blocked',
            'generated_files': 0,
            'skipped_files': 0,
            'errors': errors,
            'warnings': warnings,
            'report_path': str(report_path),
            'zip_path': None,
            'details': details,
        }

    if errors:
        print('ATENCIÓN: se encontraron errores, pero STRICT_MODE=False. Se continúa con generación.')
        for item in errors:
            print(f' - {item}')

    # --- Generate emails ---
    df_cuadro = build_rut_key_column(df_cuadro)
    df_servicios = build_rut_key_column(df_servicios)
    if len(df_eventos) > 0:
        df_eventos = build_rut_key_column(df_eventos)
    if len(df_incidencias) > 0:
        df_incidencias = build_rut_key_column(df_incidencias)

    generated_count = 0
    skipped_count = 0
    for _, t_row in df_cuadro.iterrows():
        name = t_row['Nombre Terapeuta']
        key = t_row['_rut_key']

        monto_boleta = to_number(t_row.get('Monto Boleta', 0))
        if monto_boleta <= 0:
            skipped_count += 1
            continue

        t_servicios = df_servicios[df_servicios['_rut_key'] == key].drop(
            columns=['_rut_key'], errors='ignore')

        t_eventos = pd.DataFrame()
        if len(df_eventos) > 0:
            t_eventos = df_eventos[df_eventos['_rut_key'] == key].drop(
                columns=['_rut_key'], errors='ignore')

        t_incidencias = pd.DataFrame()
        if len(df_incidencias) > 0:
            t_incidencias = df_incidencias[df_incidencias['_rut_key'] == key].drop(
                columns=['_rut_key'], errors='ignore')

        t_row_no_key = t_row.drop(labels=['_rut_key'])
        html = generate_html_for_therapist(
            name, t_row_no_key, t_servicios, t_eventos, t_incidencias, periodo_str)

        fname = f"{str(name).replace(' ', '_')}.html"
        fpath = output_dir / fname
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f'Generated {fname}')
        generated_count += 1

    print(f'\nTotal generados: {generated_count} | Omitidos (sin boleta): {skipped_count}')

    final_status = 'OK'
    if errors and not strict_mode:
        final_status = 'GENERADO_CON_ERRORES'
    elif warnings:
        final_status = 'OK_CON_ADVERTENCIAS'

    write_report_log(
        report_path=report_path,
        status=final_status,
        strict_mode=strict_mode,
        tolerancia_montos=tolerancia_montos,
        file_path=str(source_path),
        df_cuadro=df_cuadro,
        df_servicios=df_servicios,
        df_eventos=df_eventos,
        df_incidencias=df_incidencias,
        errors=errors,
        warnings=warnings,
        details=details,
        generated_files=generated_count
    )

    if zip_path.exists():
        zip_path.unlink()
    shutil.make_archive(str(zip_path.with_suffix('')), 'zip', root_dir=str(output_dir))
    print(f'Carpeta comprimida exitosamente en: {zip_path}')

    return {
        'status': final_status.lower(),
        'generated_files': generated_count,
        'skipped_files': skipped_count,
        'errors': errors,
        'warnings': warnings,
        'report_path': str(report_path),
        'zip_path': str(zip_path),
        'details': details,
    }


def main():
    parser = argparse.ArgumentParser(description='Generador de correos AutoMail')
    parser.add_argument('--input', required=False, default='base.xlsx', help='Ruta del archivo XLSX de entrada')
    parser.add_argument('--output-dir', required=False, default='mails_generados', help='Directorio de salida para los HTML')
    parser.add_argument('--report-path', required=False, default='report.log', help='Ruta del archivo report.log')
    parser.add_argument('--zip-path', required=False, default='mail_generados.zip', help='Ruta del ZIP final')
    parser.add_argument('--no-strict', action='store_true', help='Continúa aunque existan errores de integridad')
    parser.add_argument('--tolerance', type=float, default=TOLERANCIA_MONTOS, help='Tolerancia permitida para diferencias de montos')
    args = parser.parse_args()

    result = run_autemail_pipeline(
        file_path=args.input,
        output_dir=args.output_dir,
        report_path=args.report_path,
        zip_path=args.zip_path,
        strict_mode=not args.no_strict,
        tolerancia_montos=args.tolerance,
    )

    if result['warnings']:
        print(f"\nAdvertencias detectadas: {len(result['warnings'])}")
    if result['errors'] and result['status'] == 'blocked':
        raise SystemExit(1)


if __name__ == '__main__':
    main()
