#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/home/jorge/backups/patakus-db"
DB_NAME="patakus"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

# Ler password da variável de ambiente ou do .env da API
if [ -z "${DB_PASSWORD:-}" ]; then
  ENV_FILE="/home/jorge/patakus/apps/api/.env"
  if [ -f "$ENV_FILE" ]; then
    DB_PASSWORD=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed -E 's|.*:([^:@]+)@.*|\1|')
  fi
fi

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "[backup-db] ERRO: DB_PASSWORD não encontrada" >&2
  exit 1
fi

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz"

mysqldump \
  --user=root \
  --password="$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[backup-db] Backup criado: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Remover backups com mais de KEEP_DAYS dias
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
echo "[backup-db] Backups com mais de ${KEEP_DAYS} dias removidos"
