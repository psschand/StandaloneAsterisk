FROM andrius/asterisk:stable

# Install additional tools and ODBC/MySQL drivers so Asterisk can use Realtime (res_odbc)
USER root
RUN apt-get update && apt-get install -y \
    curl \
    vim \
    unixodbc \
    unixodbc-dev \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    mariadb-client \
    odbcinst \
    netcat-openbsd \
    # Runtime libs for optional Asterisk modules
    libogg0 \
    libvorbis-dev \
    libpq5 \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

# Install MySQL / MyODBC Connector (Connector/ODBC) - download the Debian package for ARM64
RUN set -eux; \
    # Install the Debian-provided MariaDB ODBC driver package (odbc-mariadb) which is available
    # for the base distribution. This avoids external repos and ensures ARM64 compatibility.
    apt-get update; \
    apt-get install -y odbc-mariadb || true;

# Copy configuration and entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy patched ast_logescalator to avoid sed -i issues on mounted files
COPY ast_logescalator /var/lib/asterisk/scripts/ast_logescalator
RUN chmod +x /var/lib/asterisk/scripts/ast_logescalator || true

# Provide a default odbc.ini which will be overridden by a mounted file from the host if present
COPY odbc.ini /etc/odbc.ini

EXPOSE 5060/udp 5060/tcp 10000-20000/udp 5038 8088

ENTRYPOINT ["/entrypoint.sh"]
