# CRMForU — Political & Organizational CRM System
### Integrated Activity Planner, Budget Planning (RAB) & Official Document Generator (.docx)

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-green?style=flat)](https://orm.drizzle.team/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Private-red)](#)

Sistem aplikasi web modern untuk manajemen partai dan organisasi yang mengintegrasikan perencanaan kegiatan lapangan (*Activity Planner*), penyusunan rancangan anggaran belanja (*Budget Planning / RAB*), serta pembuatan dokumen surat dinas resmi berstandar Microsoft Word (*Native OpenXML .docx Engine*) sesuai dengan Product Requirements Document (PRD) v1.0.

---

## 🎯 Fitur & Modul Utama

### 1. 📅 Modul Activity Planner (Perencanaan Kegiatan)
- **CRUD Kegiatan Lengkap**: Judul, kategori, tanggal dan waktu pelaksanaan, lokasi, penanggung jawab (PIC), dan status (*Draft, Terjadwal, Berjalan, Selesai, Dibatalkan*).
- **Checklist Persiapan Operasional**: Pelacakan tugas-tugas singkat sebelum hari-H kegiatan dengan indikator kemajuan (*progress bar*) visual.
- **Quick Action Links**: Pintasan langsung satu klik menuju *"Rencana Budget"* dan *"Buat Surat Terkait"* dengan auto-binding parameter ID kegiatan.
- **Pencarian & Filter Cepat**: Filter pencarian ter-debounce instan dan filter kategori/status responsif.

### 2. 💰 Modul Budget Planning (Perencanaan Anggaran / RAB)
- **Struktur Anggaran Terhubung**: Setiap baris item belanja terikat langsung ke `activity_id` kegiatan terkait.
- **Itemisasi Presisi**: Klasifikasi kategori pengeluaran (*Konsumsi, Perlengkapan, Transportasi, Honorarium, Publikasi, dsb.*) dengan kalkulasi otomatis `Qty × Satuan = Estimasi Subtotal`.
- **Summary Bar Real-Time**:
  - Total Estimasi (Pagu Anggaran)
  - Total Realisasi (Biaya Aktual)
  - Margin Selisih (*Surplus / Defisit*) dengan indikator status keuangan visual.
- **Reusable Budget Items (Smart Autofill)**: Rekomendasi otomatis satuan baku dan riwayat harga satuan terkini saat mengetik nama item belanja.

### 3. 📄 Modul Pembuat Surat & Native OpenXML Word Generator (.docx)
- **Autofill Dinamis Lintas Modul**: Variabel nama kegiatan, tanggal, waktu, lokasi, dan total anggaran otomatis tersinkronisasi ke dalam draf surat.
- **Penyisipan Tabel RAB Otomatis**: Kemampuan menyisipkan tabel rincian anggaran belanja langsung ke dalam badan surat resmi secara instan.
- **Live Preview Kertas Fisik (A4 / F4)**: Pratinjau cetak visual di antarmuka web yang akurat mencerminkan dimensi fisik kertas (termasuk ukuran F4 / Folio Indonesia: 215 × 330 mm).
- **Standar Engineering Native .docx (OpenXML)**:
  1. Ukuran kertas A4 dan F4 dengan kalkulasi margin presisi dalam satuan *twips/millimeters*.
  2. Kop surat dan baris atribut (*Nomor*, *Lampiran*, *Perihal*) diformat menggunakan *borderless table grid* sehingga titik dua (`:`) sejajar rapi di seluruh versi Microsoft Word dan LibreOffice.
  3. Blok tanda tangan menggunakan *invisible table grid* agar tidak bergeser saat dokumen dibuka atau disunting ulang pengguna.
  4. Tabel RAB dilengkapi atribut `tblHeader: true` dan `cantSplit: true` untuk perulangan baris header otomatis saat tabel memotong halaman baru.

### 4. 👥 Modul Direktori Keanggotaan & Kader (Member Directory)
- **Database Anggota Lengkap**: NIK, Nama lengkap, Nomor KTA, Daerah Pemilihan (Dapil), Nomor Kontak/WhatsApp, Status Keanggotaan, dan Wilayah Domisili.
- **Import Massal Excel (.xlsx)**: Unggah data kader massal dari lembar kerja Excel dengan pemetaan kolom cerdas dan validasi data terintegrasi.
- **Pencarian & Filter Cepat**: Penyaringan instan berdasarkan nama, wilayah dapil, atau status keanggotaan.

### 5. ⚙️ Template Manager & Pengaturan Lembaga
- Kustomisasi kop surat resmi instansi/partai/organisasi, logo, alamat, kontak, nama pejabat penandatangan, NIP/NRP, serta penetapan default format kertas.

### 6. 🔐 Multi-User Authentication & Enterprise RBAC (Role-Based Access Control)
- **Sesi Terenkripsi**: JWT (`jose`) dan HTTP-only Secure Cookies dengan proteksi kedaluwarsa otomatis.
- **5 Tingkat Peran Hierarkis**:
  1. `superadmin`: Akses penuh sistem, manajemen user, dan seluruh wilayah.
  2. `admin_dpc`: Pengurus tingkat Kota/Kabupaten (akses data se-kota/kabupaten).
  3. `admin_pac`: Pengurus tingkat Kecamatan (akses data se-kecamatan).
  4. `operator`: Petugas entri data kegiatan, RAB, dan kader.
  5. `viewer`: Hak akses lihat/baca saja (*read-only*).
- **Proteksi Brute-Force**: In-memory rate limiting pada endpoint login untuk mencegah serangan pembobolan kata sandi.
- **User Manager UI**: Manajemen akun pengguna, status aktif/non-aktif, dan penugasan wilayah administratif.
- **Supabase Production Sync**: Berkas SQL resmi `supabase_schema.sql` dan perintah `pnpm run db:sync` untuk migrasi data instan ke Supabase.

---

## 🏗️ Struktur Arsitektur Proyek

```
crmforu/
├── app/
│   ├── api/                   # Route Handlers Next.js App Router
│   │   ├── activities/        # REST API endpoints untuk Kegiatan
│   │   ├── auth/              # Otentikasi (login, logout, register, me)
│   │   ├── autofill/          # Smart suggestions untuk item belanja
│   │   ├── budget/            # REST API endpoints untuk RAB
│   │   ├── documents/         # Generator file .docx native OpenXML
│   │   ├── health/            # Healthcheck database & server
│   │   ├── members/           # REST API endpoints untuk Data Anggota/Kader
│   │   ├── templates/         # Pengaturan template kop surat
│   │   └── users/             # REST API endpoints untuk Manajemen User & RBAC
│   ├── globals.css            # Desain sistem & Tailwind CSS v4 tokens
│   ├── layout.tsx             # Root layout dengan ToastProvider
│   ├── page.tsx               # Dashboard utama & modular tab navigator
│   └── todos/                 # Supabase integration test page
├── components/
│   ├── activities/            # Komponen Activity Planner & modal form
│   ├── auth/                  # Komponen Login Page & otentikasi
│   ├── budget/                # Komponen RAB & Summary Bar keuangan
│   ├── documents/             # Editor surat & Live A4/F4 paper preview
│   ├── members/               # Direktori Anggota, KTA & Modal Import Excel
│   ├── templates/             # Panel kustomisasi template surat
│   ├── ui/                    # UI atomics (Toast, Modal, Badges, Tabs, Skeleton, ConfirmDialog)
│   ├── users/                 # Komponen User Management & Role Assignment
│   └── Navbar.tsx             # Global navigation bar dengan RBAC awareness
├── docs/                      # Dokumentasi & PRD resmi proyek
├── lib/
│   ├── auth/                  # JWT signing, RBAC roles, rate-limit & validation
│   ├── constants/             # Master data wilayah administratif Kalimantan Barat
│   ├── db/                    # Drizzle ORM schema, migrations & resilient store
│   └── excel/                 # Parser & validator file Excel (.xlsx) data anggota
├── scripts/                   # Script utilitas sinkronisasi Supabase & test login
├── supabase_schema.sql        # Skema DDL & Initial Data lengkap Supabase
├── utils/
│   └── supabase/              # Supabase SSR client, server, and middleware
├── docker-compose.yml         # Container PostgreSQL lokal
├── drizzle.config.ts          # Konfigurasi Drizzle Kit
├── package.json               # Dependensi & script eksekusi
└── .env.example               # Template variabel lingkungan aman
```

---

## 🛠️ Konfigurasi Variabel Lingkungan (`.env`)

Salin file `.env.example` menjadi `.env.local` sebelum menjalankan aplikasi:

```bash
cp .env.example .env.local
```

| Variabel | Keterangan | Nilai Standar / Contoh |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string PostgreSQL (Lokal / Neon / Supabase) | `postgresql://postgres:postgrespassword@localhost:5432/crmforu` |
| `AUTH_SECRET` | Kunci rahasia minimal 32 karakter untuk enkripsi JWT | `crmforu_super_secret_jwt_key_32chars_min_length_2026` |
| `NEXT_PUBLIC_APP_URL` | Base URL aplikasi | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL endpoint proyek Supabase | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public/Anon API key Supabase | `your-publishable-key` |

> 🔒 **Perhatian Keamanan**: File `.env.local` dan seluruh file berakhiran `.local` telah diabaikan (`.gitignore`) secara ketat untuk mencegah kebocoran kredensial dan API key rahasia ke repositori publik.

---

## 🚀 Panduan Menjalankan Aplikasi

### Persyaratan Sistem
- **Node.js**: `v20.x` atau `v22.x` (LTS direkomendasikan)
- **pnpm**: `v10.x` atau lebih baru
- **PostgreSQL**: `v14+` (atau jalankan via Docker Compose bawaan)

### 1. Instalasi Dependensi
```bash
pnpm install
```

### 2. Konfigurasi Basis Data (Opsional / Docker)
Aplikasi memiliki **Resilient Data Adapter**: jika server PostgreSQL belum aktif, aplikasi otomatis beralih ke penyimpanan lokal terproteksi (`.data/store.json`) sehingga seluruh fitur tetap berjalan lancar untuk demonstrasi.

Jika ingin menggunakan PostgreSQL via Docker:
```bash
# Menjalankan PostgreSQL container di background
docker compose up -d

# Menghasilkan dan menjalankan migrasi skema
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate
```

### 3. Menjalankan Server Pengembangan
```bash
pnpm run dev
```
Buka peramban di: **`http://localhost:3000`**

### 4. Build & Validasi Produksi
Untuk memastikan keandalan kode sebelum rilis produksi:
```bash
# Pemeriksaan kualitas kode (Linter)
pnpm run lint

# Kompilasi optimasi produksi
pnpm run build

# Menjalankan server produksi lokal
pnpm run start
```

---

## 🎨 Standar Desain & Tipografi Keuangan

- **Palet Warna Terkurasi**:
  - Background Utama: `#F8FAFC` (Slate 50)
  - Surface Card: `#FFFFFF` murni dengan border halus `#E2E8F0` (Slate 200)
  - Brand Primary: `#2563EB` (Blue 600)
  - Status Success: `#16A34A` (Green 600)
  - Status Warning: `#D97706` (Amber 600)
  - Teks Utama: `#0F172A` (Slate 900)
- **Tabular Figures**: Menggunakan `font-variant-numeric: tabular-nums` pada seluruh kalkulasi anggaran dan nominal mata uang rupiah, memastikan setiap digit angka sejajar vertikal dengan rapi.
- **Responsif Seluler**: Desain mendukung navigasi layar ponsel pintar, tablet, maupun layar desktop lebar.

---

## 📄 Lisensi & Hak Cipta
Hak Cipta © 2026 CRMForU. Dikembangkan secara profesional untuk keandalan produksi tinggi.
