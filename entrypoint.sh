#!/bin/sh
set -e

# Determine DB host: if 'db' resolves, use it; otherwise fall back to host.docker.internal
DB_HOST="db"
if ! getent hosts "$DB_HOST" >/dev/null 2>&1; then
  DB_HOST="host.docker.internal"
fi

echo "⏳ Waiting for PostgreSQL at $DB_HOST..."
until PGPASSWORD=kalam psql -h "$DB_HOST" -U kalam -d cursor -c '\q' 2>/dev/null; do
  sleep 2
done
echo "✅ Database ready"

echo "📦 Syncing schema..."
node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate
echo "✅ Schema synced"

# Import data if init.sql exists and laptops table is empty
if [ -f /app/init.sql ]; then
  COUNT=$(PGPASSWORD=kalam psql -h "$DB_HOST" -U kalam -d cursor -t -A -c "SELECT count(*) FROM laptops;" 2>/dev/null || echo "0")
  if [ "$COUNT" = "0" ]; then
    echo "📥 Importing data from init.sql..."
    # Convert CRLF → LF (fixes Windows line-ending issues in Linux psql)
    sed -i 's/\r$//' /app/init.sql
    # || true so harmless errors don't crash container (e.g. setval on non-existent seq)
    PGPASSWORD=kalam psql -h "$DB_HOST" -U kalam -d cursor -f /app/init.sql || true
    echo "✅ Import complete"
  else
    echo "⏭️ Data already exists, skipping import"
  fi
fi

echo "🌱 Seeding users..."
node prisma/seed.js

echo "🚀 Starting Next.js..."
exec node --max-old-space-size=4096 server.js
