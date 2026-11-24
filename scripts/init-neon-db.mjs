import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

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

const INITIAL_BKU_ARKAS = [
  {
    id_item: 'ARKAS-2',
    no_bpu: 'BPU-01',
    tanggal_transaksi: '2026-01-15',
    kode_rekening: '5.1.02.01.01.0025',
    nama_rekening: 'Belanja Alat/Bahan untuk Kegiatan Kantor - Kertas dan Cover',
    kode_kegiatan: '03.03',
    nama_kegiatan: '03.03 - Pelaksanaan Administrasi Kegiatan Sekolah',
    uraian: 'Belanja Kertas HVS F4 70 Gram Sinar Dunia (30 Rim)',
    volume: 30,
    satuan: 'Rim',
    harga_satuan: 58000,
    nominal: 1740000,
    ppn: 172432,
    pph21: 0,
    pph22: 23446,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-3',
    no_bpu: 'BPU-01',
    tanggal_transaksi: '2026-01-15',
    kode_rekening: '5.1.02.01.01.0024',
    nama_rekening: 'Belanja Alat/Bahan untuk Kegiatan Kantor - Alat Tulis Kantor',
    kode_kegiatan: '03.03',
    nama_kegiatan: '03.03 - Pelaksanaan Administrasi Kegiatan Sekolah',
    uraian: 'Belanja Spidol Whiteboard Snowman & Tinta Refill (24 Kotak)',
    volume: 24,
    satuan: 'Kotak',
    harga_satuan: 45000,
    nominal: 1080000,
    ppn: 107027,
    pph21: 0,
    pph22: 14554,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-4',
    no_bpu: 'BPU-01',
    tanggal_transaksi: '2026-01-15',
    kode_rekening: '5.1.02.01.01.0024',
    nama_rekening: 'Belanja Alat/Bahan untuk Kegiatan Kantor - Alat Tulis Kantor',
    kode_kegiatan: '03.03',
    nama_kegiatan: '03.03 - Pelaksanaan Administrasi Kegiatan Sekolah',
    uraian: 'Belanja Ordner Folio, Map Plastik & Lakban Jilid (35 Buah)',
    volume: 35,
    satuan: 'Buah',
    harga_satuan: 18000,
    nominal: 630000,
    ppn: 62433,
    pph21: 0,
    pph22: 8486,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-5',
    no_bpu: 'BPU-02',
    tanggal_transaksi: '2026-01-22',
    kode_rekening: '5.1.02.01.01.0052',
    nama_rekening: 'Belanja Makanan dan Minuman Rapat',
    kode_kegiatan: '02.06',
    nama_kegiatan: '02.06 - Pengembangan Profesi Pendidik dan Tenaga Kependidikan',
    uraian: 'Belanja Nasi Kotak Rapat Kerja Penyusunan RKAS & Kurikulum',
    volume: 35,
    satuan: 'Kotak',
    harga_satuan: 35000,
    nominal: 1225000,
    ppn: 0,
    pph21: 0,
    pph22: 0,
    pph23: 0,
    pajak_daerah: 122500,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-6',
    no_bpu: 'BPU-02',
    tanggal_transaksi: '2026-01-22',
    kode_rekening: '5.1.02.01.01.0052',
    nama_rekening: 'Belanja Makanan dan Minuman Rapat',
    kode_kegiatan: '02.06',
    nama_kegiatan: '02.06 - Pengembangan Profesi Pendidik dan Tenaga Kependidikan',
    uraian: 'Belanja Snack / Kudapan Rapat Kerja Penyusunan RKAS & Kurikulum',
    volume: 35,
    satuan: 'Kotak',
    harga_satuan: 15000,
    nominal: 525000,
    ppn: 0,
    pph21: 0,
    pph22: 0,
    pph23: 0,
    pajak_daerah: 52500,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-7',
    no_bpu: 'BPU-03',
    tanggal_transaksi: '2026-02-12',
    kode_rekening: '5.1.02.01.01.0029',
    nama_rekening: 'Belanja Alat/Bahan untuk Kegiatan Kantor - Bahan Komputer',
    kode_kegiatan: '03.03',
    nama_kegiatan: '03.03 - Pelaksanaan Administrasi Kegiatan Sekolah',
    uraian: 'Belanja Tinta Printer Epson 003 Original 4 Warna (16 Botol)',
    volume: 16,
    satuan: 'Botol',
    harga_satuan: 115000,
    nominal: 1840000,
    ppn: 182342,
    pph21: 0,
    pph22: 24793,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-8',
    no_bpu: 'BPU-03',
    tanggal_transaksi: '2026-02-12',
    kode_rekening: '5.1.02.01.01.0029',
    nama_rekening: 'Belanja Alat/Bahan untuk Kegiatan Kantor - Bahan Komputer',
    kode_kegiatan: '03.03',
    nama_kegiatan: '03.03 - Pelaksanaan Administrasi Kegiatan Sekolah',
    uraian: 'Belanja Cartridge Toner LaserJet HP 85A Original (2 Unit)',
    volume: 2,
    satuan: 'Unit',
    harga_satuan: 480000,
    nominal: 960000,
    ppn: 95135,
    pph21: 0,
    pph22: 12937,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-9',
    no_bpu: 'BPU-04',
    tanggal_transaksi: '2026-02-19',
    kode_rekening: '5.1.02.01.01.0026',
    nama_rekening: 'Belanja Alat/Bahan untuk Kegiatan Kantor - Bahan Cetak',
    kode_kegiatan: '03.03',
    nama_kegiatan: '03.03 - Pelaksanaan Administrasi Kegiatan Sekolah',
    uraian: 'Belanja Cetak Sampul Rapor, Kartu Inventaris Ruangan & Banner POS',
    volume: 1,
    satuan: 'Paket',
    harga_satuan: 2450000,
    nominal: 2450000,
    ppn: 242793,
    pph21: 0,
    pph22: 33018,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-10',
    no_bpu: 'BPU-05',
    tanggal_transaksi: '2026-03-10',
    kode_rekening: '5.1.02.03.02.0405',
    nama_rekening: 'Belanja Pemeliharaan Komputer - Peralatan Komputer Lokal',
    kode_kegiatan: '05.08',
    nama_kegiatan: '05.08 - Pemeliharaan Sarana dan Prasarana Sekolah',
    uraian: 'Penggantian SSD 256GB & RAM Laptop Operasional Sekolah (4 Unit)',
    volume: 4,
    satuan: 'Unit',
    harga_satuan: 450000,
    nominal: 1800000,
    ppn: 178378,
    pph21: 0,
    pph22: 0,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-11',
    no_bpu: 'BPU-05',
    tanggal_transaksi: '2026-03-10',
    kode_rekening: '5.1.02.03.02.0405',
    nama_rekening: 'Belanja Pemeliharaan Komputer - Peralatan Komputer Lokal',
    kode_kegiatan: '05.08',
    nama_kegiatan: '05.08 - Pemeliharaan Sarana dan Prasarana Sekolah',
    uraian: 'Jasa Servis Berkala Laptop Chromebook & Instalasi Jaringan Lab',
    volume: 4,
    satuan: 'Unit',
    harga_satuan: 200000,
    nominal: 800000,
    ppn: 0,
    pph21: 0,
    pph22: 0,
    pph23: 16000,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-12',
    no_bpu: 'BPU-06',
    tanggal_transaksi: '2026-03-24',
    kode_rekening: '5.2.05.01.01.0001',
    nama_rekening: 'Belanja Modal Buku Umum dan Buku Teks Utama Kurikulum Nasional',
    kode_kegiatan: '05.02',
    nama_kegiatan: '05.02 - Pengembangan Perpustakaan dan Pojok Baca Digital',
    uraian: 'Belanja Modal Buku Teks Utama Kurikulum Nasional Kelas 1 & 4',
    volume: 70,
    satuan: 'Eksemplar',
    harga_satuan: 48500,
    nominal: 3395000,
    ppn: 0,
    pph21: 0,
    pph22: 45878,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-13',
    no_bpu: 'BPU-06',
    tanggal_transaksi: '2026-03-24',
    kode_rekening: '5.2.05.01.01.0001',
    nama_rekening: 'Belanja Modal Buku Umum dan Buku Teks Utama Kurikulum Nasional',
    kode_kegiatan: '05.02',
    nama_kegiatan: '05.02 - Pengembangan Perpustakaan dan Pojok Baca Digital',
    uraian: 'Belanja Modal Buku Teks Utama Kurikulum Nasional Kelas 6 & Bacaan Literasi',
    volume: 50,
    satuan: 'Eksemplar',
    harga_satuan: 48500,
    nominal: 2425000,
    ppn: 0,
    pph21: 0,
    pph22: 32770,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-14',
    no_bpu: 'BPU-07',
    tanggal_transaksi: '2026-04-06',
    kode_rekening: '5.1.02.02.01.0063',
    nama_rekening: 'Belanja Kawat/Faksimili/Internet/TV Berlangganan',
    kode_kegiatan: '06.07',
    nama_kegiatan: '06.07 - Pembiayaan Langganan Daya dan Jasa',
    uraian: 'Pembayaran Tagihan Internet Sekolah Dedicated 100 Mbps Bulan April',
    volume: 1,
    satuan: 'Bulan',
    harga_satuan: 850000,
    nominal: 850000,
    ppn: 0,
    pph21: 0,
    pph22: 0,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Reguler',
  },
  {
    id_item: 'ARKAS-15',
    no_bpu: 'BPU-08',
    tanggal_transaksi: '2026-04-16',
    kode_rekening: '5.2.02.05.01.0005',
    nama_rekening: 'Belanja Modal Alat Kantor Lainnya (Proyektor & Printer)',
    kode_kegiatan: '05.08',
    nama_kegiatan: '05.08 - Pemeliharaan Sarana dan Prasarana Sekolah',
    uraian: 'Belanja Modal Proyektor LCD Epson EB-E500 XGA 3300 Lumens (BOSP Kinerja)',
    volume: 2,
    satuan: 'Unit',
    harga_satuan: 5850000,
    nominal: 11700000,
    ppn: 1159459,
    pph21: 0,
    pph22: 157703,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Kinerja',
  },
  {
    id_item: 'ARKAS-16',
    no_bpu: 'BPU-08',
    tanggal_transaksi: '2026-04-16',
    kode_rekening: '5.2.02.05.01.0005',
    nama_rekening: 'Belanja Modal Alat Kantor Lainnya (Proyektor & Printer)',
    kode_kegiatan: '05.08',
    nama_kegiatan: '05.08 - Pemeliharaan Sarana dan Prasarana Sekolah',
    uraian: 'Belanja Modal Layar Proyektor Tripod 70 Inch & Kabel HDMI 15m (BOSP Kinerja)',
    volume: 2,
    satuan: 'Set',
    harga_satuan: 900000,
    nominal: 1800000,
    ppn: 178378,
    pph21: 0,
    pph22: 24264,
    pph23: 0,
    pajak_daerah: 0,
    sumber_dana: 'BOSP Kinerja',
  },
];

async function main() {
  loadLocalEnv();
  const rawUrl = process.env.VITE_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!rawUrl) {
    console.error('Error: VITE_NEON_DATABASE_URL tidak ditemukan di environment atau file .env');
    process.exit(1);
  }

  const dbUrl = normalizeNeonUrl(rawUrl);
  const sql = neon(dbUrl);

  console.log('Menghubungkan ke Neon PostgreSQL dan memperbarui tabel...');

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
      tahun_anggaran INTEGER NOT NULL DEFAULT 2027,
      kota_ttd VARCHAR(100) DEFAULT 'Denpasar',
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bku_arkas (
      id SERIAL PRIMARY KEY,
      id_item VARCHAR(100) UNIQUE NOT NULL,
      no_bpu VARCHAR(100) NOT NULL,
      tanggal_transaksi DATE NOT NULL,
      kode_rekening VARCHAR(100) NOT NULL,
      nama_rekening TEXT,
      kode_kegiatan VARCHAR(100),
      nama_kegiatan TEXT,
      uraian TEXT NOT NULL,
      volume NUMERIC(12, 2) DEFAULT 1,
      satuan VARCHAR(50) DEFAULT 'Paket',
      harga_satuan NUMERIC(15, 2) DEFAULT 0,
      nominal NUMERIC(15, 2) DEFAULT 0,
      ppn NUMERIC(15, 2) DEFAULT 0,
      pph21 NUMERIC(15, 2) DEFAULT 0,
      pph22 NUMERIC(15, 2) DEFAULT 0,
      pph23 NUMERIC(15, 2) DEFAULT 0,
      pajak_daerah NUMERIC(15, 2) DEFAULT 0,
      sumber_dana VARCHAR(100) DEFAULT 'BOSP Reguler',
      sumber_file VARCHAR(200) DEFAULT 'Database Cloud Neon',
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

  await sql`CREATE INDEX IF NOT EXISTS idx_bku_arkas_no_bpu ON bku_arkas(no_bpu)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_spj_pelengkap_no_bpu ON spj_pelengkap(no_bpu)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_riwayat_cetak_no_bpu ON riwayat_cetak(no_bpu)`;

  // Pastikan NPSN di profil_sekolah adalah 50103069 (SD Negeri 7 Pedungan)
  const existingProfil = await sql`SELECT COUNT(*)::int AS total FROM profil_sekolah`;
  if (existingProfil[0].total === 0) {
    await sql`
      INSERT INTO profil_sekolah (
        nama_sekolah, npsn, alamat, kelurahan_desa, kecamatan, kabupaten_kota, provinsi,
        kode_pos, telepon, email, nama_dinas, pemerintah_daerah,
        nama_kepsek, nip_kepsek, nama_bendahara, nip_bendahara,
        nama_pemeriksa, nip_pemeriksa, tahun_anggaran, kota_ttd
      ) VALUES (
        'SD NEGERI 7 PEDUNGAN',
        '50103069',
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
        2027,
        'Denpasar'
      )
    `;
  } else {
    await sql`UPDATE profil_sekolah SET npsn = '50103069' WHERE npsn = '50103123'`;
  }

  // Seed tabel bku_arkas di Neon agar seluruh transaksi BKU langsung dimuat dari database Neon
  console.log('Menyinkronkan data transaksi BKU ARKAS ke tabel bku_arkas di Cloud Neon...');
  for (const item of INITIAL_BKU_ARKAS) {
    await sql`
      INSERT INTO bku_arkas (
        id_item, no_bpu, tanggal_transaksi, kode_rekening, nama_rekening,
        kode_kegiatan, nama_kegiatan, uraian, volume, satuan, harga_satuan,
        nominal, ppn, pph21, pph22, pph23, pajak_daerah, sumber_dana, sumber_file
      ) VALUES (
        ${item.id_item}, ${item.no_bpu}, ${item.tanggal_transaksi}, ${item.kode_rekening}, ${item.nama_rekening},
        ${item.kode_kegiatan}, ${item.nama_kegiatan}, ${item.uraian}, ${item.volume}, ${item.satuan}, ${item.harga_satuan},
        ${item.nominal}, ${item.ppn}, ${item.pph21}, ${item.pph22}, ${item.pph23}, ${item.pajak_daerah}, ${item.sumber_dana},
        'Database Cloud Neon (ARKAS 4)'
      )
      ON CONFLICT (id_item) DO NOTHING
    `;
  }

  const counts = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM profil_sekolah) AS profil,
      (SELECT COUNT(*)::int FROM bku_arkas) AS bku,
      (SELECT COUNT(*)::int FROM data_penyedia) AS penyedia,
      (SELECT COUNT(*)::int FROM spj_pelengkap) AS spj
  `;
  console.log('Status Data Cloud Neon:', counts[0]);
}

main().catch((err) => {
  console.error('Gagal menginisialisasi database Neon:', err);
  process.exit(1);
});
