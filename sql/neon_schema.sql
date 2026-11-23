-- ============================================================================
-- SKEMA DATABASE CLOUD NEON (PostgreSQL) — SIAPBOSKU (SPJ ARKAS 4)
-- Dapat dijalankan langsung di Neon SQL Editor atau otomatis melalui aplikasi
-- ============================================================================

-- 1. Tabel Profil Sekolah
CREATE TABLE IF NOT EXISTS profil_sekolah (
  id SERIAL PRIMARY KEY,
  nama_sekolah VARCHAR(200) NOT NULL,
  npsn VARCHAR(30) NOT NULL,
  alamat TEXT,
  kelurahan_desa VARCHAR(100),
  kecamatan VARCHAR(100),
  kabupaten_kota VARCHAR(100),
  provinsi VARCHAR(100),
  kode_pos VARCHAR(20),
  telepon VARCHAR(50),
  email VARCHAR(120),
  website VARCHAR(150),
  nama_dinas VARCHAR(200) DEFAULT 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA',
  pemerintah_daerah VARCHAR(200) DEFAULT 'PEMERINTAH KOTA DENPASAR',
  nama_kepsek VARCHAR(150) NOT NULL,
  nip_kepsek VARCHAR(50),
  nama_bendahara VARCHAR(150) NOT NULL,
  nip_bendahara VARCHAR(50),
  nama_pemeriksa VARCHAR(150),
  nip_pemeriksa VARCHAR(50),
  tahun_anggaran INTEGER NOT NULL DEFAULT 2026,
  kota_ttd VARCHAR(100) DEFAULT 'Denpasar',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Master Data Penyedia / Toko / CV
CREATE TABLE IF NOT EXISTS data_penyedia (
  id_penyedia SERIAL PRIMARY KEY,
  nama_toko VARCHAR(200) NOT NULL,
  alamat_toko TEXT,
  npwp VARCHAR(50),
  nama_pemilik VARCHAR(150) NOT NULL,
  jabatan_pemilik VARCHAR(100) DEFAULT 'Pemilik / Direktur',
  telepon VARCHAR(50),
  nama_bank VARCHAR(100),
  nomor_rekening VARCHAR(100),
  kategori_usaha VARCHAR(100) DEFAULT 'ATK & Perlengkapan Sekolah',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel SPJ Pelengkap (Sinkronisasi Nomor BPU ARKAS)
CREATE TABLE IF NOT EXISTS spj_pelengkap (
  id SERIAL PRIMARY KEY,
  no_bpu VARCHAR(100) UNIQUE NOT NULL,
  id_penyedia INTEGER REFERENCES data_penyedia(id_penyedia) ON DELETE SET NULL,
  no_surat_pesanan VARCHAR(150),
  tanggal_pesanan DATE,
  no_bast VARCHAR(150),
  tanggal_bast DATE,
  no_nota_toko VARCHAR(150),
  tanggal_lunas DATE,
  sumber_dana VARCHAR(100) DEFAULT 'BOSP Reguler',
  kode_rekening VARCHAR(100),
  nama_kegiatan TEXT,
  uraian_kwitansi TEXT,
  total_bruto NUMERIC(15, 2) DEFAULT 0,
  ppn NUMERIC(15, 2) DEFAULT 0,
  pph21 NUMERIC(15, 2) DEFAULT 0,
  pph22 NUMERIC(15, 2) DEFAULT 0,
  pph23 NUMERIC(15, 2) DEFAULT 0,
  pajak_daerah NUMERIC(15, 2) DEFAULT 0,
  items_json JSONB DEFAULT '[]'::jsonb,
  catatan TEXT,
  status_cetak VARCHAR(30) DEFAULT 'Siap Cetak',
  terakhir_dicetak TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Riwayat Cetak Dokumen SPJ
CREATE TABLE IF NOT EXISTS riwayat_cetak (
  id SERIAL PRIMARY KEY,
  no_bpu VARCHAR(100) NOT NULL,
  jenis_dokumen VARCHAR(100) NOT NULL,
  ukuran_kertas VARCHAR(20) DEFAULT 'A4',
  dicetak_oleh VARCHAR(100) DEFAULT 'Bendahara BOSP',
  total_nilai NUMERIC(15, 2) DEFAULT 0,
  waktu_cetak TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk mempercepat pencarian & sinkronisasi Nomor BPU
CREATE INDEX IF NOT EXISTS idx_spj_pelengkap_no_bpu ON spj_pelengkap(no_bpu);
CREATE INDEX IF NOT EXISTS idx_riwayat_cetak_no_bpu ON riwayat_cetak(no_bpu);
