#!/bin/bash

export PATH=/home/jorge/.nvm/versions/node/v24.13.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PM2_HOME=/home/jorge/.pm2

PM2=/usr/local/lib/node_modules/pm2/bin/pm2
LOG=/home/jorge/patakus/scripts/healthcheck.log
NOTIFY=/home/jorge/scripts/notify.sh
STATE_DIR=/home/jorge/scripts/.state
SILENCIO=1800  # segundos entre avisos do mesmo serviço (este script corre de 2 em 2 min)

mkdir -p "$STATE_DIR"

# Só notifica se já passou SILENCIO desde o último aviso deste serviço.
# Sem isto, um serviço em baixo geraria um aviso a cada 2 minutos.
notificar_com_limite() {
  local name=$1
  local marca="$STATE_DIR/ultimo-aviso-$name"
  local agora=$(date +%s)
  local anterior=0

  [ -f "$marca" ] && anterior=$(cat "$marca" 2>/dev/null || echo 0)

  if [ $(( agora - anterior )) -ge "$SILENCIO" ]; then
    echo "$agora" > "$marca"
    [ -x "$NOTIFY" ] && "$NOTIFY" "Patakus: servico reiniciado" \
      "$name estava offline e foi reiniciado automaticamente as $(date '+%H:%M')." \
      "high" "arrows_counterclockwise"
  fi
}

# -f faz o curl falhar em respostas >= 400. Sem isto um 404/500 contava como
# saudável e só uma porta fechada era detetada.
check_and_restart() {
  local name=$1
  local port=$2
  local path=$3

  if ! curl -sf -o /dev/null --max-time 5 "http://localhost:$port$path"; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$name] offline — a reiniciar..." >> $LOG
    $PM2 restart $name >> $LOG 2>&1
    notificar_com_limite "$name"
  fi
}

# /health valida também a ligação à base de dados; a raiz da API não tem rota.
check_and_restart patakus-api 3001 /health
check_and_restart patakus-web 3000 /
