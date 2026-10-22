#!/usr/bin/env bash
# Inspecciona la BD en el VPS. Usa llave SSH (sin password en el repo).
# Config: export BEANTAG_VPS="usuario@host"  (o define Host beantag en ~/.ssh/config)
set -euo pipefail
VPS="${BEANTAG_VPS:-beantag}"
ssh "$VPS" "node /var/www/beantag/backend/inspect_db.js"
