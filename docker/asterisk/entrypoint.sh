#!/bin/bash

#!/usr/bin/env bash

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
while ! nc -z ${MYSQL_HOST:-mysql} ${MYSQL_PORT:-3306}; do
  sleep 1
done
echo "MySQL is ready!"

# Build an internal ODBC config so we don't edit host bind-mounted files in-place
cat > /tmp/odbc_internal.ini <<EOF
cat > /tmp/odbc_internal.ini <<EOF
[asterisk-connector]
Description = MySQL connection to Asterisk
# Use the driver name that unixODBC knows; some installs register 'MariaDB Unicode'
Driver = MariaDB Unicode
# Also provide absolute library path as fallback for unixODBC
Driver64 = /usr/lib/aarch64-linux-gnu/odbc/libmaodbc.so
Server = ${MYSQL_HOST:-mysql}
Database = ${MYSQL_DATABASE:-callcenter}
User = ${MYSQL_USER:-callcenter}
Password = ${MYSQL_PASSWORD:-callcenterpass}
Port = ${MYSQL_PORT:-3306}
OPTION = 3
EOF

# Point unixODBC to the internal config
export ODBCINI=/tmp/odbc_internal.ini

# Write res_odbc.conf based on environment
cat > /etc/asterisk/res_odbc.conf <<EOF
[asterisk]
enabled => yes
dsn => asterisk-connector
username => ${MYSQL_USER:-callcenter}
password => ${MYSQL_PASSWORD:-callcenterpass}
pre-connect => yes
max_connections => 20
EOF

# If no command given, run asterisk in foreground; otherwise exec provided command

# Generate self-signed TLS certificates for PJSIP/SIP TLS transport if they don't exist
if [ ! -f /etc/asterisk/keys/asterisk.crt ] || [ ! -f /etc/asterisk/keys/asterisk.key ]; then
  echo "Generating self-signed TLS certificates for SIP TLS..."
  mkdir -p /etc/asterisk/keys
  openssl req -new -x509 -days 365 -nodes \
    -out /etc/asterisk/keys/asterisk.crt \
    -keyout /etc/asterisk/keys/asterisk.key \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=asterisk.local"
  chmod 600 /etc/asterisk/keys/asterisk.key
  chmod 644 /etc/asterisk/keys/asterisk.crt
  echo "TLS certificates generated at /etc/asterisk/keys/"
fi

if [ "$#" -eq 0 ]; then
  exec asterisk -f
else
  exec "$@"
fi
