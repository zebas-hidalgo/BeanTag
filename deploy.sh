#!/usr/bin/env bash
set -e

VPS_IP="5.189.152.68"
VPS_USER="root"
VPS_PATH="/var/www/beantag"

echo "🚀 Desplegando en VPS (${VPS_IP})..."
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "
  cd ${VPS_PATH} && \
  git fetch origin main && \
  git reset --hard origin/main && \
  npm run build-frontend && \
  pm2 restart beantag
"

echo "✨ ¡Actualización desplegada con éxito en VPS!"
