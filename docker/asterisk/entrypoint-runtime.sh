#!/usr/bin/env bash
# Runtime entrypoint: generate an internal ODBC ini that points to the mariadb driver
# and export ODBCINI so Asterisk/res_odbc uses the DSN without editing host-mounted /etc files.
set -euo pipefail

# Wait for optional mysql host to be ready if env vars provided
MYSQL_HOST=${MYSQL_HOST:-}
if [ -n "$MYSQL_HOST" ]; then
  echo "Waiting for MySQL at $MYSQL_HOST:3306..."
  until nc -z "$MYSQL_HOST" 3306; do
    sleep 1
  done
fi

# Create internal odbc ini used by Asterisk
cat > /tmp/odbc_internal.ini <<EOF
[ODBC]
Trace           = 0
TraceFile       = /tmp/odbc_trace.log

[asterisk-connector]
Driver = MariaDB Unicode
Server = ${MYSQL_HOST:-mysql}
Database = ${MYSQL_DATABASE:-callcenter}
User = ${MYSQL_USER:-callcenter}
Password = ${MYSQL_PASSWORD:-callcenter123}
Port = ${MYSQL_PORT:-3306}

EOF

export ODBCINI=/tmp/odbc_internal.ini

# Ensure the safe ast_logescalator is executable
if [ -f /var/lib/asterisk/scripts/ast_logescalator ]; then
  chmod +x /var/lib/asterisk/scripts/ast_logescalator || true
fi

exec "$@"
