# Pokédex (PokeAPI)

Pequeña Pokédex con búsqueda en vivo y carga infinita usando PokeAPI. Implementa grid responsive, lazy-loading de imágenes, caché de especies y mejoras de accesibilidad.

## Estructura del Proyecto

```
pokedex
├── index.html             # Página principal
├── src
│   ├── styles
│   │   └── main.css       # Estilos
│   ├── scripts
│   │   └── app.js         # Lógica de la Pokédex
│   └── img
│       └── gradient.svg   # Fondo
└── README.md
```

## Archivos

- **index.html**: Estructura HTML con mejoras de accesibilidad y rutas correctas.
- **src/styles/main.css**: Estilos, grid responsive y hover sin saltos; spinner de carga.
- **src/scripts/app.js**: Carga en paralelo con `Promise.all`, `IntersectionObserver`, debounce del input, DOM seguro, caché de especies (memoria y `localStorage`).

## Cómo Configurar y Ejecutar

1. Clona este repositorio en tu máquina local.
2. Navega a la carpeta del proyecto.
3. Abre `index.html` en tu navegador.
   - Requiere conexión a Internet para consultar PokeAPI.

## Notas de rendimiento
- Las especies se cachean en memoria y `localStorage` con clave `species_<id>`.
- Las imágenes usan `loading="lazy"`.

## Posibles mejoras
- Cachear sprites en `Cache Storage` (Service Worker) para uso offline.
- Pretraducción de tipos al español.

## Descargar base de datos local (JSON + imágenes)

Requisitos: Node 18+.

Estructura creada:
```
src/DB/
├── pokemon/      # JSON por id (datos de /pokemon/:id)
├── species/      # JSON por id (datos de /pokemon-species/:id)
└── cache/        # Imágenes oficiales por id (official-artwork)
```

Comandos:
```
# Todo el catálogo
node src/scripts/fetch_db.js

# Rango específico (ej: 1..151) y control de concurrencia
node src/scripts/fetch_db.js --from=1 --to=151 --concurrency=12
```

## Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar este proyecto, siéntete libre de hacer un fork y enviar un pull request.