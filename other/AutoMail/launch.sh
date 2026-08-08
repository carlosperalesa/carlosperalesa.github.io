#!/bin/bash

set -euo pipefail

APP_DIR="/var/www/portafolio/other/AutoMail"
VENV_DIR="$APP_DIR/.venv"
PYTHON_BIN="$VENV_DIR/bin/python"

cd "$APP_DIR"

if [ ! -x "$PYTHON_BIN" ]; then
    python3 -m venv "$VENV_DIR"
fi

"$PYTHON_BIN" -m pip install --upgrade pip
"$PYTHON_BIN" -m pip install -r "$APP_DIR/requirements.txt"

exec "$PYTHON_BIN" "$APP_DIR/server.py"