Asterisk ARM64 build notes

This directory contains a Dockerfile and helper script to build Asterisk from source
for linux/arm64. It's intended as a reproducible build base you can use instead of
prebuilt images when you need specific modules (res_ari, res_odbc, sorcery, chan_pjsip)
that may not be present in upstream prebuilt images for your architecture.

Files added:
- Dockerfile.arm64  : Dockerfile that clones Asterisk (master) and builds it
- build-asterisk-arm64.sh : helper script to run docker buildx for linux/arm64

Assumptions & notes:
- The Dockerfile uses Debian Bookworm Slim as base and installs build tools and
  many -dev libraries including unixODBC and MariaDB client libs.
- The build enables the bundled PJProject to simplify building PJSIP (chan_pjsip)
  and attempts to include SSL/SRTP support.
- Building Asterisk from source can take a long time (15-60+ minutes), depending
  on machine resources and network speed.
- The build script uses docker buildx and creates a builder named
  'multi-arch-builder' if it doesn't exist. It builds for linux/arm64 and
  loads the image locally (--load). You can extend platforms via --platform.

How to build:
1) Ensure docker is running and you have privileges to run docker commands.
2) Make the build script executable: chmod +x build-asterisk-arm64.sh
3) Run the script: ./build-asterisk-arm64.sh call-center-asterisk:arm64

If you want the image to become the service image in your compose setup, update
`docker-compose.yml` asterisk service to use `image: call-center-asterisk:arm64`
instead of building the smaller in-repo Dockerfile.

After building
- Run a container and verify modules:
  docker run --rm -it call-center-asterisk:arm64 bash -c "asterisk -rx 'module show like res_odbc'; asterisk -rx 'module show like func_odbc'; asterisk -rx 'module show like res_pjsip'"

Next steps to enable ARA/ODBC/ARI at runtime:
1) Install and register an ODBC driver (e.g. odbc-mariadb) in the runtime image, or
   add it to your runtime base image. The build image installs unixODBC dev libs
   for compile-time but the runtime still needs the runtime driver.
2) Provide `odbcinst.ini` and `odbc.ini` DSN files and export ODBCINI to point
   to the generated DSN when starting Asterisk.
3) Configure `res_odbc.conf`, `res_config_odbc.conf`, `func_odbc.conf`, and
   `sorcery.conf` to map PJSIP tables to ODBC.

Troubleshooting:
- If the build fails in `make`, rerun without -j to see clearer errors.
- If menuselect disables modules you want, run `menuselect/menuselect` locally
  against the source tree to enable modules before compiling.

Runtime & Troubleshooting (Practical Notes)
-----------------------------------------

This project uses a small runtime image (`Dockerfile.runtime`) derived from the
built Asterisk image. The runtime image must contain the MariaDB ODBC driver
and unixODBC so `res_odbc` / `res_config_odbc` can talk to MariaDB.

Key concepts and mapping chain
- res_odbc.conf contains resource sections (e.g. `[asterisk]`) which define
  the username, password and `dsn => <odbc-dsn-name>` that unixODBC will use.
- `/etc/odbc.ini` (or a generated `/tmp/odbc_internal.ini`) defines the
  actual DSN name and driver mapping (for example `asterisk-connector` pointing
  to the MariaDB ODBC driver `libmaodbc.so`).
- res_config_odbc.conf refers to the res_odbc resource by name (the "resource"
  in res_config_odbc is the section name from res_odbc.conf). For example
  if res_odbc has `[asterisk]` and inside it `dsn => asterisk-connector`, then
  res_config_odbc.conf should use `dsn=asterisk` (not the low-level DSN name).

Common pitfalls we hit
- Avoid runtime scripts that try to `sed -i` files on host bind-mounts. On some
  hosts that triggers EBUSY. Instead generate an internal ODBC ini at startup
  and set `ODBCINI=/tmp/odbc_internal.ini`.
- Sorcery mappings errors: don't include non-standard `type=` lines in
  `sorcery.conf` unless you know the exact wizard names shipped with your
  Asterisk build. An incorrectly-specified wizard can cause `res_pjsip` to
  decline to load with messages like "Wizard 'configuration' could not be
  applied".
- The correct chain for realtime PJSIP with ODBC is:
  sorcery -> res_config_odbc (resource name) -> res_odbc (resource section)
  -> unixODBC DSN -> MariaDB driver

Minimal, repeatable verification commands (run in a container attached to the
Compose network or inside the running service container):

1) Inspect the generated ODBC ini used by the runtime entrypoint:

    cat /tmp/odbc_internal.ini

2) Check unixODBC driver and DSN visibility:

    odbcinst -j
    odbcinst -q -s
    odbcinst -q -d -n "MariaDB Unicode"
    isql -v asterisk-connector <user> <pass>

3) Start Asterisk (high verbosity) and check modules and ODBC status:

    asterisk -cvvvvv
    asterisk -rx "odbc show"
    asterisk -rx "module show like res_odbc"
    asterisk -rx "module show like res_config_odbc"

4) Reload realtime and PJSIP and inspect sorcery activity:

    asterisk -rx "module reload res_odbc"
    asterisk -rx "module reload res_config_odbc"
    asterisk -rx "module reload res_pjsip"
    asterisk -rx "pjsip show endpoints"

If endpoints are not present then enable debug in `res_config_odbc.conf` and
enable verbose/debug in the Asterisk console before reloading; you'll see
the SQL statements res_config_odbc executes and any errors returned by MariaDB.

If `res_pjsip` declines to load:
- Check `/etc/asterisk/pjsip.conf` contains a valid `[global]` and at least one
  transport section (minimal example provided below). An empty or malformed
  pjsip.conf or an invalid sorcery.conf can cause the module to decline.
- Try starting Asterisk with an minimal `pjsip.conf` to confirm the module can
  initialize (this was used as a debug step during development).

Minimal `pjsip.conf` example (for initial module load):

    [global]
    type=global
    max_forwards=70
    keep_alive_interval=90

    [transport-udp]
    type=transport
    protocol=udp
    bind=0.0.0.0:5060

Use this only for bootstrapping and testing - dynamic realtime endpoints are
still provided by MySQL via sorcery/res_config_odbc or `extconfig.conf`.

Notes on approach chosen in the repo
- The runtime entrypoint generates `/tmp/odbc_internal.ini` and exports
  `ODBCINI` so the image doesn't need to edit host `/etc/odbc.ini` (avoids
  permissions and bind-mount EBUSY issues).
- The runtime `Dockerfile.runtime` installs `odbc-mariadb`, `unixodbc`,
  `netcat-openbsd` (used to wait for the DB), and creates an `asterisk` user
  that owns runtime directories.

If you rebuild Asterisk later (common gotchas):
- Ensure you have libs installed for the modules you want (libsrtp2-dev,
  libjwt-dev, libmariadb-dev, unixodbc-dev, etc.) before running `./configure`.
- If menuselect disables chan_pjsip or res_ari, re-run menuselect to enable
  them before `make`.

Final verification (quick):

1) docker-compose up -d
2) docker exec -it asterisk bash -lc "odbcinst -j; cat /tmp/odbc_internal.ini; asterisk -rx 'odbc show'; asterisk -rx 'module show like res_pjsip'; asterisk -rx 'pjsip show endpoints'"

If anything above fails while building or at runtime, paste the exact output
and I will update these notes with the fix.

