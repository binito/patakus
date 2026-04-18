#!/usr/bin/env bash
# Script de deploy para o Raspberry Pi
# Uso: ./deploy/deploy.sh

set -euo pipefail

REPO_DIR="/home/jorge/patakus"

echo "==> A actualizar código..."
cd "$REPO_DIR"
git pull origin main

echo "==> A instalar dependências..."
npm ci --legacy-peer-deps

echo "==> A fazer build da API..."
npm run build --workspace=apps/api

echo "==> A aplicar migrations..."
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

echo "==> A fazer build do Web..."
npm run build --workspace=apps/web

echo "==> A reiniciar serviços..."
sudo systemctl restart patakus-api
sudo systemctl restart patakus-web

echo "==> Deploy concluído!"
sudo systemctl status patakus-api --no-pager
sudo systemctl status patakus-web --no-pager
