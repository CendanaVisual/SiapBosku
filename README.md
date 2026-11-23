# SiapBosKu — Sistem Administrasi & Cetak SPJ ARKAS 4

Aplikasi web internal sekolah untuk membaca file database SQLite lokal dari aplikasi **ARKAS 4** secara langsung di memori browser pengguna (**WebAssembly `sql.js`**) tanpa mengunggah file mentah ke server, serta menyinkronkan data pelengkap SPJ ke database cloud **Neon (PostgreSQL Serverless)**.

---

## 1. Tech Stack & Arsitektur
- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide React
- **Client-Side SQLite Reader:** `sql.js` (WebAssembly) — membaca file `.db` / `.sqlite` ARKAS langsung di RAM browser (`public/sql-wasm.wasm`)
- **Database Cloud:** PostgreSQL Serverless menggunakan **Neon** (`@neondatabase/serverless`)
- **Target Hosting:** GitHub Pages (`vite.config.js` dengan `base: './'`) + GitHub Actions Auto-Deploy (`.github/workflows/deploy.yml`)

---

## 2. Aturan Keamanan Kredensial (Zero Hardcoded Secret)
- **TIDAK ADA** `DATABASE_URL` atau kredensial Neon yang ditulis secara *hardcode* di dalam kode sumber.
- File `.env` telah dimasukkan ke dalam `.gitignore` dan tidak pernah di-commit ke GitHub.
- Untuk pengembangan lokal, salin `.env.example` menjadi `.env` dan isi `VITE_NEON_DATABASE_URL`.
- Saat di-deploy ke **GitHub Pages**, admin/bendahara cukup memasukkan `NEON_DATABASE_URL` melalui tombol **"Atur Koneksi Neon"** di pojok kanan atas aplikasi (tersimpan terenkripsi di `localStorage` atau `sessionStorage` browser masing-masing).

---

## 3. Fitur Utama
1. **Modul Pembaca File SQLite ARKAS (`sql.js`) & Table Inspector:**
   - Area *Drag & Drop* untuk memuat file database SQLite ARKAS 4 (`.db`, `.sqlite`, `.arkas`).
   - Tombol **"Muat Database Simulasi ARKAS 4"** dan **"Unduh File `.db`"** untuk uji coba instan.
   - **Table Inspector**: menampilkan daftar seluruh tabel beserta struktur kolom (`PRAGMA table_info`) dan 10/25/50 baris pertama dari tabel yang dipilih, dilengkapi *SQLite Query Runner*.
   - Ekstraksi otomatis transaksi pengeluaran BKU (`kas_umum`), kode rekening (`mst_kodering`), kegiatan (`mst_kegiatan`), dan sumber dana.
2. **Modul Integrasi Database Neon (`@neondatabase/serverless`):**
   - Skrip inisialisasi tabel SQL otomatis (`CREATE TABLE IF NOT EXISTS`) untuk `profil_sekolah`, `data_penyedia`, `spj_pelengkap`, dan `riwayat_cetak`.
   - Sinkronisasi otomatis antara `no_bpu` dari SQLite ARKAS dengan data pelengkap SPJ di Cloud Neon.
3. **Modul Pengelompokan & Pelengkapan SPJ (BKU & Grouping):**
   - Filter transaksi per **Bulan**, **Sumber Dana** (BOSP Reguler / BOSP Kinerja), dan **Status SPJ**.
   - **Gabung Transaksi (Grouping)**: centang beberapa item belanja dalam satu BPU/tanggal yang sama untuk digabungkan ke dalam satu paket dokumen Kwitansi Dinas, Nota Pesanan, dan BAST.
   - Modal cepat untuk memilih/menambah Toko/Penyedia, mengisi Nomor Surat Pesanan, Tanggal BAST, serta kalkulator otomatis PPN & PPh.
4. **Modul Cetak Dokumen Resmi (`@media print` — A4 & F4 Folio):**
   - **Kwitansi Dinas (BKP)**: lengkap dengan fungsi terbilang rupiah otomatis, rincian PPN/PPh, kode rekening, dan kolom tanda tangan Kepala Sekolah, Bendahara, serta Penerima.
   - **Nota Pesanan / Surat Pesanan Barang & Jasa**: lengkap dengan Kop Surat Sekolah dari `profil_sekolah`.
   - **Berita Acara Serah Terima (BAST)**: lengkap dengan kalimat hari/tanggal terbilang otomatis dalam Bahasa Indonesia.

---

## 4. Cara Menjalankan Secara Lokal

```bash
# 1. Instal dependensi (otomatis menyalin sql-wasm.wasm ke folder public/)
npm install

# 2. Salin .env.example menjadi .env dan masukkan connection string Neon Anda
cp .env.example .env

# 3. (Opsional) Inisialisasi tabel database Neon via CLI
npm run db:init

# 4. Jalankan server development
npm run dev

# 5. Build untuk produksi (GitHub Pages)
npm run build
```
