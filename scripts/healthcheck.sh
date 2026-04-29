#!/bin/bash

export PATH=/home/jorge/.nvm/versions/node/v24.13.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PM2_HOME=/home/jorge/.pm2

PM2=/usr/local/lib/node_modules/pm2/bin/pm2
LOG=/home/jorge/patakus/scripts/healthcheck.log

check_and_restart() {
  local name=$1
  local port=$2

  if ! curl -s -o /dev/null --max-time 5 http://localhost:$port; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$name] offline — a reiniciar..." >> $LOG
    $PM2 restart $name >> $LOG 2>&1
  fi
}

check_and_restart patakus-api 3001
check_and_restart patakus-web 3000
