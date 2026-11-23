// ============================================================================
// UTILITAS TERBILANG RUPIAH, FORMAT MATA UANG, & KALIMAT TANGGAL RESMI BAST
// ============================================================================

const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
];

export function angkaKeKata(n) {
  const num = Math.floor(Math.abs(Number(n) || 0));
  if (num === 0) return '';
  if (num < 12) return SATUAN[num];
  if (num < 20) return `${angkaKeKata(num - 10)} Belas`;
  if (num < 100) {
    const puluhan = Math.floor(num / 10);
    const sisa = num % 10;
    return `${angkaKeKata(puluhan)} Puluh${sisa > 0 ? ' ' + angkaKeKata(sisa) : ''}`;
  }
  if (num < 200) {
    const sisa = num - 100;
    return `Seratus${sisa > 0 ? ' ' + angkaKeKata(sisa) : ''}`;
  }
  if (num < 1000) {
    const ratusan = Math.floor(num / 100);
    const sisa = num % 100;
    return `${angkaKeKata(ratusan)} Ratus${sisa > 0 ? ' ' + angkaKeKata(sisa) : ''}`;
  }
  if (num < 2000) {
    const sisa = num - 1000;
    return `Seribu${sisa > 0 ? ' ' + angkaKeKata(sisa) : ''}`;
  }
  if (num < 1000000) {
    const ribuan = Math.floor(num / 1000);
    const sisa = num % 1000;
    return `${angkaKeKata(ribuan)} Ribu${sisa > 0 ? ' ' + angkaKeKata(sisa) : ''}`;
  }
  if (num < 1000000000) {
    const jutaan = Math.floor(num / 1000000);
    const sisa = num % 1000000;
    return `${angkaKeKata(jutaan)} Juta${sisa > 0 ? ' ' + angkaKeKata(sisa) : ''}`;
  }
  if (num < 1000000000000) {
    const miliaran = Math.floor(num / 1000000000);
    const sisa = num % 1000000000;
    return `${angkaKeKata(miliaran)} Miliar${sisa > 0 ? ' ' + angkaKeKata(sisa) : ''}`;
  }
  const triliunan = Math.floor(num / 1000000000000);
  const sisa = num % 1000000000000;
  return `${angkaKeKata(triliunan)} Triliun${sisa > 0 ? ' ' + angkaKeKata(sisa) : ''}`;
}

export function terbilangRupiah(nominal) {
  const num = Math.round(Number(nominal) || 0);
  if (num <= 0) return 'Nol Rupiah';
  return `${angkaKeKata(num).replace(/\s+/g, ' ').trim()} Rupiah`;
}

export function formatRupiah(nominal, withPrefix = true) {
  const num = Math.round(Number(nominal) || 0);
  const formatted = new Intl.NumberFormat('id-ID').format(num);
  return withPrefix ? `Rp ${formatted}` : formatted;
}

export const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const NAMA_HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const clean = String(dateStr).slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-';
  const dt = parseLocalDate(dateStr);
  const d = dt.getDate();
  const m = NAMA_BULAN[dt.getMonth()] || '';
  const y = dt.getFullYear();
  return `${d} ${m} ${y}`;
}

export function getMonthNumber(dateStr) {
  if (!dateStr) return 0;
  const dt = parseLocalDate(dateStr);
  return dt.getMonth() + 1;
}

export function tanggalKeKalimatBAST(dateStr) {
  const dt = parseLocalDate(dateStr);
  const hari = NAMA_HARI[dt.getDay()];
  const tgl = dt.getDate();
  const bulan = NAMA_BULAN[dt.getMonth()];
  const tahun = dt.getFullYear();

  const tglKata = angkaKeKata(tgl) || 'Satu';
  const tahunKata = angkaKeKata(tahun) || 'Dua Ribu Dua Puluh Enam';
  const dd = String(tgl).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');

  return {
    hari,
    tglKata,
    bulan,
    tahunKata,
    formatAngka: `${dd}-${mm}-${tahun}`,
    kalimatLengkap: `Pada hari ini ${hari} tanggal ${tglKata} bulan ${bulan} tahun ${tahunKata} (${dd}-${mm}-${tahun})`,
  };
}
