#!/usr/bin/env bash
#
# Triagem do CVE-2026-42533 (heap buffer overflow no nginx com `map` + regex).
#
# Afecta nginx 0.9.6 até 1.31.2. Corrigido em 1.30.4 (stable) e 1.31.3 (mainline).
# A exploração exige uma config que use `map` com regex matching e que depois
# inclua a variável do map numa string expression a seguir a uma captura
# afectada por esse map.
#
# Uso (no Raspberry Pi):  sudo ./scripts/check-nginx-cve.sh
# Read-only: não altera nada no sistema.
#
# Exit codes: 0 = OK | 1 = atenção (rever manualmente) | 2 = vulnerável
#
# Refs: https://nginx.org/en/security_advisories.html
#       https://my.f5.com/manage/s/article/K000162097

set -euo pipefail

FIX_STABLE="1.30.4"
FIX_MAINLINE="1.31.3"
FIRST_VULN="0.9.6"

TMPDIR_CVE=$(mktemp -d)
trap 'rm -rf "$TMPDIR_CVE"' EXIT

# $1 < $2 ?
ver_lt() {
  [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -1)" = "$1" ]
}

echo "=== Triagem CVE-2026-42533 (nginx) ==="
echo

# ---------------------------------------------------------------------------
# 1. Versão do nginx
# ---------------------------------------------------------------------------

if ! command -v nginx >/dev/null 2>&1; then
  echo "nginx não encontrado no PATH — nada a verificar."
  exit 0
fi

VERSION=$(nginx -v 2>&1 | sed -nE 's|.*nginx/([0-9]+\.[0-9]+\.[0-9]+).*|\1|p')

if [ -z "$VERSION" ]; then
  echo "AVISO: não foi possível determinar a versão do nginx." >&2
  echo "  Saída de 'nginx -v': $(nginx -v 2>&1)" >&2
  exit 1
fi

SERIES=$(echo "$VERSION" | cut -d. -f1,2)
echo "Versão upstream reportada: $VERSION (série $SERIES)"

version_vulnerable=0
pre_feature=0
if ver_lt "$VERSION" "$FIRST_VULN"; then
  pre_feature=1
elif [ "$SERIES" = "1.30" ]; then
  ver_lt "$VERSION" "$FIX_STABLE" && version_vulnerable=1
elif [ "$SERIES" = "1.31" ]; then
  ver_lt "$VERSION" "$FIX_MAINLINE" && version_vulnerable=1
elif ver_lt "$VERSION" "1.30.0"; then
  version_vulnerable=1
fi

if [ "$version_vulnerable" -eq 1 ]; then
  echo "  -> Abaixo do fix upstream ($FIX_STABLE stable / $FIX_MAINLINE mainline)."
elif [ "$pre_feature" -eq 1 ]; then
  echo "  -> Anterior a $FIRST_VULN, antes de o regex no 'map' existir. Não afectada."
else
  echo "  -> Igual ou acima do fix upstream. OK."
fi
echo

# ---------------------------------------------------------------------------
# 2. Versão do pacote da distro (backports)
# ---------------------------------------------------------------------------
# Debian / Raspberry Pi OS aplicam correcções de segurança sem subir o número
# de versão upstream. Um `nginx -v` a dizer 1.22.1 não prova nada por si só.

backport_unknown=0
if command -v dpkg-query >/dev/null 2>&1; then
  PKG_VERSION=$(dpkg-query -W -f='${Version}' nginx-core 2>/dev/null \
             || dpkg-query -W -f='${Version}' nginx 2>/dev/null \
             || true)
  if [ -n "$PKG_VERSION" ]; then
    echo "Versão do pacote Debian/RPi OS: $PKG_VERSION"
    if [ "$version_vulnerable" -eq 1 ]; then
      backport_unknown=1
      echo "  NOTA: a distro faz backport de correcções sem mudar a versão upstream."
      echo "  Para confirmar se o fix já está aplicado, verifica o changelog:"
      echo "      apt-get changelog nginx | grep -i -m5 'CVE-2026-42533'"
      echo "  Ou simplesmente actualiza (ver secção final)."
    fi
    echo
  fi
fi

# ---------------------------------------------------------------------------
# 3. Config efectiva: procurar `map` com regex
# ---------------------------------------------------------------------------

CONF="$TMPDIR_CVE/nginx-T.conf"
if ! nginx -T >"$CONF" 2>"$TMPDIR_CVE/nginx-T.err"; then
  echo "AVISO: 'nginx -T' falhou — a config não pôde ser analisada." >&2
  sed 's/^/  /' "$TMPDIR_CVE/nginx-T.err" >&2
  echo "  Provavelmente precisas de correr este script com sudo." >&2
  exit 1
fi

# Normalizar: remover comentários e espaços à volta.
NORM="$TMPDIR_CVE/nginx-norm.conf"
sed -E 's/#.*$//; s/^[[:space:]]+//; s/[[:space:]]+$//; /^$/d' "$CONF" >"$NORM"

# Extrair os maps que usam regex matching. Saída: "<var_saida>\t<var_origem>"
REGEX_MAPS="$TMPDIR_CVE/regex-maps.txt"
awk '
  inmap == 0 {
    if ($0 ~ /^map[[:space:]]+\$[^[:space:]]+[[:space:]]+\$[^[:space:]]+/) {
      src = $2
      dst = $3
      sub(/\{.*$/, "", dst)
      inmap = 1
      isregex = 0
    }
    next
  }
  # dentro do bloco map
  /^\}/ {
    if (isregex) print substr(dst, 2) "\t" src
    inmap = 0
    next
  }
  /^~/ { isregex = 1 }
' "$NORM" >"$REGEX_MAPS"

if [ ! -s "$REGEX_MAPS" ]; then
  echo "Config: nenhum bloco 'map' com regex matching encontrado."
  echo "  -> O padrão exigido pelo CVE-2026-42533 não está presente."
  echo
  if [ "$version_vulnerable" -eq 1 ]; then
    echo "RESULTADO: ATENÇÃO"
    echo "  Versão potencialmente vulnerável, mas a config não expõe o padrão"
    echo "  necessário para exploração. Risco prático baixo — actualiza na mesma."
    RESULT=1
  else
    echo "RESULTADO: OK"
    echo "  Versão corrigida e config sem o padrão vulnerável."
    RESULT=0
  fi
else
  echo "Config: encontrados blocos 'map' com regex matching:"
  while IFS=$'\t' read -r dst src; do
    echo "  - map $src \$$dst"
  done <"$REGEX_MAPS"
  echo

  # Uma string expression que use a variável do map JUNTO com uma captura
  # ($1..$9) é o padrão perigoso.
  exposed=0
  while IFS=$'\t' read -r dst _src; do
    hits=$(grep -nE "\\\$\{?${dst}\}?\b" "$NORM" | grep -E '\$[1-9]' || true)
    if [ -n "$hits" ]; then
      exposed=1
      echo "  PADRÃO PERIGOSO: \$$dst usado na mesma expressão que uma captura:"
      echo "$hits" | sed 's/^/      /'
    fi
  done <"$REGEX_MAPS"
  echo

  if [ "$exposed" -eq 1 ] && [ "$version_vulnerable" -eq 1 ]; then
    echo "RESULTADO: VULNERÁVEL"
    echo "  Versão abaixo do fix E config com map regex + captura reutilizada."
    RESULT=2
  elif [ "$version_vulnerable" -eq 1 ]; then
    echo "RESULTADO: ATENÇÃO"
    echo "  Versão abaixo do fix e existem maps com regex, mas não foi detectada"
    echo "  reutilização da variável do map junto com uma captura."
    echo "  A detecção é heurística — revê os maps listados acima manualmente."
    RESULT=1
  else
    echo "RESULTADO: OK"
    echo "  Existem maps com regex, mas a versão do nginx já inclui o fix."
    RESULT=0
  fi
fi

if [ "$backport_unknown" -eq 1 ] && [ "${RESULT}" -ne 0 ]; then
  echo
  echo "  (lembrete: a versão do pacote pode já conter o fix via backport)"
fi

# ---------------------------------------------------------------------------
# 4. Remediação
# ---------------------------------------------------------------------------

if [ "$RESULT" -ne 0 ]; then
  cat <<'EOF'

--- Remediação ---

  sudo apt update
  sudo apt install --only-upgrade nginx
  sudo nginx -t
  sudo systemctl reload nginx     # reload, não restart — não corta ligações

Mitigação temporária, se o upgrade não estiver disponível: usar capturas
nomeadas nos regex dos blocos map, em vez de $1..$9.

  map $uri $destino {
      ~^/antigo/(?<resto>.*)$   /novo/$resto;   # em vez de  /novo/$1
  }
EOF
fi

exit "$RESULT"
