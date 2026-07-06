#!/usr/bin/expect -f
set timeout 300

# 1. Comprimir en local
exec tar --exclude=node_modules --exclude=.git --exclude=frontend/node_modules --exclude=backend/node_modules --exclude=.superpowers -czf /tmp/beantag_update.tar.gz -C /Users/zebas/Desktop/Proyecto_cafe .


# 2. Subir archivo
spawn scp -o StrictHostKeyChecking=no /tmp/beantag_update.tar.gz root@5.189.152.68:/root/beantag_update.tar.gz
expect {
    "*password:" {
        send "261226Kz\r"
        exp_continue
    }
    eof
}

# 3. Extraer y compilar en VPS
spawn ssh -o StrictHostKeyChecking=no root@5.189.152.68 "tar -xzf /root/beantag_update.tar.gz -C /var/www/beantag && cd /var/www/beantag && npm run build-frontend && pm2 restart beantag"
expect {
    "*password:" {
        send "261226Kz\r"
        exp_continue
    }
    eof
}

puts "=== ¡Actualización subida y desplegada en tu VPS! ==="
