# Next Lift — Inventory Management System

Aplikasi manajemen inventaris IT: laptop, PC, lift, UPS, printer, monitor, mouse, CCTV, storage, tools jaringan, stock move, dan serah terima. Dibangun dengan Next.js 14 + Prisma + PostgreSQL.

> **Domain produksi:** [inventaris.kana.my.id](https://inventaris.kana.my.id)
> **Repo:** [github.com/kalam22/next-lift](https://github.com/kalam22/next-lift)

---

## 🚀 Deployment (Docker)

### Prasyarat
- Docker & Docker Compose v2
- Git
- (Opsional) Domain + DNS mengarah ke server

### Clone & Run

Pilih sesuai environment:

**Windows (Docker Desktop) — PostgreSQL di host:**
```bash
docker compose up -d --build
# Akses http://localhost:5001
```
> Base compose (`docker-compose.yml`) konek ke `host.docker.internal:5432` — pastikan PostgreSQL sudah running di Windows.

**Ubuntu Server — PostgreSQL di container:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
# Akses http://inventaris.kana.my.id atau http://<server-ip>:5001
```

### Rebuild Tanpa Cache (setelah kode berubah)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
```

### Arsitektur Container
| Service  | Image                 | Port                | Deskripsi                      |
|----------|-----------------------|---------------------|--------------------------------|
| `app`    | `next-lift-app`       | `5001:3000`         | Next.js 14 standalone          |
| `db`     | `postgres:18`         | `5432:5432`         | PostgreSQL 18                  |
| `nginx`  | `nginx:alpine`        | `80:80`, `443:443`  | Reverse proxy + static uploads |

### File Konfigurasi

| File | Fungsi |
|------|--------|
| `docker-compose.yml` | Base compose (Windows dev — konek ke `host.docker.internal:5432`) |
| `docker-compose.prod.yml` | Override produksi (PostgreSQL container + Nginx + domain env) |
| `Dockerfile` | Multi-stage build: deps → build → runner (standalone) |
| `entrypoint.sh` | Startup script: wait DB → `prisma db push` → import dump → fix sequences → seed users → start |
| `nginx.conf` | Reverse proxy HTTP, serve `/uploads/` langsung, security headers |
| `prisma/seed.js` | Seed 4 user via Prisma `upsert` (admin password selalu reset ke `admin123`) |
| `init.sql` | PostgreSQL dump (laptop, PC, lift, UPS, printer, dll) — ~910 baris |

### Flow Startup (`entrypoint.sh`)
1. ⏳ Tunggu PostgreSQL ready (`pg_isready`)
2. 📦 `prisma db push` — sync schema (auto-create tabel jika belum ada)
3. 📥 Import `init.sql` jika tabel `laptops` masih kosong
   - FK sementara dinonaktifkan (`session_replication_role = replica`)
   - CRLF di-strip (`tr -d '\r'`) sebelum masuk ke psql
4. 🔧 Auto-fix semua sequence ID via `DO $$` block — hindari error P2002
5. 🌱 Seed 4 user via `prisma/seed.js`
6. 🚀 Start Next.js (`node server.js`)

---

## 🔑 Default Credentials

| Username  | Password      | Role       |
|-----------|---------------|------------|
| `admin`   | `admin123`    | superadmin |
| `kalam`   | (bcrypt hash) | user       |
| `rudi`    | (bcrypt hash) | admin      |
| `habib`   | (bcrypt hash) | user       |

> **Catatan:** Password admin selalu di-reset ke `admin123` setiap container restart (via `seed.js` upsert). Password user lain berasal dari dump dan tidak berubah.

---

## 📁 Direktori Uploads

File uploads di-bind mount dari `./public/uploads/` ke container, sehingga persist across restart.

### Copy dari Windows ke server:
```powershell
scp -r d:\Baru\Kalam\next-lift\public\uploads\* khabib@dash-serv:~/next-lift/public/uploads/
```

### Uploads diakses lewat:
- **Nginx (direct):** `http://inventaris.kana.my.id/uploads/filename.pdf` 
  > Nginx serve langsung dari `/usr/share/nginx/uploads/` — tanpa autentikasi, cocok untuk file publik
- **Next.js (auth):** `http://inventaris.kana.my.id/uploads/filename.pdf`
  > Middleware mengecualikan `/uploads` dari auth check (`PUBLIC_PATHS`)

---

## 🔧 Perintah Berguna

### Cek status container
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Lihat log real-time
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f db
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f nginx
```

### Filter log untuk troubleshooting
```bash
# Error & activity log
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs app --tail=50 | grep -i "activity\|error\|P2002"

# Startup sequence
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs app --tail=30 | grep -i "Seeded\|Ready\|import\|schema"
```

### Cek image yang terpasang
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml images app
```

### Query database langsung
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U kalam -d cursor -c "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5;"
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U kalam -d cursor -c "SELECT count(*) FROM laptops;"
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U kalam -d cursor -c "SELECT id, username, role FROM users;"
```

### Import ulang data (tanpa reset DB)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U kalam -d cursor < init.sql
```

### Reset penuh (hapus semua data)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker volume rm next-lift_pgdata
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 🔒 SSL Setup (Certbot + Let's Encrypt)

```bash
# 1. Pastikan DNS inventaris.kana.my.id sudah mengarah ke IP server
#    Cek: dig inventaris.kana.my.id atau nslookup inventaris.kana.my.id

# 2. Stop nginx sementara (port 80 perlu bebas)
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop nginx

# 3. Generate sertifikat
sudo certbot certonly --standalone -d inventaris.kana.my.id

# 4. Copy cert ke folder ssl
sudo cp /etc/letsencrypt/live/inventaris.kana.my.id/fullchain.pem ~/next-lift/ssl/
sudo cp /etc/letsencrypt/live/inventaris.kana.my.id/privkey.pem ~/next-lift/ssl/

# 5. Update nginx.conf → ganti listen 80 ke listen 443 ssl + sertifikat
#    Lalu:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx

# 6. Update NEXTAUTH_URL di docker-compose.prod.yml:
#    NEXTAUTH_URL: "https://inventaris.kana.my.id"
#    NEXT_PUBLIC_APP_URL: "https://inventaris.kana.my.id"
#    Lalu rebuild:
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
```

---

## 🐛 Troubleshooting

### Activity log error: P2002 "Unique constraint failed on fields: (id)"
Sequence ID stale setelah import dump (ID eksplisit di dump tapi sequence masih di awal).
**Fix:** Entrypoint otomatis jalankan `DO $$` block untuk fix semua sequence. Jika masih error, rebuild tanpa cache:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
```

### Login gagal / "CredentialsSignin"
NEXTAUTH_SECRET tidak cocok antara build time dan runtime.
**Fix:** Hardcode `NEXTAUTH_SECRET` di `docker-compose.prod.yml` (sudah dilakukan). Rebuild tanpa cache.

### Logout redirect ke `localhost:5001/login` bukan domain
NEXTAUTH_URL masih `http://localhost:5001`.
**Fix:** Ganti ke `http://inventaris.kana.my.id` di `docker-compose.prod.yml` (sudah dilakukan).

### Uploads tidak muncul / 404
Middleware memblokir `/uploads/` atau bind mount belum diterapkan.
**Fix:** 
- Pastikan `/uploads` ada di `PUBLIC_PATHS` di `middleware.ts` ✅
- Pastikan `./public/uploads:/app/public/uploads` di bind mount ✅
- Gunakan `--force-recreate` setelah mengubah volume:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
  ```

### Container `app` restart terus / "Database ready" tidak muncul
PostgreSQL belum ready saat app mencoba konek.
**Fix:** Pastikan `depends_on: db (condition: service_healthy)` ada di `docker-compose.prod.yml`. Entrypoint akan retry `pg_isready` setiap 2 detik.

### CRLF error saat import SQL
File `init.sql` dibuat di Windows (CRLF `\r\n`), tapi psql di Linux tidak menerima CR.
**Fix:** Entrypoint sudah menggunakan `tr -d '\r'` untuk strip CR sebelum piping ke psql.

---

## 💻 Development (Windows)

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env → sesuaikan DATABASE_URL ke PostgreSQL lokal

# Generate Prisma client
npx prisma generate

# Push schema
npx prisma db push

# Run dev server
npm run dev
# Akses http://localhost:3000
```

> **Catatan:** PostgreSQL harus running di `localhost:5432`. Di Windows bisa menggunakan PostgreSQL installer atau Docker container.

### Docker Compose (Windows Dev)
```bash
# Gunakan base compose saja (konek ke host.docker.internal)
docker compose up -d --build
# Akses http://localhost:5001
```

---

## 🛠️ Tech Stack

| Kategori     | Teknologi                       |
|--------------|---------------------------------|
| Framework    | Next.js 14.2.35 (App Router)    |
| Language     | TypeScript 5.5                  |
| Styling      | Tailwind CSS 3.4                |
| ORM          | Prisma 5.22                     |
| Database     | PostgreSQL 18                   |
| Auth         | NextAuth.js 4.24 (Credentials + JWT) |
| UI Library   | Radix UI, Lucide React, Headless UI |
| Chart        | Recharts 3.7                    |
| Excel        | ExcelJS 4.4                     |
| PDF/Docx     | Docxtemplater 3.68               |
| Validation   | Zod 4.3                         |
| Forms        | React Hook Form 7.52            |
| Security     | bcryptjs, rate limiting, CSP, security headers |
| Deployment   | Docker Compose + Nginx          |

---

## 📦 Fitur

### Manajemen Inventaris
- 💻 **Laptops** — merk, prosesor, SN, SSD/HDD, RAM, untuk, site, departemen, PO, status
- 🖥️ **PCs** — merk, prosesor, SSD/HDD, RAM, monitor, printer, keyboard, UPS, untuk, site, departemen, PO, status
- 🔄 **History PC & Laptop** — riwayat perpindahan perangkat (PIC, site, departemen, tanggal) dengan edit & delete
- 🛗 **Lifts** — tipe, kapasitas, lantai, area, status
- 🔌 **UPS** — tipe, kapasitas, lokasi, status
- 🖨️ **Printer** — tipe, lokasi, divisi, status
- 🖥️ **Monitor** — tipe, ukuran, SN, divisi, status
- 🖱️ **Mouse** — tipe (wired/wireless), divisi
- 📹 **CCTV** — tipe, lokasi, IP, status
- 💾 **Storage** — tipe (NAS/DAS), kapasitas, IP
- 🔧 **Tools Jaringan** — switch, router, access point, kabel

### Fitur Lain
- 📦 **Stock Move** — pencatatan barang MASUK/KELUAR dengan vendor & tipe barang
- 📝 **Serah Terima** — handover barang dengan PDF tanda tangan
- 📊 **Activity Log** — semua CREATE/UPDATE/DELETE tercatat termasuk history edit/delete
- 📥 **Export/Import Excel** — backup & restore data via Excel
- 🖼️ **Upload** — gambar & PDF untuk setiap barang
- 🌙 **Dark Mode** — toggle dark/light
- 📱 **Responsive** — mobile-first design
- 🔐 **RBAC** — superadmin, admin, user + permissions per menu
- 🚦 **Rate Limiting** — 120 req/menit per IP untuk API
- 👤 **Activity Tracking** — last login, last active per user
- 🛡️ **Security Headers** — CSP, X-Frame-Options, HSTS, dll

---

## 📂 Struktur Direktori Penting

```
next-lift/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # REST API endpoints
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   └── ...                 # CRUD pages per entity
├── components/             # React components (UI, forms, tables)
├── lib/                    # Utilities (Prisma client, auth, permissions, activity-log)
├── prisma/
│   ├── schema.prisma       # Database schema (~30+ models)
│   └── seed.js             # User seeder
├── public/
│   └── uploads/            # User-uploaded files (images, PDFs)
├── docker-compose.yml      # Base compose (Windows dev)
├── docker-compose.prod.yml # Production override (Ubuntu server)
├── Dockerfile              # Multi-stage Docker build
├── entrypoint.sh           # Container startup script
├── nginx.conf              # Nginx reverse proxy config
├── init.sql                # PostgreSQL data dump
├── middleware.ts            # Auth, RBAC, rate limiting
├── next.config.js          # Next.js config (standalone output, security headers)
└── tailwind.config.ts      # Tailwind CSS configuration
```
