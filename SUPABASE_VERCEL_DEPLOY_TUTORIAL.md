# Tutorial Rinci: Setup Supabase Credentials + Deploy Gratis ke Vercel

Dokumen ini menjelaskan langkah lengkap dari nol:
- buat project Supabase
- ambil kredensial database yang benar (`DATABASE_URL` dan `DIRECT_URL`)
- jalankan Prisma di lokal
- pasang env di Vercel
- test aplikasi setelah publish

Tutorial ini disesuaikan untuk project `Lifestory` saat ini.

---

## 1. Prasyarat

Pastikan sudah ada:
- akun Supabase
- akun Vercel
- repo project ini di GitHub
- Node.js dan npm sudah terpasang di lokal

---

## 2. Buat Project Baru di Supabase

1. Login ke Supabase Dashboard.
2. Klik `New project`.
3. Pilih organization.
4. Isi:
   - `Project name`: bebas (contoh: `lifestory-prod`)
   - `Database Password`: buat password kuat, simpan di password manager
   - `Region`: pilih yang paling dekat user kamu
5. Klik `Create new project`.
6. Tunggu sampai status project siap (biasanya beberapa menit).

Catatan:
- Password database ini akan dipakai saat membuat connection string.
- Jangan pernah commit password ke git.

---

## 3. Ambil Kredensial Database Supabase

Setelah project jadi:

1. Buka `Project Settings` -> `Database`.
2. Cari bagian `Connection string`.
3. Ambil 2 jenis URL berikut:

### A. `DIRECT_URL` (koneksi direct, port 5432)

Biasanya dari opsi `URI` direct connection. Bentuk umum:

```text
postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

### B. `DATABASE_URL` (koneksi pooled, untuk runtime serverless)

Pakai pooled connection string (Supavisor/transaction pooler). Bentuk umum:

```text
postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

Catatan penting:
- `DATABASE_URL` dipakai aplikasi saat runtime.
- `DIRECT_URL` dipakai Prisma untuk operasi schema/introspection.
- Jika password mengandung karakter khusus (`@`, `#`, `%`, dll), pastikan URL sudah dalam format encoded. Kalau belum, encode dulu.

---

## 4. Isi `.env` Lokal

Di root project, edit file `.env` menjadi seperti ini:

```env
DATABASE_URL="PASTE_DATABASE_URL_POOLED"
DIRECT_URL="PASTE_DIRECT_URL"

NEXTAUTH_SECRET="ganti_dengan_random_string_panjang"
NEXTAUTH_URL="http://localhost:3000"

ALLOWED_ORIGINS="http://localhost:3000"
ALLOWED_HOSTS="localhost"
```

Tips generate secret cepat:
- bisa pakai `openssl rand -base64 32`
- atau generator secret lain yang aman

---

## 5. Verifikasi Prisma Schema Project

Pastikan file `prisma/schema.prisma` sudah seperti ini:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Jika masih `sqlite`, ubah dulu sebelum lanjut.

---

## 6. Apply Schema ke Supabase (Lokal)

Jalankan dari folder project:

```bash
npm install
npx prisma generate
npm run db:push
npm run db:seed
```

Penjelasan:
- `prisma generate`: generate Prisma Client
- `db:push`: create/update tabel di Postgres Supabase sesuai schema
- `db:seed`: isi data awal (admin/demo user)

Jika `db:push` berhasil, tabel `User` akan muncul di Supabase.

---

## 7. Jalankan dan Test Lokal

```bash
npm run dev
```

Lalu cek:
1. Buka `http://localhost:3000`
2. Test register user baru
3. Test login
4. Masuk halaman `/app`
5. Test invite share:
   - generate link
   - buka link invite
   - login akun lain
   - import pohon

Jika ini jalan di lokal, deploy biasanya lancar.

---

## 8. Deploy ke Vercel (Free)

1. Push perubahan ke GitHub.
2. Login Vercel.
3. Klik `Add New...` -> `Project`.
4. Import repo `Lifestory`.
5. Sebelum deploy, isi Environment Variables di Vercel:

```env
DATABASE_URL=PASTE_DATABASE_URL_POOLED
DIRECT_URL=PASTE_DIRECT_URL
NEXTAUTH_SECRET=RANDOM_SECRET
NEXTAUTH_URL=https://<project-name>.vercel.app
ALLOWED_ORIGINS=https://<project-name>.vercel.app
ALLOWED_HOSTS=<project-name>.vercel.app
```

6. Klik `Deploy`.

Catatan:
- Jika pakai custom domain, update:
  - `NEXTAUTH_URL`
  - `ALLOWED_ORIGINS`
  - `ALLOWED_HOSTS`

---

## 9. Jalankan `db:push` untuk Environment Production

Ada 2 cara:

### Cara A (paling mudah): dari lokal

Gunakan env production Supabase, lalu:

```bash
npm run db:push
npm run db:seed
```

### Cara B: lewat CI/CD

Bisa otomatis, tapi untuk awal lebih aman manual dulu agar jelas.

---

## 10. Smoke Test Setelah Deploy

Setelah URL Vercel aktif:
1. Register user baru
2. Login user baru
3. Login admin
4. Cek dashboard admin (`/dashboard`)
5. Cek invite flow:
   - generate link
   - buka link invite
   - import tree

Jika semua lolos, app siap ditunjukkan ke client.

---

## 11. Troubleshooting Umum

### A. `P1001 Can't reach database server`
- Cek `DATABASE_URL`/`DIRECT_URL` salah host/port
- Cek project Supabase masih aktif
- Coba ulang dengan copy URL langsung dari dashboard

### B. `P1013 Invalid database string`
- URL tidak valid (sering karena karakter khusus password belum encoded)
- pastikan format `postgresql://...`

### C. `request to binaries.prisma.sh ... failed`
- ini masalah network lokal/proxy/firewall saat download Prisma engine
- coba:
  - ganti jaringan
  - nonaktifkan VPN/proxy sementara
  - izinkan akses ke domain `binaries.prisma.sh`

### D. Login sukses tapi redirect aneh/session error
- `NEXTAUTH_URL` belum sesuai domain aktif
- `NEXTAUTH_SECRET` belum terisi / berubah tidak sinkron

### E. Invite link gagal dibuat
- cek user sudah login
- cek API `/api/invites` tidak diblok middleware origin/host
- cek env `ALLOWED_ORIGINS` dan `ALLOWED_HOSTS` sesuai domain deploy

---

## 12. Security Checklist Sebelum Demo Client

1. Ganti password default seed (`admin123`, `demo123`)
2. Simpan secret di env manager, jangan di git
3. Pastikan `NEXTAUTH_SECRET` panjang dan random
4. Pastikan domain di allowlist sudah benar
5. Uji login, register, invite di browser/device berbeda

---

## 13. Ringkasan Variabel Env

```env
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ALLOWED_ORIGINS=
ALLOWED_HOSTS=
```

Selesai. Setelah ini project bisa jalan di stack gratis: Vercel Hobby + Supabase Free.

