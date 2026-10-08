#!/bin/sh
set -eu

# nginx needs an explicit resolver address to resolve ${API_UPSTREAM} at
# request time. Reuse the container's DNS server (Docker, Railway, k8s, ...).
# Prefer the first IPv4 nameserver; nginx needs IPv6 addresses bracketed
# with an explicit port, so IPv6 is only used when no IPv4 is listed.
RESOLVER_ADDR="$(
  awk '
    /^[ \t]*nameserver/ {
      ip = $2
      if (ip ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/ && !v4) v4 = ip
      if (ip ~ /:/ && !v6) v6 = ip
    }
    END {
      if (v4 != "") print v4
      else if (v6 != "") print "[" v6 "]:53"
      else print "1.1.1.1"
    }
  ' /etc/resolv.conf
)"
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
