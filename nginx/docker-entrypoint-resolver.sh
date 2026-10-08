#!/bin/sh
set -eu

# nginx needs an explicit resolver address to resolve ${API_UPSTREAM} at
# request time. Reuse the container's DNS server (Docker, Railway, k8s, ...).
RESOLVER_ADDR="$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)"
export RESOLVER_ADDR="${RESOLVER_ADDR:-1.1.1.1}"
export PORT="${PORT:-80}"

# The stock entrypoint renders /etc/nginx/templates/*.template with envsubst.
exec /docker-entrypoint.sh nginx -g 'daemon off;'
