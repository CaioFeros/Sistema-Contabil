#!/bin/sh
# wait-for-it.sh
# Script simples para esperar por um serviço TCP.

set -e

host="$1"
shift
cmd="$@"

# Extrai o host e a porta de forma compatível com POSIX (sh)
wait_host=$(echo "$host" | cut -d':' -f1)
wait_port=$(echo "$host" | cut -d':' -f2)

# Espera até que a porta TCP esteja aberta
until nc -z "$wait_host" "$wait_port"; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec $cmd
