#!/usr/bin/env bash
set -e

VPS_IP="5.189.152.68"
VPS_USER="root"
VPS_PATH="/var/www/beantag"
ARCHIVE_NAME="beantag_update.tar.gz"

echo "📦 1. Empaquetando BeanTag (usando directorio actual)..."
tar --exclude=node_modules \
    --exclude=.git \
    --exclude=frontend/node_modules \
    --exclude=backend/node_modules \
    --exclude=.superpowers \
    -czf "/tmp/${ARCHIVE_NAME}" -C . .

echo "🚀 2. Subiendo paquete a VPS (${VPS_IP})..."
scp -o StrictHostKeyChecking=no "/tmp/${ARCHIVE_NAME}" "${VPS_USER}@${VPS_IP}:/root/${ARCHIVE_NAME}"

echo "🔄 3. Descomprimiendo y reiniciando servicios en VPS..."
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" "
  mkdir -p ${VPS_PATH} && \
  tar -xzf /root/${ARCHIVE_NAME} -C ${VPS_PATH} && \
  cd ${VPS_PATH} && \
  npm run build-frontend && \
  pm2 restart beantag
"

rm -f "/tmp/${ARCHIVE_NAME}"
echo "✨ ¡Actualización despegada con éxito en VPS!"
