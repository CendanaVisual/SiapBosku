import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Baca variabel dari .env lokal jika belum ada di process.env (tanpa hardcode kredensial!)
function loadLocalEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

function normalizeNeonUrl(rawUrl) {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  if (cleaned.startsWith('psql ')) {
    cleaned = cleaned.replace(/^psql\s+/, '').trim();
  }
  if ((cleaned.startsWith("'") && cleaned.endsWith("'")) || (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
    cleaned = cleaned.slice(1, -1);
  }
  try {
    const urlObj = new URL(cleaned);
    urlObj.searchParams.delete('channel_binding');
    return urlObj.toString();
  } catch {
    return cleaned;
  }
}

async function main() {
  loadLocalEnv();
  const rawUrl = process.env.VITE_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!rawUrl) {
    console.error('Error: VITE_NEON_DATABASE_URL tidak ditemukan di environment atau file .env');
    process.exit(1);
  }

  const dbUrl = normalizeNeonUrl(rawUrl);
  const sql = neon(dbUrl);

  console.log('Menghubungkan ke Neon PostgreSQL dan menginisialisasi tabel...');

  await sql`
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
    )
  `;

  await sql`
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
    )
  `;

  await sql`
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
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS riwayat_cetak (
      id SERIAL PRIMARY KEY,
      no_bpu VARCHAR(100) NOT NULL,
      jenis_dokumen VARCHAR(100) NOT NULL,
      ukuran_kertas VARCHAR(20) DEFAULT 'A4',
      dicetak_oleh VARCHAR(100) DEFAULT 'Bendahara BOSP',
      total_nilai NUMERIC(15, 2) DEFAULT 0,
      waktu_cetak TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_spj_pelengkap_no_bpu ON spj_pelengkap(no_bpu)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_riwayat_cetak_no_bpu ON riwayat_cetak(no_bpu)`;

  // Cek apakah profil_sekolah sudah memiliki data awal
  const existingProfil = await sql`SELECT COUNT(*)::int AS total FROM profil_sekolah`;
  if (existingProfil[0].total === 0) {
    console.log('Menambahkan data awal profil_sekolah...');
    await sql`
      INSERT INTO profil_sekolah (
        nama_sekolah, npsn, alamat, kelurahan_desa, kecamatan, kabupaten_kota, provinsi,
        kode_pos, telepon, email, nama_dinas, pemerintah_daerah,
        nama_kepsek, nip_kepsek, nama_bendahara, nip_bendahara,
        nama_pemeriksa, nip_pemeriksa, tahun_anggaran, kota_ttd
      ) VALUES (
        'SD NEGERI 7 PEDUNGAN',
        '50103123',
        'Jl. Pulau Saelus No. 45, Pedungan',
        'Pedungan',
        'Denpasar Selatan',
        'Kota Denpasar',
        'Bali',
        '80222',
        '(0361) 721890',
        'sdn7pedungan@pendidikan.denpasarkota.go.id',
        'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA',
        'PEMERINTAH KOTA DENPASAR',
        'I Wayan Sudarma, S.Pd., M.Pd.',
        '19750412 199903 1 006',
        'Ni Luh Putu Sari Dewi, S.Pd.',
        '19860819 201101 2 012',
        'I Made Arya Wibawa, S.Kom.',
        '19900215 201903 1 004',
        2026,
        'Denpasar'
      )
    `;
  }

  // Cek apakah data_penyedia sudah memiliki data contoh toko/rekanan
  const existingPenyedia = await sql`SELECT COUNT(*)::int AS total FROM data_penyedia`;
  if (existingPenyedia[0].total === 0) {
    console.log('Menambahkan daftar rekanan/penyedia awal ke data_penyedia...');
    await sql`
      INSERT INTO data_penyedia (nama_toko, alamat_toko, npwp, nama_pemilik, jabatan_pemilik, telepon, nama_bank, nomor_rekening, kategori_usaha)
      VALUES
        ('CV. Cendana Mitra Media', 'Jl. Tukad Batanghari No. 88, Panjer, Denpasar Selatan', '92.415.778.9-901.000', 'I Gede Cendana Putra', 'Direktur', '0812-3845-9901', 'BPD Bali', '010.02.02.11450-8', 'ATK & Percetakan'),
        ('Toko Buku & ATK Saraswati Makmur', 'Jl. Diponegoro No. 112, Denpasar Barat', '71.829.330.1-903.000', 'Ni Ketut Murniati', 'Pemilik Toko', '0813-3720-4451', 'BRI', '0017-01-023456-50-3', 'Alat Tulis Kantor & Kertas'),
        ('UD. Dewata Komputer & Elektronik', 'Jl. Teuku Umar No. 154, Denpasar', '85.310.664.2-901.000', 'Hendra Wijaya, S.T.', 'Pemilik / Teknisi', '0819-9904-7721', 'Bank Mandiri', '145-00-2389102-4', 'Komputer, Printer & Jaringan'),
        ('Katering Dapur Bali Boga', 'Jl. Pulau Moyo No. 23, Pedungan, Denpasar Selatan', '64.119.802.5-903.000', 'Ni Made Ratna Sari', 'Pemilik Usaha', '0857-3812-0092', 'BPD Bali', '014.02.01.99823-1', 'Konsumsi & Snack Rapat')
    `;
  }

  // Cek apakah spj_pelengkap sudah memiliki contoh sinkronisasi BPU
  const existingSpj = await sql`SELECT COUNT(*)::int AS total FROM spj_pelengkap`;
  if (existingSpj[0].total === 0) {
    const penyediaRows = await sql`SELECT id_penyedia, nama_toko FROM data_penyedia ORDER BY id_penyedia ASC`;
    if (penyediaRows.length > 0) {
      console.log('Menambahkan contoh data spj_pelengkap untuk sinkronisasi otomatis Nomor BPU...');
      await sql`
        INSERT INTO spj_pelengkap (
          no_bpu, id_penyedia, no_surat_pesanan, tanggal_pesanan,
          no_bast, tanggal_bast, no_nota_toko, tanggal_lunas,
          sumber_dana, kode_rekening, nama_kegiatan, uraian_kwitansi,
          total_bruto, ppn, pph22, pajak_daerah, status_cetak
        ) VALUES
        (
          'BPU-01', ${penyediaRows[0].id_penyedia}, '421.2/014/SP-BOSP/SDN7/I/2026', '2026-01-12',
          '421.2/016/BAST-BOSP/SDN7/I/2026', '2026-01-15', 'INV/CMM/2026/0042', '2026-01-15',
          'BOSP Reguler', '5.1.02.01.01.0024', '03.03. Pelaksanaan Administrasi Kegiatan Sekolah',
          'Belanja Alat/Bahan untuk Kegiatan Kantor - Alat Tulis Kantor (Kertas HVS, Spidol, Map & Tinta Printer)',
          3450000, 341892, 46486, 0, 'Sudah Dicetak'
        ),
        (
          'BPU-02', ${penyediaRows[3]?.id_penyedia || penyediaRows[0].id_penyedia}, '421.2/021/SP-BOSP/SDN7/I/2026', '2026-01-20',
          '421.2/023/BAST-BOSP/SDN7/I/2026', '2026-01-22', 'NOTA/DBB/01/2026', '2026-01-22',
          'BOSP Reguler', '5.1.02.01.01.0052', '02.06. Pengembangan Profesi Pendidik dan Tenaga Kependidikan',
          'Belanja Makanan dan Minuman Rapat Penyusunan RKAS dan Kurikulum Satuan Pendidikan',
          1750000, 0, 0, 175000, 'Siap Cetak'
        )
        ON CONFLICT (no_bpu) DO NOTHING
      `;
    }
  }

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('profil_sekolah', 'data_penyedia', 'spj_pelengkap', 'riwayat_cetak')
    ORDER BY table_name
  `;
  console.log('Tabel berhasil diverifikasi di Neon PostgreSQL:', tables.map(t => t.table_name).join(', '));
}

main().catch((err) => {
  console.error('Gagal menginisialisasi database Neon:', err);
  process.exit(1);
});
