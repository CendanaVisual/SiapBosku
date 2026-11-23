import initSqlJs from 'sql.js';

// ============================================================================
// LAYANAN PEMBACA SQLITE ARKAS 4 (WebAssembly sql.js di Memori Browser)
// - Membaca file .db / .sqlite / .arkas lokal tanpa unggah ke server
// - Menyediakan Table Inspector (daftar seluruh tabel + 10 baris pertama + kueri SQL)
// - Mengekstraksi transaksi BKU (Bukti Pengeluaran Uang), kode rekening, & rincian belanja
// - Menyediakan generator database simulasi ARKAS 4 realistis untuk uji coba instan
// ============================================================================

let sqlJsPromise = null;

export async function getSqlJsEngine() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      // Menggunakan path relatif ./sql-wasm.wasm agar kompatibel dengan GitHub Pages (base: './')
      locateFile: (file) => `./${file}`,
    });
  }
  return sqlJsPromise;
}

export async function loadSqliteFromArrayBuffer(arrayBuffer) {
  const SQL = await getSqlJsEngine();
  const uint8 = new Uint8Array(arrayBuffer);
  return new SQL.Database(uint8);
}

export function getAllSqliteTables(db) {
  if (!db) return [];
  const res = db.exec(`
    SELECT name, sql
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name ASC
  `);
  if (!res || res.length === 0) return [];

  const tables = [];
  for (const row of res[0].values) {
    const tableName = row[0];
    const createSql = row[1];
    let rowCount = 0;
    let columns = [];
    try {
      const countRes = db.exec(`SELECT COUNT(*) FROM "${tableName.replace(/"/g, '""')}"`);
      if (countRes?.[0]?.values?.[0]) {
        rowCount = Number(countRes[0].values[0][0]) || 0;
      }
      const colRes = db.exec(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`);
      if (colRes?.[0]?.values) {
        columns = colRes[0].values.map((c) => ({
          cid: c[0],
          name: c[1],
          type: c[2] || 'TEXT',
          notnull: Boolean(c[3]),
          pk: Boolean(c[5]),
        }));
      }
    } catch {
      // Abaikan jika tabel virtual tidak mendukung PRAGMA
    }
    tables.push({
      name: tableName,
      createSql,
      rowCount,
      columns,
    });
  }
  return tables;
}

export function inspectTableRows(db, tableName, limit = 10, offset = 0) {
  if (!db || !tableName) return { columns: [], rows: [], total: 0 };
  const safeName = tableName.replace(/"/g, '""');
  let total = 0;
  try {
    const countRes = db.exec(`SELECT COUNT(*) FROM "${safeName}"`);
    total = Number(countRes?.[0]?.values?.[0]?.[0]) || 0;
  } catch {
    total = 0;
  }

  const res = db.exec(`SELECT * FROM "${safeName}" LIMIT ${Number(limit) || 10} OFFSET ${Number(offset) || 0}`);
  if (!res || res.length === 0) {
    const pragma = db.exec(`PRAGMA table_info("${safeName}")`);
    const cols = pragma?.[0]?.values?.map((v) => v[1]) || [];
    return { columns: cols, rows: [], total };
  }

  const columns = res[0].columns;
  const rows = res[0].values.map((vals) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = vals[i];
    });
    return obj;
  });

  return { columns, rows, total };
}

export function runCustomSqliteQuery(db, query) {
  if (!db || !query?.trim()) return { columns: [], rows: [] };
  const res = db.exec(query);
  if (!res || res.length === 0) return { columns: [], rows: [] };
  const columns = res[0].columns;
  const rows = res[0].values.map((vals) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = vals[i];
    });
    return obj;
  });
  return { columns, rows };
}

// Ekstraksi Profil Sekolah dari database SQLite ARKAS (jika ada tabel sekolah / mst_sekolah)
export function extractSchoolProfileFromArkas(db) {
  if (!db) return null;
  const tables = getAllSqliteTables(db).map((t) => t.name.toLowerCase());
  const targetTable = tables.find((t) => t === 'sekolah' || t === 'mst_sekolah' || t === 'profil_sekolah');
  if (!targetTable) return null;

  try {
    const { rows } = inspectTableRows(db, targetTable, 1, 0);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      nama_sekolah: r.nama_sekolah || r.nama || '',
      npsn: String(r.npsn || ''),
      alamat: r.alamat || r.alamat_jalan || '',
      kecamatan: r.kecamatan || '',
      kabupaten_kota: r.kabupaten_kota || r.kabupaten || r.kota || '',
      provinsi: r.propinsi || r.provinsi || '',
      nama_kepsek: r.nama_kepsek || r.kepala_sekolah || '',
      nip_kepsek: r.nip_kepsek || r.nip_kepala_sekolah || '',
      nama_bendahara: r.nama_bendahara || r.bendahara || '',
      nip_bendahara: r.nip_bendahara || '',
      tahun_anggaran: Number(r.tahun_anggaran || r.tahun || 2026),
    };
  } catch {
    return null;
  }
}

// ============================================================================
// EKSTRAKTOR TRANSAKSI BKU ARKAS 4 OTOMATIS & FLEKSIBEL
// Mendukung skema asli ARKAS 4 (kas_umum + mst_kodering + mst_kegiatan + rapbs)
// maupun tabel BKU umum
// ============================================================================

export function extractBkuTransactions(db) {
  if (!db) return [];
  const allTables = getAllSqliteTables(db);
  const tableNames = allTables.map((t) => t.name);

  // 1. Cek apakah menggunakan tabel standar ARKAS 4: kas_umum
  const kasUmumTable = tableNames.find((n) => n.toLowerCase() === 'kas_umum');
  if (kasUmumTable) {
    return extractFromKasUmum(db, kasUmumTable, allTables);
  }

  // 2. Fallback: Cek tabel bku / transaksi_bku / pengeluaran
  const fallbackTable = tableNames.find((n) =>
    ['bku', 'transaksi_bku', 'bukti_pengeluaran', 'transaksi', 'pengeluaran'].includes(n.toLowerCase())
  );
  if (fallbackTable) {
    return extractFromGenericBkuTable(db, fallbackTable);
  }

  return [];
}

function extractFromKasUmum(db, kasUmumTable, allTables) {
  const tableMeta = allTables.find((t) => t.name === kasUmumTable);
  const colNames = (tableMeta?.columns || []).map((c) => c.name.toLowerCase());

  const hasKodering = allTables.some((t) => t.name.toLowerCase() === 'mst_kodering');
  const hasKegiatan = allTables.some((t) => t.name.toLowerCase() === 'mst_kegiatan');
  const hasRincian = allTables.some((t) => t.name.toLowerCase() === 'rincian_nota');

  // Jika skema lengkap ARKAS 4 tersedia dengan relasi kode_rekening / id_kegiatan
  let rows = [];
  try {
    if (hasKodering && hasKegiatan && colNames.includes('kode_rekening')) {
      const res = runCustomSqliteQuery(
        db,
        `
        SELECT
          k.*,
          COALESCE(r.uraian_rekening, k.nama_rekening, '') AS ref_nama_rekening,
          COALESCE(g.uraian_kegiatan, k.nama_kegiatan, '') AS ref_nama_kegiatan
        FROM "${kasUmumTable}" k
        LEFT JOIN mst_kodering r ON k.kode_rekening = r.kode_rekening
        LEFT JOIN mst_kegiatan g ON k.kode_kegiatan = g.kode_kegiatan
        WHERE COALESCE(k.soft_delete, 0) = 0
        ORDER BY k.tanggal_transaksi ASC, k.no_bukti ASC, k.id_kas_umum ASC
        `
      );
      rows = res.rows;
    } else {
      const res = runCustomSqliteQuery(db, `SELECT * FROM "${kasUmumTable}" ORDER BY 1 ASC`);
      rows = res.rows;
    }
  } catch {
    const res = runCustomSqliteQuery(db, `SELECT * FROM "${kasUmumTable}"`);
    rows = res.rows;
  }

  // Baca rincian_nota jika ada
  const rincianByKasId = {};
  if (hasRincian) {
    try {
      const rRes = runCustomSqliteQuery(db, `SELECT * FROM rincian_nota ORDER BY id_rincian ASC`);
      for (const item of rRes.rows) {
        const key = item.id_kas_umum || item.no_bukti;
        if (!rincianByKasId[key]) rincianByKasId[key] = [];
        rincianByKasId[key].push(item);
      }
    } catch {
      // Abaikan jika gagal
    }
  }

  // Filter hanya transaksi pengeluaran / belanja (atau memiliki no_bukti BPU/BKP)
  const result = [];
  rows.forEach((r, idx) => {
    const noBpu = String(r.no_bukti || r.no_bpu || r.nomor_bukti || '').trim();
    const idRefBku = Number(r.id_ref_bku ?? 4);
    const nominal = Number(r.saldo ?? r.nominal ?? r.kredit ?? r.nilai ?? r.jumlah ?? 0);
    const uraian = String(r.uraian || r.keterangan || '').trim();

    // Lewati baris penerimaan dana / tarik tunai / bunga bank yang bukan pengeluaran BPU
    const isPenerimaan =
      [2, 3, 8, 9].includes(idRefBku) ||
      (!noBpu.toUpperCase().startsWith('BPU') &&
        !noBpu.toUpperCase().startsWith('BKP') &&
        /terima dana|penerimaan|saldo awal|pergeseran|tarik tunai/i.test(uraian));

    if (isPenerimaan || nominal <= 0) return;

    // Deteksi apakah baris ini merupakan baris pungut/setor pajak di ARKAS
    const isPajakRow =
      [5, 6, 10, 11].includes(idRefBku) ||
      /^(terima pajak|setor pajak|pungut pajak|potongan pajak)/i.test(uraian);
    if (isPajakRow) return;

    const kodeRek = String(r.kode_rekening || r.kodering || '5.1.02.01.01.0024').trim();
    const namaRek = String(r.ref_nama_rekening || r.nama_rekening || 'Belanja Barang dan Jasa').trim();
    const kodeKeg = String(r.kode_kegiatan || r.id_kegiatan || '03.03').trim();
    const namaKeg = String(
      r.ref_nama_kegiatan || r.nama_kegiatan || 'Pelaksanaan Administrasi Kegiatan Sekolah'
    ).trim();
    const tanggal = String(r.tanggal_transaksi || r.tanggal || '2026-01-15').slice(0, 10);
    const sumberDana = String(r.sumber_dana || r.nama_sumber_dana || 'BOSP Reguler').trim();
    const volume = Number(r.volume || r.qty || 1);
    const satuan = String(r.satuan || 'Paket').trim();
    const hargaSatuan = Number(r.harga_satuan || (volume > 0 ? Math.round(nominal / volume) : nominal));

    const idKas = r.id_kas_umum || r.id || `ROW-${idx + 1}`;
    const subItems = rincianByKasId[idKas] || [];

    result.push({
      id_item: String(idKas),
      no_bpu: noBpu || `BPU-${String(idx + 1).padStart(2, '0')}`,
      tanggal_transaksi: tanggal,
      kode_rekening: kodeRek,
      nama_rekening: namaRek,
      kode_kegiatan: kodeKeg,
      nama_kegiatan: `${kodeKeg} - ${namaKeg}`.replace(/^ - /, ''),
      uraian,
      volume,
      satuan,
      harga_satuan: hargaSatuan,
      nominal,
      ppn: Number(r.ppn || 0),
      pph21: Number(r.pph21 || 0),
      pph22: Number(r.pph22 || 0),
      pph23: Number(r.pph23 || 0),
      pajak_daerah: Number(r.pajak_daerah || 0),
      sumber_dana: sumberDana,
      npwp_arkas: r.npwp || '',
      ntpn: r.ntpn || '',
      sub_items: subItems,
    });
  });

  return result;
}

function extractFromGenericBkuTable(db, tableName) {
  const { rows } = runCustomSqliteQuery(db, `SELECT * FROM "${tableName.replace(/"/g, '""')}"`);
  return rows
    .map((r, idx) => {
      const nominal = Number(r.nominal ?? r.jumlah ?? r.saldo ?? r.kredit ?? r.nilai ?? 0);
      if (nominal <= 0) return null;
      return {
        id_item: String(r.id || idx + 1),
        no_bpu: String(r.no_bpu || r.no_bukti || `BPU-${String(idx + 1).padStart(2, '0')}`),
        tanggal_transaksi: String(r.tanggal_transaksi || r.tanggal || '2026-01-15').slice(0, 10),
        kode_rekening: String(r.kode_rekening || '5.1.02.01.01.0024'),
        nama_rekening: String(r.nama_rekening || 'Belanja Barang dan Jasa'),
        kode_kegiatan: String(r.kode_kegiatan || '03.03'),
        nama_kegiatan: String(r.nama_kegiatan || '03.03. Pelaksanaan Administrasi Kegiatan Sekolah'),
        uraian: String(r.uraian || r.keterangan || `Transaksi #${idx + 1}`),
        volume: Number(r.volume || 1),
        satuan: String(r.satuan || 'Paket'),
        harga_satuan: Number(r.harga_satuan || nominal),
        nominal,
        ppn: Number(r.ppn || 0),
        pph21: Number(r.pph21 || 0),
        pph22: Number(r.pph22 || 0),
        pph23: Number(r.pph23 || 0),
        pajak_daerah: Number(r.pajak_daerah || 0),
        sumber_dana: String(r.sumber_dana || 'BOSP Reguler'),
        sub_items: [],
      };
    })
    .filter(Boolean);
}

// ============================================================================
// GENERATOR DATABASE SQLITE SIMULASI ARKAS 4 (UNTUK DEMO & UJI COBA LANGSUNG)
// ============================================================================

export async function createDemoArkasDatabase() {
  const SQL = await getSqlJsEngine();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE sekolah (
      sekolah_id TEXT PRIMARY KEY,
      npsn TEXT,
      nama_sekolah TEXT,
      alamat TEXT,
      kecamatan TEXT,
      kabupaten_kota TEXT,
      propinsi TEXT,
      nama_kepsek TEXT,
      nip_kepsek TEXT,
      nama_bendahara TEXT,
      nip_bendahara TEXT,
      tahun_anggaran INTEGER
    );

    INSERT INTO sekolah VALUES (
      '50103123-SDN7-2026',
      '50103123',
      'SD NEGERI 7 PEDUNGAN',
      'Jl. Pulau Saelus No. 45, Pedungan',
      'Denpasar Selatan',
      'Kota Denpasar',
      'Bali',
      'I Wayan Sudarma, S.Pd., M.Pd.',
      '19750412 199903 1 006',
      'Ni Luh Putu Sari Dewi, S.Pd.',
      '19860819 201101 2 012',
      2026
    );

    CREATE TABLE mst_sumber_dana (
      id_sumber_dana INTEGER PRIMARY KEY,
      kode_sumber_dana TEXT,
      nama_sumber_dana TEXT
    );

    INSERT INTO mst_sumber_dana VALUES
      (1, 'BOS-REG', 'BOSP Reguler'),
      (2, 'BOS-KIN', 'BOSP Kinerja');

    CREATE TABLE mst_kodering (
      kode_rekening TEXT PRIMARY KEY,
      uraian_rekening TEXT,
      kategori TEXT
    );

    INSERT INTO mst_kodering VALUES
      ('5.1.02.01.01.0024', 'Belanja Alat/Bahan untuk Kegiatan Kantor - Alat Tulis Kantor', 'Belanja Barang'),
      ('5.1.02.01.01.0025', 'Belanja Alat/Bahan untuk Kegiatan Kantor - Kertas dan Cover', 'Belanja Barang'),
      ('5.1.02.01.01.0026', 'Belanja Alat/Bahan untuk Kegiatan Kantor - Bahan Cetak', 'Belanja Barang'),
      ('5.1.02.01.01.0029', 'Belanja Alat/Bahan untuk Kegiatan Kantor - Bahan Komputer', 'Belanja Barang'),
      ('5.1.02.01.01.0052', 'Belanja Makanan dan Minuman Rapat', 'Belanja Barang'),
      ('5.1.02.02.01.0061', 'Belanja Tagihan Listrik', 'Belanja Jasa'),
      ('5.1.02.02.01.0063', 'Belanja Kawat/Faksimili/Internet/TV Berlangganan', 'Belanja Jasa'),
      ('5.1.02.03.02.0405', 'Belanja Pemeliharaan Komputer - Peralatan Komputer Lokal', 'Belanja Pemeliharaan'),
      ('5.2.02.05.01.0005', 'Belanja Modal Alat Kantor Lainnya (Proyektor & Printer)', 'Belanja Modal'),
      ('5.2.05.01.01.0001', 'Belanja Modal Buku Umum dan Buku Teks Utama Kurikulum Nasional', 'Belanja Modal');

    CREATE TABLE mst_kegiatan (
      kode_kegiatan TEXT PRIMARY KEY,
      uraian_kegiatan TEXT,
      standar_nasional TEXT
    );

    INSERT INTO mst_kegiatan VALUES
      ('03.03', 'Pelaksanaan Administrasi Kegiatan Sekolah', 'Standar Pengelolaan'),
      ('02.06', 'Pengembangan Profesi Pendidik dan Tenaga Kependidikan', 'Standar PTK'),
      ('05.08', 'Pemeliharaan Sarana dan Prasarana Sekolah', 'Standar Sarpras'),
      ('06.05', 'Pelaksanaan Administrasi Kegiatan Satuan Pendidikan', 'Standar Pembiayaan'),
      ('06.07', 'Pembiayaan Langganan Daya dan Jasa', 'Standar Pembiayaan'),
      ('05.02', 'Pengembangan Perpustakaan dan Pojok Baca Digital', 'Standar Sarpras');

    CREATE TABLE rapbs (
      id_rapbs INTEGER PRIMARY KEY,
      kode_kegiatan TEXT,
      kode_rekening TEXT,
      uraian_komponen TEXT,
      volume INTEGER,
      satuan TEXT,
      harga_satuan NUMERIC,
      jumlah_anggaran NUMERIC,
      sumber_dana TEXT
    );

    INSERT INTO rapbs VALUES
      (101, '03.03', '5.1.02.01.01.0025', 'Kertas HVS F4 70 Gram Sinar Dunia', 30, 'Rim', 58000, 1740000, 'BOSP Reguler'),
      (102, '03.03', '5.1.02.01.01.0024', 'Spidol Whiteboard Snowman & Tinta Refill', 24, 'Kotak', 45000, 1080000, 'BOSP Reguler'),
      (103, '03.03', '5.1.02.01.01.0024', 'Ordner Folio, Map Plastik & Lakban Jilid', 35, 'Buah', 18000, 630000, 'BOSP Reguler'),
      (104, '02.06', '5.1.02.01.01.0052', 'Nasi Kotak Rapat Kerja Guru & Penyusunan RKAS', 35, 'Kotak', 35000, 1225000, 'BOSP Reguler'),
      (105, '02.06', '5.1.02.01.01.0052', 'Snack / Kudapan Rapat Kerja Guru & Penyusunan RKAS', 35, 'Kotak', 15000, 525000, 'BOSP Reguler'),
      (106, '03.03', '5.1.02.01.01.0029', 'Tinta Printer Epson 003 Original (C/M/Y/K)', 16, 'Botol', 115000, 1840000, 'BOSP Reguler'),
      (107, '03.03', '5.1.02.01.01.0026', 'Cetak Banner, Sampul Rapor & Buku Administrasi Kelas', 1, 'Paket', 2450000, 2450000, 'BOSP Reguler'),
      (108, '05.08', '5.1.02.03.02.0405', 'Servis Berkala Laptop Chromebook & Penggantian SSD', 4, 'Unit', 650000, 2600000, 'BOSP Reguler'),
      (109, '05.02', '5.2.05.01.01.0001', 'Pengadaan Buku Teks Utama Pendamping Kelas 1, 4 & 6', 120, 'Eksemplar', 48500, 5820000, 'BOSP Reguler'),
      (110, '05.08', '5.2.02.05.01.0005', 'Pengadaan Proyektor LCD Pembelajaran Interaktif (BOSP Kinerja)', 2, 'Unit', 6750000, 13500000, 'BOSP Kinerja');

    CREATE TABLE kas_umum (
      id_kas_umum INTEGER PRIMARY KEY,
      id_ref_bku INTEGER,
      no_bukti TEXT,
      tanggal_transaksi TEXT,
      kode_kegiatan TEXT,
      kode_rekening TEXT,
      uraian TEXT,
      volume INTEGER,
      satuan TEXT,
      harga_satuan NUMERIC,
      saldo NUMERIC,
      ppn NUMERIC DEFAULT 0,
      pph21 NUMERIC DEFAULT 0,
      pph22 NUMERIC DEFAULT 0,
      pph23 NUMERIC DEFAULT 0,
      pajak_daerah NUMERIC DEFAULT 0,
      sumber_dana TEXT DEFAULT 'BOSP Reguler',
      soft_delete INTEGER DEFAULT 0
    );

    INSERT INTO kas_umum VALUES
      -- Penerimaan Dana Tahap 1 (otomatis diabaikan oleh ekstraktor pengeluaran BPU)
      (1, 2, 'BM-01', '2026-01-08', '06.05', '', 'Penerimaan Dana BOSP Reguler Tahap I Tahun 2026', 1, 'Tahap', 145000000, 145000000, 0, 0, 0, 0, 0, 'BOSP Reguler', 0),

      -- BPU-01: 3 item belanja ATK pada tanggal & BPU yang sama (cocok untuk uji Gabung Transaksi!)
      (2, 4, 'BPU-01', '2026-01-15', '03.03', '5.1.02.01.01.0025', 'Belanja Kertas HVS F4 70 Gram Sinar Dunia (30 Rim)', 30, 'Rim', 58000, 1740000, 172432, 0, 23446, 0, 0, 'BOSP Reguler', 0),
      (3, 4, 'BPU-01', '2026-01-15', '03.03', '5.1.02.01.01.0024', 'Belanja Spidol Whiteboard Snowman & Tinta Refill (24 Kotak)', 24, 'Kotak', 45000, 1080000, 107027, 0, 14554, 0, 0, 'BOSP Reguler', 0),
      (4, 4, 'BPU-01', '2026-01-15', '03.03', '5.1.02.01.01.0024', 'Belanja Ordner Folio, Map Plastik & Lakban Jilid (35 Buah)', 35, 'Buah', 18000, 630000, 62433, 0, 8486, 0, 0, 'BOSP Reguler', 0),

      -- BPU-02: 2 item belanja konsumsi rapat pada BPU-02
      (5, 4, 'BPU-02', '2026-01-22', '02.06', '5.1.02.01.01.0052', 'Belanja Nasi Kotak Rapat Kerja Penyusunan RKAS & Kurikulum', 35, 'Kotak', 35000, 1225000, 0, 0, 0, 0, 122500, 'BOSP Reguler', 0),
      (6, 4, 'BPU-02', '2026-01-22', '02.06', '5.1.02.01.01.0052', 'Belanja Snack / Kudapan Rapat Kerja Penyusunan RKAS & Kurikulum', 35, 'Kotak', 15000, 525000, 0, 0, 0, 0, 52500, 'BOSP Reguler', 0),

      -- BPU-03 & BPU-04: Februari 2026 (2 item pada tanggal yang sama 12 Februari 2026)
      (7, 4, 'BPU-03', '2026-02-12', '03.03', '5.1.02.01.01.0029', 'Belanja Tinta Printer Epson 003 Original 4 Warna (16 Botol)', 16, 'Botol', 115000, 1840000, 182342, 0, 24793, 0, 0, 'BOSP Reguler', 0),
      (8, 4, 'BPU-03', '2026-02-12', '03.03', '5.1.02.01.01.0029', 'Belanja Cartridge Toner LaserJet HP 85A Original (2 Unit)', 2, 'Unit', 480000, 960000, 95135, 0, 12937, 0, 0, 'BOSP Reguler', 0),

      -- BPU-04: Cetakan & Spanduk Sekolah
      (9, 4, 'BPU-04', '2026-02-19', '03.03', '5.1.02.01.01.0026', 'Belanja Cetak Sampul Rapor, Kartu Inventaris Ruangan & Banner POS', 1, 'Paket', 2450000, 2450000, 242793, 0, 33018, 0, 0, 'BOSP Reguler', 0),

      -- BPU-05: Maret 2026 - Pemeliharaan Komputer & Jaringan (2 item Jasa + Sparepart)
      (10, 4, 'BPU-05', '2026-03-10', '05.08', '5.1.02.03.02.0405', 'Penggantian SSD 256GB & RAM Laptop Operasional Sekolah (4 Unit)', 4, 'Unit', 450000, 1800000, 178378, 0, 0, 0, 0, 'BOSP Reguler', 0),
      (11, 4, 'BPU-05', '2026-03-10', '05.08', '5.1.02.03.02.0405', 'Jasa Servis Berkala Laptop Chromebook & Instalasi Jaringan Lab', 4, 'Unit', 200000, 800000, 0, 0, 0, 16000, 0, 'BOSP Reguler', 0),

      -- BPU-06: Maret 2026 - Belanja Modal Buku Perpustakaan
      (12, 4, 'BPU-06', '2026-03-24', '05.02', '5.2.05.01.01.0001', 'Belanja Modal Buku Teks Utama Kurikulum Nasional Kelas 1 & 4', 70, 'Eksemplar', 48500, 3395000, 0, 0, 45878, 0, 0, 'BOSP Reguler', 0),
      (13, 4, 'BPU-06', '2026-03-24', '05.02', '5.2.05.01.01.0001', 'Belanja Modal Buku Teks Utama Kurikulum Nasional Kelas 6 & Bacaan Literasi', 50, 'Eksemplar', 48500, 2425000, 0, 0, 32770, 0, 0, 'BOSP Reguler', 0),

      -- BPU-07: April 2026 - Langganan Daya & Jasa
      (14, 4, 'BPU-07', '2026-04-06', '06.07', '5.1.02.02.01.0063', 'Pembayaran Tagihan Internet Sekolah Dedicated 100 Mbps Bulan April', 1, 'Bulan', 850000, 850000, 0, 0, 0, 0, 0, 'BOSP Reguler', 0),

      -- BPU-08: April 2026 - BOSP Kinerja (Belanja Modal Proyektor & Layar)
      (15, 4, 'BPU-08', '2026-04-16', '05.08', '5.2.02.05.01.0005', 'Belanja Modal Proyektor LCD Epson EB-E500 XGA 3300 Lumens (BOSP Kinerja)', 2, 'Unit', 5850000, 11700000, 1159459, 0, 157703, 0, 0, 'BOSP Kinerja', 0),
      (16, 4, 'BPU-08', '2026-04-16', '05.08', '5.2.02.05.01.0005', 'Belanja Modal Layar Proyektor Tripod 70 Inch & Kabel HDMI 15m (BOSP Kinerja)', 2, 'Set', 900000, 1800000, 178378, 0, 24264, 0, 0, 'BOSP Kinerja', 0);
  `);

  return db;
}
