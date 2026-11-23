import { neon } from '@neondatabase/serverless';

// ============================================================================
// LAYANAN KONEKSI DATABASE NEON (PostgreSQL Serverless)
// Mematuhi Aturan Keamanan Kredensial:
// - TIDAK ADA hardcode DATABASE_URL di dalam source code!
// - Membaca dari localStorage / sessionStorage (terobfuskasi) atau import.meta.env.VITE_NEON_DATABASE_URL
// ============================================================================

const STORAGE_KEY = 'siapbosku_neon_conn_v1';
const STORAGE_MODE_KEY = 'siapbosku_neon_storage_mode';
const OBFUSCATION_SALT = 'SIAPBOSKU_ARKAS4_SECURE_KEY_2026';

function xorCipher(text, key = OBFUSCATION_SALT) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export function encryptLocalCredential(plainText) {
  if (!plainText) return '';
  try {
    const xored = xorCipher(plainText.trim());
    return btoa(encodeURIComponent(xored));
  } catch {
    return btoa(plainText.trim());
  }
}

export function decryptLocalCredential(cipherText) {
  if (!cipherText) return '';
  try {
    const decoded = decodeURIComponent(atob(cipherText));
    return xorCipher(decoded);
  } catch {
    try {
      return atob(cipherText);
    } catch {
      return '';
    }
  }
}

export function normalizeNeonUrl(rawUrl) {
  if (!rawUrl) return '';
  let cleaned = String(rawUrl).trim();
  if (cleaned.startsWith('psql ')) {
    cleaned = cleaned.replace(/^psql\s+/, '').trim();
  }
  if (
    (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
    (cleaned.startsWith('"') && cleaned.endsWith('"'))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  try {
    const urlObj = new URL(cleaned);
    // @neondatabase/serverless HTTP fetch driver tidak memerlukan parameter channel_binding
    urlObj.searchParams.delete('channel_binding');
    return urlObj.toString();
  } catch {
    return cleaned;
  }
}

export function maskConnectionUrl(rawUrl) {
  const cleaned = normalizeNeonUrl(rawUrl);
  if (!cleaned) return 'Belum Dikonfigurasi';
  try {
    const url = new URL(cleaned);
    const maskedPass = url.password ? '••••••••' : '';
    return `${url.protocol}//${url.username}:${maskedPass}@${url.host}${url.pathname}`;
  } catch {
    return 'postgresql://••••@••••/neondb';
  }
}

export function getSavedStorageMode() {
  return localStorage.getItem(STORAGE_MODE_KEY) || 'localStorage';
}

export function saveNeonConnectionUrl(rawUrl, mode = 'localStorage') {
  const normalized = normalizeNeonUrl(rawUrl);
  const encrypted = encryptLocalCredential(normalized);
  localStorage.setItem(STORAGE_MODE_KEY, mode);

  if (mode === 'sessionStorage') {
    sessionStorage.setItem(STORAGE_KEY, encrypted);
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, encrypted);
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function clearSavedNeonConnectionUrl() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getActiveNeonConnectionInfo() {
  const sessionVal = sessionStorage.getItem(STORAGE_KEY);
  if (sessionVal) {
    const url = decryptLocalCredential(sessionVal);
    if (url) {
      return { url: normalizeNeonUrl(url), source: 'sessionStorage (Browser)' };
    }
  }

  const localVal = localStorage.getItem(STORAGE_KEY);
  if (localVal) {
    const url = decryptLocalCredential(localVal);
    if (url) {
      return { url: normalizeNeonUrl(url), source: 'localStorage (Browser)' };
    }
  }

  const envUrl = import.meta.env?.VITE_NEON_DATABASE_URL;
  if (envUrl && String(envUrl).trim().startsWith('postgres')) {
    return {
      url: normalizeNeonUrl(envUrl),
      source: 'Environment (.env Lokal)',
    };
  }

  return { url: '', source: 'Belum Terhubung' };
}

export function getSqlClient(overrideUrl = '') {
  const targetUrl = overrideUrl ? normalizeNeonUrl(overrideUrl) : getActiveNeonConnectionInfo().url;
  if (!targetUrl) {
    throw new Error(
      'Koneksi Database Neon belum dikonfigurasi. Silakan buka menu "Pengaturan Database" untuk memasukkan NEON_DATABASE_URL.'
    );
  }
  return neon(targetUrl);
}

// ============================================================================
// INISIALISASI SKEMA OTOMATIS (CREATE TABLE IF NOT EXISTS)
// ============================================================================

export async function initializeNeonSchema(overrideUrl = '') {
  const start = performance.now();
  const sql = getSqlClient(overrideUrl);

  const versionRes = await sql`SELECT version(), current_database() AS db_name, current_user AS db_user`;

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

  const existingProfil = await sql`SELECT COUNT(*)::int AS total FROM profil_sekolah`;
  if (existingProfil[0]?.total === 0) {
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

  const counts = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM profil_sekolah) AS profil_count,
      (SELECT COUNT(*)::int FROM data_penyedia) AS penyedia_count,
      (SELECT COUNT(*)::int FROM spj_pelengkap) AS spj_count,
      (SELECT COUNT(*)::int FROM riwayat_cetak) AS riwayat_count
  `;

  const latencyMs = Math.round(performance.now() - start);
  return {
    connected: true,
    latencyMs,
    dbInfo: versionRes[0] || {},
    counts: counts[0] || {},
  };
}

// ============================================================================
// OPERASI CRUD PROFIL SEKOLAH, PENYEDIA, & SPJ PELENGKAP
// ============================================================================

export async function fetchAllCloudData() {
  const sql = getSqlClient();
  const [profilRows, penyediaRows, spjRows, riwayatRows] = await Promise.all([
    sql`SELECT * FROM profil_sekolah ORDER BY id ASC LIMIT 1`,
    sql`SELECT * FROM data_penyedia ORDER BY nama_toko ASC`,
    sql`
      SELECT s.*, p.nama_toko, p.alamat_toko, p.npwp, p.nama_pemilik, p.jabatan_pemilik, p.telepon AS telepon_toko, p.nama_bank, p.nomor_rekening
      FROM spj_pelengkap s
      LEFT JOIN data_penyedia p ON s.id_penyedia = p.id_penyedia
      ORDER BY s.updated_at DESC
    `,
    sql`SELECT * FROM riwayat_cetak ORDER BY waktu_cetak DESC LIMIT 30`,
  ]);

  const spjMap = {};
  for (const row of spjRows) {
    spjMap[row.no_bpu] = row;
  }

  return {
    profil: profilRows[0] || null,
    penyediaList: penyediaRows || [],
    spjList: spjRows || [],
    spjMap,
    riwayatList: riwayatRows || [],
  };
}

export async function saveProfilSekolah(profil) {
  const sql = getSqlClient();
  const existing = await sql`SELECT id FROM profil_sekolah ORDER BY id ASC LIMIT 1`;
  if (existing.length > 0) {
    const id = existing[0].id;
    const rows = await sql`
      UPDATE profil_sekolah SET
        nama_sekolah = ${profil.nama_sekolah || ''},
        npsn = ${profil.npsn || ''},
        alamat = ${profil.alamat || ''},
        kelurahan_desa = ${profil.kelurahan_desa || ''},
        kecamatan = ${profil.kecamatan || ''},
        kabupaten_kota = ${profil.kabupaten_kota || ''},
        provinsi = ${profil.provinsi || ''},
        kode_pos = ${profil.kode_pos || ''},
        telepon = ${profil.telepon || ''},
        email = ${profil.email || ''},
        nama_dinas = ${profil.nama_dinas || 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA'},
        pemerintah_daerah = ${profil.pemerintah_daerah || 'PEMERINTAH KOTA DENPASAR'},
        nama_kepsek = ${profil.nama_kepsek || ''},
        nip_kepsek = ${profil.nip_kepsek || ''},
        nama_bendahara = ${profil.nama_bendahara || ''},
        nip_bendahara = ${profil.nip_bendahara || ''},
        nama_pemeriksa = ${profil.nama_pemeriksa || ''},
        nip_pemeriksa = ${profil.nip_pemeriksa || ''},
        tahun_anggaran = ${Number(profil.tahun_anggaran) || 2026},
        kota_ttd = ${profil.kota_ttd || 'Denpasar'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  } else {
    const rows = await sql`
      INSERT INTO profil_sekolah (
        nama_sekolah, npsn, alamat, kelurahan_desa, kecamatan, kabupaten_kota, provinsi,
        kode_pos, telepon, email, nama_dinas, pemerintah_daerah,
        nama_kepsek, nip_kepsek, nama_bendahara, nip_bendahara,
        nama_pemeriksa, nip_pemeriksa, tahun_anggaran, kota_ttd
      ) VALUES (
        ${profil.nama_sekolah || ''},
        ${profil.npsn || ''},
        ${profil.alamat || ''},
        ${profil.kelurahan_desa || ''},
        ${profil.kecamatan || ''},
        ${profil.kabupaten_kota || ''},
        ${profil.provinsi || ''},
        ${profil.kode_pos || ''},
        ${profil.telepon || ''},
        ${profil.email || ''},
        ${profil.nama_dinas || 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA'},
        ${profil.pemerintah_daerah || 'PEMERINTAH KOTA DENPASAR'},
        ${profil.nama_kepsek || ''},
        ${profil.nip_kepsek || ''},
        ${profil.nama_bendahara || ''},
        ${profil.nip_bendahara || ''},
        ${profil.nama_pemeriksa || ''},
        ${profil.nip_pemeriksa || ''},
        ${Number(profil.tahun_anggaran) || 2026},
        ${profil.kota_ttd || 'Denpasar'}
      )
      RETURNING *
    `;
    return rows[0];
  }
}

export async function upsertPenyedia(data) {
  const sql = getSqlClient();
  if (data.id_penyedia) {
    const rows = await sql`
      UPDATE data_penyedia SET
        nama_toko = ${data.nama_toko || ''},
        alamat_toko = ${data.alamat_toko || ''},
        npwp = ${data.npwp || ''},
        nama_pemilik = ${data.nama_pemilik || ''},
        jabatan_pemilik = ${data.jabatan_pemilik || 'Pemilik / Direktur'},
        telepon = ${data.telepon || ''},
        nama_bank = ${data.nama_bank || ''},
        nomor_rekening = ${data.nomor_rekening || ''},
        kategori_usaha = ${data.kategori_usaha || 'ATK & Barang Jasa'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id_penyedia = ${Number(data.id_penyedia)}
      RETURNING *
    `;
    return rows[0];
  } else {
    const rows = await sql`
      INSERT INTO data_penyedia (
        nama_toko, alamat_toko, npwp, nama_pemilik, jabatan_pemilik,
        telepon, nama_bank, nomor_rekening, kategori_usaha
      ) VALUES (
        ${data.nama_toko || ''},
        ${data.alamat_toko || ''},
        ${data.npwp || ''},
        ${data.nama_pemilik || ''},
        ${data.jabatan_pemilik || 'Pemilik / Direktur'},
        ${data.telepon || ''},
        ${data.nama_bank || ''},
        ${data.nomor_rekening || ''},
        ${data.kategori_usaha || 'ATK & Barang Jasa'}
      )
      RETURNING *
    `;
    return rows[0];
  }
}

export async function deletePenyediaById(idPenyedia) {
  const sql = getSqlClient();
  await sql`DELETE FROM data_penyedia WHERE id_penyedia = ${Number(idPenyedia)}`;
}

export async function upsertSpjPelengkap(spj) {
  const sql = getSqlClient();
  const itemsJsonStr = JSON.stringify(spj.items_json || []);
  const idPenyedia = spj.id_penyedia ? Number(spj.id_penyedia) : null;
  const tglPesanan = spj.tanggal_pesanan || null;
  const tglBast = spj.tanggal_bast || null;
  const tglLunas = spj.tanggal_lunas || null;

  const rows = await sql`
    INSERT INTO spj_pelengkap (
      no_bpu, id_penyedia, no_surat_pesanan, tanggal_pesanan,
      no_bast, tanggal_bast, no_nota_toko, tanggal_lunas,
      sumber_dana, kode_rekening, nama_kegiatan, uraian_kwitansi,
      total_bruto, ppn, pph21, pph22, pph23, pajak_daerah,
      items_json, catatan, status_cetak, updated_at
    ) VALUES (
      ${spj.no_bpu},
      ${idPenyedia},
      ${spj.no_surat_pesanan || ''},
      ${tglPesanan},
      ${spj.no_bast || ''},
      ${tglBast},
      ${spj.no_nota_toko || ''},
      ${tglLunas},
      ${spj.sumber_dana || 'BOSP Reguler'},
      ${spj.kode_rekening || ''},
      ${spj.nama_kegiatan || ''},
      ${spj.uraian_kwitansi || ''},
      ${Number(spj.total_bruto) || 0},
      ${Number(spj.ppn) || 0},
      ${Number(spj.pph21) || 0},
      ${Number(spj.pph22) || 0},
      ${Number(spj.pph23) || 0},
      ${Number(spj.pajak_daerah) || 0},
      ${itemsJsonStr}::jsonb,
      ${spj.catatan || ''},
      ${spj.status_cetak || 'Siap Cetak'},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (no_bpu) DO UPDATE SET
      id_penyedia = EXCLUDED.id_penyedia,
      no_surat_pesanan = EXCLUDED.no_surat_pesanan,
      tanggal_pesanan = EXCLUDED.tanggal_pesanan,
      no_bast = EXCLUDED.no_bast,
      tanggal_bast = EXCLUDED.tanggal_bast,
      no_nota_toko = EXCLUDED.no_nota_toko,
      tanggal_lunas = EXCLUDED.tanggal_lunas,
      sumber_dana = EXCLUDED.sumber_dana,
      kode_rekening = EXCLUDED.kode_rekening,
      nama_kegiatan = EXCLUDED.nama_kegiatan,
      uraian_kwitansi = EXCLUDED.uraian_kwitansi,
      total_bruto = EXCLUDED.total_bruto,
      ppn = EXCLUDED.ppn,
      pph21 = EXCLUDED.pph21,
      pph22 = EXCLUDED.pph22,
      pph23 = EXCLUDED.pph23,
      pajak_daerah = EXCLUDED.pajak_daerah,
      items_json = EXCLUDED.items_json,
      catatan = EXCLUDED.catatan,
      status_cetak = EXCLUDED.status_cetak,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return rows[0];
}

export async function markSpjAsPrinted(noBpu, jenisDokumen = 'Paket Lengkap SPJ', ukuranKertas = 'A4', totalNilai = 0) {
  const sql = getSqlClient();
  await sql`
    UPDATE spj_pelengkap
    SET status_cetak = 'Sudah Dicetak',
        terakhir_dicetak = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE no_bpu = ${noBpu}
  `;
  await sql`
    INSERT INTO riwayat_cetak (no_bpu, jenis_dokumen, ukuran_kertas, total_nilai)
    VALUES (${noBpu}, ${jenisDokumen}, ${ukuranKertas}, ${Number(totalNilai) || 0})
  `;
}
