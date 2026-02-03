#!/bin/bash

# ============================================
# VALIDADOR DE SINTAXIS JAVASCRIPT
# Ejecutar antes de commit para prevenir errores
# ============================================

echo "🔍 Validando sintaxis JavaScript..."

ERRORS=0

# Archivos JavaScript a validar
JS_FILES=(
    "js/admin.js"
    "js/app.js"
    "js/contact.js"
    "js/modals.js"
    "js/drag.js"
    "js/ui.js"
    "other/BT/public/js/app.js"
    "other/BT/public/js/admin.js"
)

for file in "${JS_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Omitiendo $file (no existe)"
        continue
    fi
    
    # Contar llaves
    open=$(grep -o '{' "$file" | wc -l)
    close=$(grep -o '}' "$file" | wc -l)
    
    if [ "$open" -ne "$close" ]; then
        echo "❌ $file: Llaves desbalanceadas (abierto:$open cerrado:$close)"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ $file"
    fi
    
    # Verificar paréntesis
    open_paren=$(grep -o '(' "$file" | wc -l)
    close_paren=$(grep -o ')' "$file" | wc -l)
    
    if [ "$open_paren" -ne "$close_paren" ]; then
        echo "❌ $file: Paréntesis desbalanceados (abierto:$open_paren cerrado:$close_paren)"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Verificar corchetes
    open_bracket=$(grep -o '\[' "$file" | wc -l)
    close_bracket=$(grep -o '\]' "$file" | wc -l)
    
    if [ "$open_bracket" -ne "$close_bracket" ]; then
        echo "❌ $file: Corchetes desbalanceados (abierto:$open_bracket cerrado:$close_bracket)"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "\n✅ Todos los archivos JavaScript son válidos"
    exit 0
else
    echo -e "\n❌ $ERRORS archivos con errores de sintaxis"
    echo "🚫 Commit bloqueado. Corrige los errores antes de continuar."
    exit 1
fi
