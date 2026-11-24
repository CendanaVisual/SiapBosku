import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  FileText,
  FileCheck2,
  ClipboardList,
  Layers,
  Edit3,
  CheckCircle2,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import {
  formatRupiah,
  terbilangRupiah,
  formatTanggalIndo,
  tanggalKeKalimatBAST,
} from '../utils/terbilang';
import { markSpjAsPrinted } from '../services/neonClient';

// ============================================================================
// MODUL CETAK DOKUMEN RESMI (@media print) — UKURAN A4 & F4 (FOLIO)
// 1. Kwitansi Dinas (lengkap terbilang rupiah otomatis, PPN/PPh, kode rekening,
//    dan kolom tanda tangan Kepala Sekolah, Bendahara, serta Penerima)
// 2. Nota Pesanan / Surat Pesanan Barang
// 3. Berita Acara Serah Terima (BAST)
// ============================================================================

export default function PrintPreviewTab({
  bkuList,
  spjMap,
  profil,
  penyediaList,
  activeDraft,
  selectedBpuKey,
  onSelectBpuKey,
  onOpenSpjModal,
  onRefreshCloud,
}) {
  const [docType, setDocType] = useState('ALL'); // 'KWITANSI' | 'NOTA_PESANAN' | 'BAST' | 'ALL'
  const [paperSize, setPaperSize] = useState('A4'); // 'A4' | 'F4'
  const [printingStatus, setPrintingStatus] = useState('');

  // Daftar semua BPU unik dari ARKAS + SPJ yang ada di Neon
  const allBpuKeys = useMemo(() => {
    const keys = new Set();
    bkuList.forEach((it) => keys.add(it.no_bpu));
    Object.keys(spjMap || {}).forEach((k) => keys.add(k));
    return Array.from(keys);
  }, [bkuList, spjMap]);

  const currentBpu = selectedBpuKey || activeDraft?.no_bpu || allBpuKeys[0] || 'BPU-01';

  // Susun data dokumen lengkap dengan menggabungkan transaksi ARKAS + spj_pelengkap Neon + profil_sekolah
  const compiledDoc = useMemo(() => {
    const bkuItems = bkuList.filter((it) => it.no_bpu === currentBpu);
    const spj = spjMap?.[currentBpu] || null;
    const draft = activeDraft?.no_bpu === currentBpu ? activeDraft : null;

    const penyedia =
      penyediaList.find((p) => Number(p.id_penyedia) === Number(spj?.id_penyedia)) ||
      penyediaList[0] || {
        nama_toko: 'CV. Cendana Mitra Media',
        alamat_toko: 'Jl. Tukad Batanghari No. 88, Denpasar Selatan',
        npwp: '92.415.778.9-901.000',
        nama_pemilik: 'I Gede Cendana Putra',
        jabatan_pemilik: 'Direktur',
        telepon: '0812-3845-9901',
        nama_bank: 'BPD Bali',
        nomor_rekening: '010.02.02.11450-8',
      };

    const items =
      spj?.items_json && Array.isArray(spj.items_json) && spj.items_json.length > 0
        ? spj.items_json
        : draft?.items && draft.items.length > 0
        ? draft.items
        : bkuItems.map((it, idx) => ({
            no: idx + 1,
            uraian: it.uraian,
            volume: it.volume,
            satuan: it.satuan,
            harga_satuan: it.harga_satuan,
            jumlah: it.nominal,
            kode_rekening: it.kode_rekening,
          }));

    const totalBruto =
      Number(spj?.total_bruto) ||
      Number(draft?.total_bruto) ||
      items.reduce((acc, it) => acc + (Number(it.jumlah || it.nominal) || 0), 0);

    const ppn = Number(spj?.ppn ?? draft?.ppn ?? bkuItems.reduce((s, i) => s + (Number(i.ppn) || 0), 0));
    const pph21 = Number(spj?.pph21 ?? draft?.pph21 ?? bkuItems.reduce((s, i) => s + (Number(i.pph21) || 0), 0));
    const pph22 = Number(spj?.pph22 ?? draft?.pph22 ?? bkuItems.reduce((s, i) => s + (Number(i.pph22) || 0), 0));
    const pph23 = Number(spj?.pph23 ?? draft?.pph23 ?? bkuItems.reduce((s, i) => s + (Number(i.pph23) || 0), 0));
    const pajakDaerah = Number(
      spj?.pajak_daerah ?? draft?.pajak_daerah ?? bkuItems.reduce((s, i) => s + (Number(i.pajak_daerah) || 0), 0)
    );
    const totalPajak = ppn + pph21 + pph22 + pph23 + pajakDaerah;
    const totalNetto = Math.max(0, totalBruto - totalPajak);

    const tglDefault = bkuItems[0]?.tanggal_transaksi || '2026-01-15';
    const bpuDigits = String(currentBpu).replace(/\D/g, '') || '01';

    return {
      no_bpu: currentBpu,
      sumber_dana: spj?.sumber_dana || draft?.sumber_dana || bkuItems[0]?.sumber_dana || 'BOSP Reguler',
      kode_rekening: spj?.kode_rekening || draft?.kode_rekening || bkuItems[0]?.kode_rekening || '5.1.02.01.01.0024',
      nama_kegiatan:
        spj?.nama_kegiatan ||
        draft?.nama_kegiatan ||
        bkuItems[0]?.nama_kegiatan ||
        '03.03. Pelaksanaan Administrasi Kegiatan Sekolah',
      uraian_kwitansi:
        spj?.uraian_kwitansi ||
        draft?.uraian_gabungan ||
        items.map((i) => i.uraian).join('; ') ||
        'Belanja Kegiatan Operasional Sekolah',
      no_surat_pesanan: spj?.no_surat_pesanan || `421.2/${bpuDigits.padStart(3, '0')}/SP-BOSP/SDN7/2026`,
      tanggal_pesanan: spj?.tanggal_pesanan ? String(spj.tanggal_pesanan).slice(0, 10) : tglDefault,
      no_bast: spj?.no_bast || `421.2/${bpuDigits.padStart(3, '0')}/BAST-BOSP/SDN7/2026`,
      tanggal_bast: spj?.tanggal_bast ? String(spj.tanggal_bast).slice(0, 10) : tglDefault,
      no_nota_toko: spj?.no_nota_toko || `INV/${bpuDigits.padStart(3, '0')}/2026`,
      tanggal_lunas: spj?.tanggal_lunas ? String(spj.tanggal_lunas).slice(0, 10) : tglDefault,
      total_bruto: totalBruto,
      ppn,
      pph21,
      pph22,
      pph23,
      pajak_daerah: pajakDaerah,
      total_pajak: totalPajak,
      total_netto: totalNetto,
      items,
      penyedia,
      status_cetak: spj?.status_cetak || 'Draft Lokal',
      is_synced: Boolean(spj),
    };
  }, [currentBpu, bkuList, spjMap, penyediaList, activeDraft]);

  // Set ukuran halaman @page dinamis saat memilih A4 atau F4 (215mm x 330mm)
  useEffect(() => {
    const styleId = 'siapbosku-dynamic-page-size';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    if (paperSize === 'F4') {
      styleEl.innerHTML = `@media print { @page { size: 215mm 330mm; margin: 12mm 15mm; } }`;
    } else {
      styleEl.innerHTML = `@media print { @page { size: A4 portrait; margin: 12mm 15mm; } }`;
    }
  }, [paperSize]);

  const sekolah = {
    pemerintah_daerah: profil?.pemerintah_daerah || 'PEMERINTAH KOTA DENPASAR',
    nama_dinas: profil?.nama_dinas || 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA',
    nama_sekolah: profil?.nama_sekolah || 'SD NEGERI 7 PEDUNGAN',
    npsn: profil?.npsn || '50103069',
    alamat: profil?.alamat || 'Jl. Pulau Saelus No. 45, Pedungan, Denpasar Selatan',
    telepon: profil?.telepon || '(0361) 721890',
    email: profil?.email || 'sdn7pedungan@pendidikan.denpasarkota.go.id',
    kota_ttd: profil?.kota_ttd || 'Denpasar',
    tahun_anggaran: profil?.tahun_anggaran || 2027,
    nama_kepsek: profil?.nama_kepsek || 'I Wayan Sudarma, S.Pd., M.Pd.',
    nip_kepsek: profil?.nip_kepsek || '19750412 199903 1 006',
    nama_bendahara: profil?.nama_bendahara || 'Ni Luh Putu Sari Dewi, S.Pd.',
    nip_bendahara: profil?.nip_bendahara || '19860819 201101 2 012',
    nama_pemeriksa: profil?.nama_pemeriksa || 'I Made Arya Wibawa, S.Kom.',
    nip_pemeriksa: profil?.nip_pemeriksa || '19900215 201903 1 004',
  };

  const handlePrintNow = async () => {
    window.print();
    try {
      const labelDoc =
        docType === 'KWITANSI'
          ? 'Kwitansi Dinas'
          : docType === 'NOTA_PESANAN'
          ? 'Nota Pesanan'
          : docType === 'BAST'
          ? 'BAST'
          : 'Paket Lengkap SPJ (3 Dokumen)';
      await markSpjAsPrinted(compiledDoc.no_bpu, labelDoc, paperSize, compiledDoc.total_bruto);
      setPrintingStatus(`Riwayat cetak ${compiledDoc.no_bpu} tercatat di Cloud Neon.`);
      if (onRefreshCloud) await onRefreshCloud();
    } catch {
      // Abaikan jika belum tersimpan di Neon
    }
  };

  const handleEditCurrentSpj = () => {
    onOpenSpjModal({
      no_bpu: compiledDoc.no_bpu,
      tanggal_transaksi: compiledDoc.tanggal_lunas,
      sumber_dana: compiledDoc.sumber_dana,
      kode_rekening: compiledDoc.kode_rekening,
      nama_kegiatan: compiledDoc.nama_kegiatan,
      uraian_gabungan: compiledDoc.uraian_kwitansi,
      total_bruto: compiledDoc.total_bruto,
      ppn: compiledDoc.ppn,
      pph21: compiledDoc.pph21,
      pph22: compiledDoc.pph22,
      pph23: compiledDoc.pph23,
      pajak_daerah: compiledDoc.pajak_daerah,
      items: compiledDoc.items,
    });
  };

  const kalimatBast = tanggalKeKalimatBAST(compiledDoc.tanggal_bast);

  // Komponen Kop Surat Resmi Sekolah dengan Logo SiapBosKu
  const KopSuratSekolah = () => (
    <div className="border-b-4 border-double border-black pb-2.5 mb-4 flex items-center justify-between gap-4 font-serif text-black">
      <img
        src="./logo-siapbosku.png"
        onError={(e) => {
          e.currentTarget.src = './logo-siapbosku.gif';
        }}
        alt="Logo Sekolah / SiapBosKu"
        className="w-16 h-16 object-contain shrink-0"
      />
      <div className="text-center flex-1">
        <div className="text-sm font-bold uppercase tracking-wide">{sekolah.pemerintah_daerah}</div>
        <div className="text-sm font-bold uppercase tracking-wide">{sekolah.nama_dinas}</div>
        <div className="text-xl font-extrabold uppercase tracking-wider mt-0.5">{sekolah.nama_sekolah}</div>
        <div className="text-xs mt-0.5">
          Alamat: {sekolah.alamat} • Telp: {sekolah.telepon} • NPSN: {sekolah.npsn}
        </div>
        <div className="text-[11px] italic">Pos-el: {sekolah.email}</div>
      </div>
      <div className="w-16 shrink-0" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toolbar Kontrol Pratinjau & Cetak (Disembunyikan saat @media print) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Pilih Nomor BPU */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Pilih Nomor BPU SPJ
              </label>
              <select
                value={currentBpu}
                onChange={(e) => onSelectBpuKey(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono font-bold text-sm text-blue-900 focus:border-blue-600 outline-none"
              >
                {allBpuKeys.map((k) => (
                  <option key={k} value={k}>
                    {k} — {spjMap[k]?.nama_toko ? `(${spjMap[k].nama_toko})` : '(ARKAS BKU)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilih Jenis Dokumen */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Dokumen yang Ditampilkan / Dicetak
              </label>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
                {[
                  { id: 'ALL', label: 'Paket Lengkap (3 Dokumen)', icon: Layers },
                  { id: 'KWITANSI', label: '1. Kwitansi Dinas', icon: FileText },
                  { id: 'NOTA_PESANAN', label: '2. Nota Pesanan', icon: ClipboardList },
                  { id: 'BAST', label: '3. BAST Barang', icon: FileCheck2 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDocType(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        docType === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pilih Ukuran Kertas */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Ukuran Kertas
              </label>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
                {['A4', 'F4'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPaperSize(sz)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      paperSize === sz
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sz === 'A4' ? 'A4 (210×297mm)' : 'F4 / Folio (215×330mm)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tombol Edit & Tombol Cetak */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleEditCurrentSpj}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              <Edit3 className="w-4 h-4 text-blue-600" />
              Ubah Data Penyedia / Surat
            </button>
            <button
              type="button"
              onClick={handlePrintNow}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen ({paperSize})
            </button>
          </div>
        </div>

        {printingStatus && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{printingStatus}</span>
          </div>
        )}
      </div>

      {/* AREA KERTAS CETAK (A4 / F4) */}
      <div className="space-y-8 print:space-y-0">
        {/* ================================================================== */}
        {/* DOKUMEN 1: KWITANSI DINAS (BUKTI KAS PENGELUARAN / BKP)            */}
        {/* ================================================================== */}
        {(docType === 'ALL' || docType === 'KWITANSI') && (
          <div
            className={`print-sheet bg-white mx-auto shadow-lg border border-slate-300 print:shadow-none print:border-none font-serif text-black p-8 sm:p-10 ${
              paperSize === 'F4' ? 'max-w-[215mm] min-h-[320mm]' : 'max-w-[210mm] min-h-[285mm]'
            } ${docType === 'ALL' ? 'print-page-break' : ''}`}
          >
            <KopSuratSekolah />

            {/* Header Metadata Kwitansi */}
            <div className="grid grid-cols-12 gap-2 text-xs mb-4 border border-black p-3">
              <div className="col-span-7 space-y-1">
                <div className="flex">
                  <span className="w-32 font-bold">Tahun Anggaran</span>
                  <span>: {sekolah.tahun_anggaran}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold">Sumber Dana</span>
                  <span>: {compiledDoc.sumber_dana}</span>
                </div>
                <div className="flex">
                  <span className="w-32 font-bold">Program / Kegiatan</span>
                  <span className="flex-1">: {compiledDoc.nama_kegiatan}</span>
                </div>
              </div>
              <div className="col-span-5 space-y-1 border-l border-black pl-3">
                <div className="flex">
                  <span className="w-28 font-bold">Nomor BPU / BKP</span>
                  <span className="font-mono font-bold">: {compiledDoc.no_bpu}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold">Kode Rekening</span>
                  <span className="font-mono">: {compiledDoc.kode_rekening}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-bold">No. Nota / Faktur</span>
                  <span className="font-mono">: {compiledDoc.no_nota_toko}</span>
                </div>
              </div>
            </div>

            {/* Judul Kwitansi */}
            <div className="text-center my-4">
              <h2 className="text-lg font-extrabold underline tracking-widest uppercase">
                KWITANSI / BUKTI PEMBAYARAN
              </h2>
            </div>

            {/* Isi Utama Kwitansi */}
            <div className="border-2 border-black p-5 space-y-3.5 text-[13px]">
              <div className="grid grid-cols-12 items-baseline">
                <div className="col-span-3 font-bold">Sudah Terima Dari</div>
                <div className="col-span-9">
                  : <strong>Bendahara Dana {compiledDoc.sumber_dana} {sekolah.nama_sekolah}</strong>
                </div>
              </div>

              <div className="grid grid-cols-12 items-center">
                <div className="col-span-3 font-bold">Uang Sebanyak</div>
                <div className="col-span-9">
                  <div className="border border-black bg-slate-100/80 print:bg-slate-100 px-3.5 py-2 font-bold italic text-sm">
                    # {terbilangRupiah(compiledDoc.total_bruto)} #
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 items-baseline">
                <div className="col-span-3 font-bold">Untuk Pembayaran</div>
                <div className="col-span-9 leading-relaxed">
                  : {compiledDoc.uraian_kwitansi}
                  <div className="text-xs text-slate-700 mt-1">
                    Sesuai Surat Pesanan Nomor: <span className="font-mono">{compiledDoc.no_surat_pesanan}</span> dan
                    BAST Nomor: <span className="font-mono">{compiledDoc.no_bast}</span> tanggal{' '}
                    {formatTanggalIndo(compiledDoc.tanggal_bast)}.
                  </div>
                </div>
              </div>

              {/* Tabel Ringkas Item jika terdapat gabungan > 1 item */}
              {compiledDoc.items.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold mb-1">Rincian Belanja:</div>
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black py-1 px-2 w-8 text-center">No</th>
                        <th className="border border-black py-1 px-2 text-left">Uraian Barang / Jasa</th>
                        <th className="border border-black py-1 px-2 w-20 text-center">Volume</th>
                        <th className="border border-black py-1 px-2 w-28 text-right">Harga Satuan</th>
                        <th className="border border-black py-1 px-2 w-32 text-right">Jumlah (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compiledDoc.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="border border-black py-1 px-2 text-center">{idx + 1}</td>
                          <td className="border border-black py-1 px-2">{it.uraian}</td>
                          <td className="border border-black py-1 px-2 text-center">
                            {it.volume} {it.satuan}
                          </td>
                          <td className="border border-black py-1 px-2 text-right font-mono">
                            {formatRupiah(it.harga_satuan, false)}
                          </td>
                          <td className="border border-black py-1 px-2 text-right font-mono font-semibold">
                            {formatRupiah(it.jumlah || it.nominal, false)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Kotak Nominal & Rincian Potongan Pajak PPN / PPh */}
              <div className="grid grid-cols-12 gap-4 pt-3 items-start">
                <div className="col-span-6">
                  <div className="border-2 border-black px-4 py-2.5 inline-block bg-slate-50">
                    <div className="text-[11px] font-bold uppercase">Jumlah Bruto Kwitansi:</div>
                    <div className="text-lg font-extrabold font-mono">
                      {formatRupiah(compiledDoc.total_bruto)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs space-y-0.5">
                    <div>
                      Penyedia / Toko: <strong>{compiledDoc.penyedia.nama_toko}</strong>
                    </div>
                    {compiledDoc.penyedia.npwp && <div>NPWP: {compiledDoc.penyedia.npwp}</div>}
                  </div>
                </div>

                <div className="col-span-6">
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th colSpan={2} className="border border-black py-1 px-2 text-left">
                          Rincian Pajak & Jumlah Diterima Bersih
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black py-1 px-2">Jumlah Bruto</td>
                        <td className="border border-black py-1 px-2 text-right font-mono font-bold">
                          {formatRupiah(compiledDoc.total_bruto)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black py-1 px-2">PPN (11%)</td>
                        <td className="border border-black py-1 px-2 text-right font-mono">
                          {formatRupiah(compiledDoc.ppn)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black py-1 px-2">
                          PPh (Ps. 21 / Ps. 22 / Ps. 23)
                        </td>
                        <td className="border border-black py-1 px-2 text-right font-mono">
                          {formatRupiah(compiledDoc.pph21 + compiledDoc.pph22 + compiledDoc.pph23)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black py-1 px-2">Pajak Daerah / Restoran</td>
                        <td className="border border-black py-1 px-2 text-right font-mono">
                          {formatRupiah(compiledDoc.pajak_daerah)}
                        </td>
                      </tr>
                      <tr className="bg-slate-100 font-bold">
                        <td className="border border-black py-1 px-2">Jumlah Diterima Bersih (Netto)</td>
                        <td className="border border-black py-1 px-2 text-right font-mono">
                          {formatRupiah(compiledDoc.total_netto)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Kolom Tanda Tangan 3 Pihak: Kepala Sekolah, Bendahara, Penerima */}
            <div className="grid grid-cols-3 gap-4 mt-6 text-xs text-center">
              <div className="border border-black p-3 flex flex-col justify-between min-h-[135px]">
                <div>
                  <div className="font-bold">Mengetahui / Setuju Dibayar,</div>
                  <div>Kepala {sekolah.nama_sekolah}</div>
                </div>
                <div>
                  <div className="font-bold underline">{sekolah.nama_kepsek}</div>
                  <div>NIP. {sekolah.nip_kepsek}</div>
                </div>
              </div>

              <div className="border border-black p-3 flex flex-col justify-between min-h-[135px]">
                <div>
                  <div className="font-bold">
                    Lunas Dibayar Tgl. {formatTanggalIndo(compiledDoc.tanggal_lunas)}
                  </div>
                  <div>Bendahara BOSP {sekolah.nama_sekolah}</div>
                </div>
                <div>
                  <div className="font-bold underline">{sekolah.nama_bendahara}</div>
                  <div>NIP. {sekolah.nip_bendahara}</div>
                </div>
              </div>

              <div className="border border-black p-3 flex flex-col justify-between min-h-[135px]">
                <div>
                  <div>
                    {sekolah.kota_ttd}, {formatTanggalIndo(compiledDoc.tanggal_lunas)}
                  </div>
                  <div className="font-bold">Yang Menerima,</div>
                  <div>{compiledDoc.penyedia.nama_toko}</div>
                </div>
                <div>
                  <div className="font-bold underline">{compiledDoc.penyedia.nama_pemilik}</div>
                  <div>{compiledDoc.penyedia.jabatan_pemilik || 'Pemilik / Rekanan'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* DOKUMEN 2: NOTA PESANAN / SURAT PESANAN BARANG                     */}
        {/* ================================================================== */}
        {(docType === 'ALL' || docType === 'NOTA_PESANAN') && (
          <div
            className={`print-sheet bg-white mx-auto shadow-lg border border-slate-300 print:shadow-none print:border-none font-serif text-black p-8 sm:p-10 ${
              paperSize === 'F4' ? 'max-w-[215mm] min-h-[320mm]' : 'max-w-[210mm] min-h-[285mm]'
            } ${docType === 'ALL' ? 'print-page-break' : ''}`}
          >
            <KopSuratSekolah />

            <div className="text-center my-4">
              <h2 className="text-base font-extrabold underline uppercase tracking-wider">
                SURAT PESANAN / NOTA PESANAN BARANG & JASA
              </h2>
              <div className="text-xs font-bold mt-0.5">Nomor: {compiledDoc.no_surat_pesanan}</div>
            </div>

            {/* Tujuan Surat Pesanan */}
            <div className="grid grid-cols-12 gap-4 text-[13px] mb-4">
              <div className="col-span-7 space-y-1">
                <div>
                  Kepada Yth. Pimpinan <strong>{compiledDoc.penyedia.nama_toko}</strong>
                </div>
                <div>di —</div>
                <div className="pl-4 font-semibold">{compiledDoc.penyedia.alamat_toko || sekolah.kota_ttd}</div>
              </div>
              <div className="col-span-5 text-right space-y-1">
                <div>
                  {sekolah.kota_ttd}, {formatTanggalIndo(compiledDoc.tanggal_pesanan)}
                </div>
                <div className="text-xs">Ref. BPU: {compiledDoc.no_bpu}</div>
                <div className="text-xs">Sumber Dana: {compiledDoc.sumber_dana}</div>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed mb-3">
              Dengan hormat, sehubungan dengan pelaksanaan kegiatan{' '}
              <strong>{compiledDoc.nama_kegiatan}</strong> pada {sekolah.nama_sekolah} Tahun Anggaran{' '}
              {sekolah.tahun_anggaran}, maka bersama ini kami memesan barang/jasa dengan rincian sebagai
              berikut:
            </p>

            {/* Tabel Rincian Pesanan Barang */}
            <table className="w-full border-collapse border border-black text-xs mb-4">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black py-2 px-2 w-10 text-center">No</th>
                  <th className="border border-black py-2 px-3 text-left">Nama Barang / Spesifikasi Uraian</th>
                  <th className="border border-black py-2 px-2 w-16 text-center">Volume</th>
                  <th className="border border-black py-2 px-2 w-20 text-center">Satuan</th>
                  <th className="border border-black py-2 px-3 w-32 text-right">Harga Satuan (Rp)</th>
                  <th className="border border-black py-2 px-3 w-36 text-right">Jumlah Harga (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {compiledDoc.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border border-black py-2 px-2 text-center">{idx + 1}</td>
                    <td className="border border-black py-2 px-3">{it.uraian}</td>
                    <td className="border border-black py-2 px-2 text-center">{it.volume}</td>
                    <td className="border border-black py-2 px-2 text-center">{it.satuan}</td>
                    <td className="border border-black py-2 px-3 text-right font-mono">
                      {formatRupiah(it.harga_satuan, false)}
                    </td>
                    <td className="border border-black py-2 px-3 text-right font-mono font-bold">
                      {formatRupiah(it.jumlah || it.nominal, false)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={5} className="border border-black py-2 px-3 text-right">
                    TOTAL NILAI PESANAN
                  </td>
                  <td className="border border-black py-2 px-3 text-right font-mono text-sm">
                    {formatRupiah(compiledDoc.total_bruto)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-xs italic mb-4 border border-black bg-slate-50 px-3 py-2">
              Terbilang: <strong># {terbilangRupiah(compiledDoc.total_bruto)} #</strong>
            </div>

            <div className="text-xs space-y-1 mb-6 leading-relaxed">
              <div className="font-bold">Ketentuan Pengiriman & Pembayaran:</div>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>
                  Barang/jasa tersebut di atas mohon dikirimkan dan diserahkan ke {sekolah.nama_sekolah}{' '}
                  selambat-lambatnya pada tanggal <strong>{formatTanggalIndo(compiledDoc.tanggal_bast)}</strong>.
                </li>
                <li>
                  Barang yang diserahkan harus dalam keadaan baik, baru, sesuai spesifikasi, dan dilengkapi Berita
                  Acara Serah Terima (BAST).
                </li>
                <li>
                  Pembayaran dilakukan melalui Dana {compiledDoc.sumber_dana} setelah barang diterima dengan
                  lengkap dan benar.
                </li>
              </ol>
            </div>

            {/* Tanda Tangan Nota Pesanan */}
            <div className="grid grid-cols-2 gap-8 mt-8 text-xs text-center">
              <div className="space-y-16">
                <div>
                  <div className="font-bold">Menyetujui / Sanggup Melaksanakan,</div>
                  <div>Penyedia — {compiledDoc.penyedia.nama_toko}</div>
                </div>
                <div>
                  <div className="font-bold underline">{compiledDoc.penyedia.nama_pemilik}</div>
                  <div>{compiledDoc.penyedia.jabatan_pemilik || 'Pemilik / Direktur'}</div>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <div>
                    {sekolah.kota_ttd}, {formatTanggalIndo(compiledDoc.tanggal_pesanan)}
                  </div>
                  <div className="font-bold">Pemesan / Kepala {sekolah.nama_sekolah}</div>
                </div>
                <div>
                  <div className="font-bold underline">{sekolah.nama_kepsek}</div>
                  <div>NIP. {sekolah.nip_kepsek}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* DOKUMEN 3: BERITA ACARA SERAH TERIMA (BAST) BARANG / JASA          */}
        {/* ================================================================== */}
        {(docType === 'ALL' || docType === 'BAST') && (
          <div
            className={`print-sheet bg-white mx-auto shadow-lg border border-slate-300 print:shadow-none print:border-none font-serif text-black p-8 sm:p-10 ${
              paperSize === 'F4' ? 'max-w-[215mm] min-h-[320mm]' : 'max-w-[210mm] min-h-[285mm]'
            }`}
          >
            <KopSuratSekolah />

            <div className="text-center my-4">
              <h2 className="text-base font-extrabold underline uppercase tracking-wider">
                BERITA ACARA SERAH TERIMA BARANG / PEKERJAAN (BAST)
              </h2>
              <div className="text-xs font-bold mt-0.5">Nomor: {compiledDoc.no_bast}</div>
            </div>

            <p className="text-[13px] leading-relaxed mb-3 text-justify">
              {kalimatBast.kalimatLengkap}, bertempat di <strong>{sekolah.nama_sekolah}</strong>, kami yang
              bertanda tangan di bawah ini:
            </p>

            {/* Identitas Pihak Pertama & Pihak Kedua */}
            <div className="space-y-3 text-[13px] mb-4 pl-2">
              <div className="grid grid-cols-12">
                <div className="col-span-1 font-bold">I.</div>
                <div className="col-span-11 space-y-0.5">
                  <div className="grid grid-cols-12">
                    <span className="col-span-3">Nama</span>
                    <span className="col-span-9 font-bold">: {compiledDoc.penyedia.nama_pemilik}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-3">Jabatan</span>
                    <span className="col-span-9">
                      : {compiledDoc.penyedia.jabatan_pemilik || 'Pemilik'} {compiledDoc.penyedia.nama_toko}
                    </span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-3">Alamat Penyedia</span>
                    <span className="col-span-9">: {compiledDoc.penyedia.alamat_toko || sekolah.kota_ttd}</span>
                  </div>
                  <div className="text-xs italic pt-0.5">
                    Selanjutnya dalam Berita Acara ini disebut sebagai <strong>PIHAK PERTAMA (Yang Menyerahkan)</strong>.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12">
                <div className="col-span-1 font-bold">II.</div>
                <div className="col-span-11 space-y-0.5">
                  <div className="grid grid-cols-12">
                    <span className="col-span-3">Nama</span>
                    <span className="col-span-9 font-bold">: {sekolah.nama_kepsek}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-3">NIP</span>
                    <span className="col-span-9">: {sekolah.nip_kepsek}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-3">Jabatan</span>
                    <span className="col-span-9">: Kepala {sekolah.nama_sekolah}</span>
                  </div>
                  <div className="text-xs italic pt-0.5">
                    Selanjutnya dalam Berita Acara ini disebut sebagai <strong>PIHAK KEDUA (Yang Menerima)</strong>.
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed mb-3 text-justify">
              Berdasarkan Surat Pesanan Nomor: <strong className="font-mono">{compiledDoc.no_surat_pesanan}</strong>{' '}
              tanggal {formatTanggalIndo(compiledDoc.tanggal_pesanan)}, <strong>PIHAK PERTAMA</strong> telah
              menyerahkan barang/pekerjaan kepada <strong>PIHAK KEDUA</strong>, dan <strong>PIHAK KEDUA</strong>{' '}
              telah memeriksa serta menerima barang/pekerjaan tersebut dalam keadaan{' '}
              <strong>baik, cukup, lengkap, dan sesuai spesifikasi</strong> dengan rincian sebagai berikut:
            </p>

            {/* Tabel Rincian BAST */}
            <table className="w-full border-collapse border border-black text-xs mb-4">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black py-1.5 px-2 w-10 text-center">No</th>
                  <th className="border border-black py-1.5 px-3 text-left">Nama Barang / Uraian Pekerjaan</th>
                  <th className="border border-black py-1.5 px-2 w-16 text-center">Volume</th>
                  <th className="border border-black py-1.5 px-2 w-20 text-center">Satuan</th>
                  <th className="border border-black py-1.5 px-3 w-28 text-right">Harga Satuan</th>
                  <th className="border border-black py-1.5 px-3 w-32 text-right">Jumlah (Rp)</th>
                  <th className="border border-black py-1.5 px-2 w-24 text-center">Kondisi</th>
                </tr>
              </thead>
              <tbody>
                {compiledDoc.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border border-black py-1.5 px-2 text-center">{idx + 1}</td>
                    <td className="border border-black py-1.5 px-3">{it.uraian}</td>
                    <td className="border border-black py-1.5 px-2 text-center">{it.volume}</td>
                    <td className="border border-black py-1.5 px-2 text-center">{it.satuan}</td>
                    <td className="border border-black py-1.5 px-3 text-right font-mono">
                      {formatRupiah(it.harga_satuan, false)}
                    </td>
                    <td className="border border-black py-1.5 px-3 text-right font-mono font-bold">
                      {formatRupiah(it.jumlah || it.nominal, false)}
                    </td>
                    <td className="border border-black py-1.5 px-2 text-center font-semibold">
                      Baik & Lengkap
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={5} className="border border-black py-1.5 px-3 text-right">
                    JUMLAH TOTAL
                  </td>
                  <td className="border border-black py-1.5 px-3 text-right font-mono">
                    {formatRupiah(compiledDoc.total_bruto)}
                  </td>
                  <td className="border border-black py-1.5 px-2 text-center">100% Sesuai</td>
                </tr>
              </tbody>
            </table>

            <p className="text-[13px] leading-relaxed mb-6 text-justify">
              Demikian Berita Acara Serah Terima Barang/Pekerjaan ini dibuat dengan sebenarnya dalam rangkap
              secukupnya untuk dapat dipergunakan sebagaimana mestinya sebagai kelengkapan SPJ Dana{' '}
              {compiledDoc.sumber_dana} Tahun Anggaran {sekolah.tahun_anggaran}.
            </p>

            {/* Kolom Tanda Tangan BAST */}
            <div className="grid grid-cols-2 gap-8 mt-6 text-xs text-center">
              <div className="space-y-16">
                <div>
                  <div className="font-bold">PIHAK PERTAMA</div>
                  <div>Yang Menyerahkan,</div>
                  <div>{compiledDoc.penyedia.nama_toko}</div>
                </div>
                <div>
                  <div className="font-bold underline">{compiledDoc.penyedia.nama_pemilik}</div>
                  <div>{compiledDoc.penyedia.jabatan_pemilik || 'Pemilik / Direktur'}</div>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <div className="font-bold">PIHAK KEDUA</div>
                  <div>Yang Menerima,</div>
                  <div>Kepala {sekolah.nama_sekolah}</div>
                </div>
                <div>
                  <div className="font-bold underline">{sekolah.nama_kepsek}</div>
                  <div>NIP. {sekolah.nip_kepsek}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
