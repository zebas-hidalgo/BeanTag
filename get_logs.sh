#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no root@5.189.152.68 "node /var/www/beantag/backend/inspect_db.js"
expect {
    "*password:" {
        send "261226Kz\r"
        exp_continue
    }
    eof
}
