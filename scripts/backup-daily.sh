#!/usr/bin/env bash
set -e

DB_FILE="/var/www/beantag/backend/database.sqlite"
BACKUP_DIR="/var/www/beantag/backups"

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/beantag-backup-$TIMESTAMP.sqlite.gz"

if [ -f "$DB_FILE" ]; then
    sqlite3 "$DB_FILE" ".backup '$BACKUP_DIR/temp.db'"
    gzip -c "$BACKUP_DIR/temp.db" > "$BACKUP_FILE"
    rm -f "$BACKUP_DIR/temp.db"
    echo "✅ Backup created successfully at $BACKUP_FILE"
else
    echo "❌ Database file not found!"
    exit 1
fi

# Retention policy: 30 days
find "$BACKUP_DIR" -type f -name "beantag-backup-*.sqlite.gz" -mtime +30 -delete
echo "🧹 Old backups pruned."
