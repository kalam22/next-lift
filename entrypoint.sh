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
    # Strip CR (fixes Windows line endings) then import; || true for harmless errors
    tr -d '\r' < /app/init.sql | PGPASSWORD=kalam psql -h "$DB_HOST" -U kalam -d cursor -f - || true
    echo "✅ Import complete"
    # Fix all sequences to avoid unique constraint conflicts
    echo "🔧 Fixing sequence values..."
    PGPASSWORD=kalam psql -h "$DB_HOST" -U kalam -d cursor <<'EOSQL' >/dev/null 2>&1 || true
SELECT setval('laptops_id_seq', COALESCE((SELECT MAX(id) FROM laptops), 0) + 1);
SELECT setval('lifts_id_seq', COALESCE((SELECT MAX(id) FROM lifts), 0) + 1);
SELECT setval('pcs_id_seq', COALESCE((SELECT MAX(id) FROM pcs), 0) + 1);
SELECT setval('monitor_id_seq', COALESCE((SELECT MAX(id) FROM monitor), 0) + 1);
SELECT setval('ups_id_seq', COALESCE((SELECT MAX(id) FROM ups), 0) + 1);
SELECT setval('printer_id_seq', COALESCE((SELECT MAX(id) FROM printer), 0) + 1);
SELECT setval('cctv_id_seq', COALESCE((SELECT MAX(id) FROM cctv), 0) + 1);
SELECT setval('storage_id_seq', COALESCE((SELECT MAX(id) FROM storage), 0) + 1);
SELECT setval('mouse_id_seq', COALESCE((SELECT MAX(id) FROM mouse), 0) + 1);
SELECT setval('handovers_id_seq', COALESCE((SELECT MAX(id) FROM handovers), 0) + 1);
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1);
SELECT setval('user_permissions_id_seq', COALESCE((SELECT MAX(id) FROM user_permissions), 0) + 1);
SELECT setval('stock_transactions_id_seq', COALESCE((SELECT MAX(id) FROM stock_transactions), 0) + 1);
SELECT setval('activity_logs_id_seq', COALESCE((SELECT MAX(id) FROM activity_logs), 0) + 1);
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
