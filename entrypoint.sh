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
    # Disable FK + strip CR then import; || true for harmless errors
    (echo "SET session_replication_role = replica;"; tr -d '\r' < /app/init.sql; echo "SET session_replication_role = DEFAULT;") | PGPASSWORD=kalam psql -h "$DB_HOST" -U kalam -d cursor -f - || true
    echo "✅ Import complete"
    # Fix all sequences to avoid unique constraint conflicts
    echo "🔧 Fixing sequence values..."
    PGPASSWORD=kalam psql -h "$DB_HOST" -U kalam -d cursor <<'EOSQL' >/dev/null 2>&1 || true
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT s.sequence_name, replace(s.sequence_name, '_id_seq', '') AS tbl
    FROM information_schema.sequences s
    WHERE s.sequence_name LIKE '%_id_seq'
    AND s.sequence_name NOT LIKE '%\_%' ESCAPE '\'
  LOOP
    EXECUTE format('SELECT setval(''%I'', COALESCE((SELECT MAX(id) FROM %I), 0) + 1)', r.sequence_name, r.tbl);
  END LOOP;
END $$;
EOSQL
    echo "✅ Sequences fixed"
  else
    echo "⏭️ Data already exists, skipping import"
  fi
fi

echo "🌱 Seeding users..."
node prisma/seed.js

echo "🚀 Starting Next.js..."
exec node --max-old-space-size=4096 server.js
