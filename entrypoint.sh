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

echo "🌱 Seeding admin user..."
node prisma/seed.js

# Import data if init.sql exists and tables are empty
if [ -f /app/init.sql ]; then
  COUNT=$(PGPASSWORD=kalam psql -h "$DB_HOST" -U kalam -d cursor -t -A -c "SELECT count(*) FROM laptops;" 2>/dev/null || echo "0")
  if [ "$COUNT" = "0" ]; then
    echo "📥 Importing data from init.sql..."
    PGPASSWORD=kalam psql -h "$DB_HOST" -U kalam -d cursor -f /app/init.sql
    echo "✅ Import complete"
  else
    echo "⏭️ Data already exists, skipping import"
  fi
fi

echo "🚀 Starting Next.js..."
exec node --max-old-space-size=4096 server.js
