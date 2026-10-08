#!/bin/sh
set -eu

# nginx needs an explicit resolver address to resolve ${API_UPSTREAM} at
# request time. Reuse the container's DNS server (Docker, Railway, k8s, ...).
RESOLVER_ADDR="$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)"
export RESOLVER_ADDR="${RESOLVER_ADDR:-1.1.1.1}"

# Normalize the upstream: any path in proxy_pass (including a trailing '/')
# would be treated as a URI and replace the request path.
API_UPSTREAM="${API_UPSTREAM:-http://backend.railway.internal:3000}"
while [ "${API_UPSTREAM%/}" != "$API_UPSTREAM" ]; do
  API_UPSTREAM="${API_UPSTREAM%/}"
done
export API_UPSTREAM

# The stock entrypoint renders /etc/nginx/templates/*.template with envsubst.
exec /docker-entrypoint.sh nginx -g 'daemon off;'
