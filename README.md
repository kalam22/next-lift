# Next Lift - Management System

Aplikasi manajemen data lift, laptop, dan baterai laptop yang dimigrasikan dari Laravel Filament ke Next.js.

## 🚀 Fitur Utama

### Data Management
- **Data Lift**: CRUD lengkap untuk data pengguna lift dengan akses lantai dan masa berlaku
- **Data Laptop**: CRUD lengkap untuk data laptop dengan spesifikasi lengkap
- **Data Baterai Laptop**: CRUD lengkap untuk data baterai laptop dengan relasi ke laptop
- **Data Monitor**: CRUD untuk data monitor
- **Data Mouse**: CRUD untuk data mouse

### Fitur Tambahan
- **Bulk Actions**: Hapus multiple data sekaligus (lifts & laptops)
- **Export Excel**: Export data lift ke format Excel
- **Import Excel**: Import data dari file Excel
- **Upload Gambar**: Upload dan preview gambar untuk setiap item
- **Pagination**: Navigasi halaman dengan pagination
- **Search & Filter**: Pencarian dan filter data
- **Sorting**: Pengurutan data berdasarkan kolom
- **Dark Mode**: Tema gelap/terang
- **Responsive Design**: Tampilan optimal di berbagai perangkat

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.35 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **HTTP Client**: Axios
- **UI Components**: Radix UI, Headless UI
- **Icons**: Heroicons, Lucide React
- **Notifications**: SweetAlert2
- **Excel**: ExcelJS, XLSX
- **Date Handling**: date-fns
- **Theme**: next-themes

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm atau yarn

## 🔧 Setup

1. **Clone repository** (jika belum):
```bash
git clone <repository-url>
cd next-lift
```

2. **Install dependencies**:
```bash
npm install
```

3. **Setup environment variables**:
Buat file `.env` di root project dengan konfigurasi berikut:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Setup database (Prisma)**:
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio untuk melihat data
npx prisma studio
```

5. **Run development server**:
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📜 Scripts

- `npm run dev` - Menjalankan development server dengan Turbo mode
- `npm run build` - Build aplikasi untuk production
- `npm run start` - Menjalankan production server
- `npm run lint` - Menjalankan ESLint

## 📁 Struktur Proyek

```
next-lift/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── lifts/         # API untuk data lift
│   │   ├── laptops/       # API untuk data laptop
│   │   ├── baterai-laptops/ # API untuk data baterai laptop
│   │   └── ...
│   ├── lifts/             # Halaman data lift
│   ├── laptops/           # Halaman data laptop
│   └── ...
├── components/            # React components
│   └── LaptopForm.tsx     # Form untuk create/edit laptop
├── prisma/                # Prisma schema & migrations
│   └── schema.prisma      # Database schema
├── public/                # Static files
└── ...
```

## 🗄️ Database

Aplikasi menggunakan Prisma sebagai ORM dengan PostgreSQL sebagai database. Schema database didefinisikan di `prisma/schema.prisma`.

### Models
- `lifts` - Data pengguna lift
- `laptops` - Data laptop
- `baterai_laptops` - Data baterai laptop (relasi dengan laptops)
- `monitors` - Data monitor
- `mice` - Data mouse

## 🔐 Environment Variables

Pastikan untuk mengkonfigurasi environment variables di file `.env`:

- `DATABASE_URL` - Connection string untuk PostgreSQL database
- `NEXT_PUBLIC_APP_URL` - URL aplikasi (untuk development/production)

## 📝 Catatan

- Pastikan database PostgreSQL sudah berjalan sebelum menjalankan aplikasi
- Untuk production, pastikan untuk mengatur environment variables dengan benar
- File upload disimpan di folder `public/uploads` (pastikan folder ini ada dan writable)

## 🤝 Kontribusi

Silakan buat issue atau pull request jika ingin berkontribusi pada proyek ini.

## 📄 License

Private project
