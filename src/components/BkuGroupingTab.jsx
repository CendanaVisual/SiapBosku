import React, { useState, useMemo } from 'react';
import {
  Filter,
  Search,
  Layers,
  CheckSquare,
  Square,
  Printer,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Wallet,
  Store,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  formatRupiah,
  formatTanggalIndo,
  getMonthNumber,
  NAMA_BULAN,
} from '../utils/terbilang';

export default function BkuGroupingTab({
  bkuList,
  spjMap,
  penyediaList,
  onOpenSpjModal,
  onDirectPrintGroup,
}) {
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedSumberDana, setSelectedSumberDana] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedIds, setCheckedIds] = useState([]);

  // Daftar sumber dana unik dari transaksi ARKAS
  const sumberDanaOptions = useMemo(() => {
    const set = new Set(bkuList.map((item) => item.sumber_dana || 'BOSP Reguler'));
    return Array.from(set);
  }, [bkuList]);

  // Filter daftar transaksi BKU
  const filteredBku = useMemo(() => {
    return bkuList.filter((item) => {
      if (selectedMonth !== 'ALL') {
        const m = getMonthNumber(item.tanggal_transaksi);
        if (m !== Number(selectedMonth)) return false;
      }
      if (selectedSumberDana !== 'ALL' && item.sumber_dana !== selectedSumberDana) {
        return false;
      }
      const synced = spjMap[item.no_bpu];
      if (selectedStatus === 'SYNCED' && !synced) return false;
      if (selectedStatus === 'UNSYNCED' && synced) return false;
      if (selectedStatus === 'PRINTED' && synced?.status_cetak !== 'Sudah Dicetak') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchBpu = item.no_bpu.toLowerCase().includes(q);
        const matchUraian = item.uraian.toLowerCase().includes(q);
        const matchRek = item.kode_rekening.toLowerCase().includes(q);
        const matchKeg = (item.nama_kegiatan || '').toLowerCase().includes(q);
        const matchToko = (synced?.nama_toko || '').toLowerCase().includes(q);
        if (!matchBpu && !matchUraian && !matchRek && !matchKeg && !matchToko) return false;
      }
      return true;
    });
  }, [bkuList, spjMap, selectedMonth, selectedSumberDana, selectedStatus, searchQuery]);

  // Kelompokkan berdasarkan Nomor BPU untuk memudahkan pengelompokan (Grouping)
  const bpuCountMap = useMemo(() => {
    const map = {};
    for (const it of bkuList) {
      map[it.no_bpu] = (map[it.no_bpu] || 0) + 1;
    }
    return map;
  }, [bkuList]);

  const checkedItems = useMemo(
    () => bkuList.filter((it) => checkedIds.includes(it.id_item)),
    [bkuList, checkedIds]
  );

  const toggleCheckItem = (idItem) => {
    setCheckedIds((prev) =>
      prev.includes(idItem) ? prev.filter((id) => id !== idItem) : [...prev, idItem]
    );
  };

  const selectSameBpu = (noBpu) => {
    const sameBpuIds = bkuList.filter((it) => it.no_bpu === noBpu).map((it) => it.id_item);
    setCheckedIds(sameBpuIds);
  };

  const toggleSelectAllFiltered = () => {
    if (checkedIds.length === filteredBku.length && filteredBku.length > 0) {
      setCheckedIds([]);
    } else {
      setCheckedIds(filteredBku.map((it) => it.id_item));
    }
  };

  // Buat objek draft gabungan dari item yang dicentang atau dari satu BPU
  const buildGroupedDraft = (itemsToGroup) => {
    if (!itemsToGroup || itemsToGroup.length === 0) return null;
    const first = itemsToGroup[0];
    const uniqueBpus = Array.from(new Set(itemsToGroup.map((i) => i.no_bpu)));
    const groupBpuName = uniqueBpus.length === 1 ? uniqueBpus[0] : `${uniqueBpus[0]}+${uniqueBpus.length - 1}`;

    const totalBruto = itemsToGroup.reduce((s, i) => s + (Number(i.nominal) || 0), 0);
    const ppn = itemsToGroup.reduce((s, i) => s + (Number(i.ppn) || 0), 0);
    const pph21 = itemsToGroup.reduce((s, i) => s + (Number(i.pph21) || 0), 0);
    const pph22 = itemsToGroup.reduce((s, i) => s + (Number(i.pph22) || 0), 0);
    const pph23 = itemsToGroup.reduce((s, i) => s + (Number(i.pph23) || 0), 0);
    const pajakDaerah = itemsToGroup.reduce((s, i) => s + (Number(i.pajak_daerah) || 0), 0);

    return {
      no_bpu: groupBpuName,
      tanggal_transaksi: first.tanggal_transaksi,
      sumber_dana: first.sumber_dana || 'BOSP Reguler',
      kode_rekening: first.kode_rekening,
      nama_kegiatan: first.nama_kegiatan,
      uraian_gabungan:
        itemsToGroup.length === 1
          ? first.uraian
          : `Belanja ${first.nama_rekening || 'Barang & Jasa'} (${itemsToGroup.map((i) => i.uraian).join('; ')})`,
      total_bruto: totalBruto,
      ppn,
      pph21,
      pph22,
      pph23,
      pajak_daerah: pajakDaerah,
      items: itemsToGroup.map((it, idx) => ({
        no: idx + 1,
        uraian: it.uraian,
        volume: it.volume,
        satuan: it.satuan,
        harga_satuan: it.harga_satuan,
        nominal: it.nominal,
        jumlah: it.nominal,
        kode_rekening: it.kode_rekening,
      })),
    };
  };

  const handleGroupCheckedAndEdit = () => {
    const draft = buildGroupedDraft(checkedItems);
    if (draft) {
      onOpenSpjModal(draft);
    }
  };

  const handleGroupCheckedAndPrint = () => {
    const draft = buildGroupedDraft(checkedItems);
    if (draft) {
      onDirectPrintGroup(draft);
    }
  };

  const handleOpenSingleBpu = (noBpu, andPrint = false) => {
    const itemsInBpu = bkuList.filter((it) => it.no_bpu === noBpu);
    const draft = buildGroupedDraft(itemsInBpu);
    if (!draft) return;
    if (andPrint) {
      onDirectPrintGroup(draft);
    } else {
      onOpenSpjModal(draft);
    }
  };

  const totalFilteredNominal = filteredBku.reduce((acc, it) => acc + (Number(it.nominal) || 0), 0);
  const uniqueBpuFiltered = new Set(filteredBku.map((it) => it.no_bpu)).size;
  const syncedBpuCount = Array.from(new Set(bkuList.map((it) => it.no_bpu))).filter(
    (bpu) => Boolean(spjMap[bpu])
  ).length;

  return (
    <div className="space-y-5 pb-20">
      {/* Ringkasan Statistik BKU & Sinkronisasi Neon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Total Item Belanja (Terfilter)</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {filteredBku.length} Baris <span className="text-xs font-semibold text-blue-600">({uniqueBpuFiltered} BPU)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Diekstrak dari tabel kas_umum ARKAS 4</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Total Nilai Pengeluaran</div>
          <div className="text-xl font-extrabold text-blue-700 mt-1">{formatRupiah(totalFilteredNominal)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Akumulasi nilai bruto transaksi</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Tersinkronisasi Database Neon</div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">
            {syncedBpuCount} / {new Set(bkuList.map((i) => i.no_bpu)).size} Nomor BPU
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Otomatis mencocokkan no_bpu dengan Neon</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            Mode Gabung Transaksi (Grouping)
          </div>
          <div className="text-xs text-blue-800 mt-1 leading-relaxed">
            Centang beberapa item belanja dalam BPU/tanggal yang sama untuk digabungkan menjadi{' '}
            <strong>1 Kwitansi, Nota Pesanan, & BAST</strong>.
          </div>
        </div>
      </div>

      {/* Baris Filter Bulan, Sumber Dana, Status & Pencarian */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[230px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nomor BPU, Uraian Belanja, Kode Rekening, atau Nama Toko..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
            />
          </div>

          {/* Filter Bulan */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-blue-600 outline-none"
            >
              <option value="ALL">Semua Bulan (TA 2026)</option>
              {NAMA_BULAN.map((nama, idx) => (
                <option key={nama} value={idx + 1}>
                  Bulan {nama}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Sumber Dana */}
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSumberDana}
              onChange={(e) => setSelectedSumberDana(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-blue-600 outline-none"
            >
              <option value="ALL">Semua Sumber Dana</option>
              {sumberDanaOptions.map((sd) => (
                <option key={sd} value={sd}>
                  {sd}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Sinkronisasi Neon */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-blue-600 outline-none"
            >
              <option value="ALL">Semua Status SPJ</option>
              <option value="SYNCED">Sudah Tersinkron Neon</option>
              <option value="UNSYNCED">Belum Dilengkapi</option>
              <option value="PRINTED">Sudah Dicetak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Transaksi Pengeluaran BKU ARKAS */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className="inline-flex items-center justify-center text-slate-300 hover:text-white"
                    title="Pilih Semua"
                  >
                    {checkedIds.length === filteredBku.length && filteredBku.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">No. BPU & Tanggal</th>
                <th className="py-3 px-3">Uraian Belanja & Kode Rekening</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Vol / Satuan</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Jumlah Bruto</th>
                <th className="py-3 px-3 whitespace-nowrap">Data Pelengkap Cloud Neon</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBku.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    Tidak ada transaksi BKU yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredBku.map((item) => {
                  const isChecked = checkedIds.includes(item.id_item);
                  const syncedSpj = spjMap[item.no_bpu];
                  const multiCount = bpuCountMap[item.no_bpu] || 1;
                  const totalPajakItem =
                    (Number(item.ppn) || 0) +
                    (Number(item.pph21) || 0) +
                    (Number(item.pph22) || 0) +
                    (Number(item.pph23) || 0) +
                    (Number(item.pajak_daerah) || 0);

                  return (
                    <tr
                      key={item.id_item}
                      className={`transition ${
                        isChecked ? 'bg-blue-50/80 hover:bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox Grouping */}
                      <td className="py-3.5 px-3 text-center align-top">
                        <button
                          type="button"
                          onClick={() => toggleCheckItem(item.id_item)}
                          className="text-slate-400 hover:text-blue-600 mt-0.5"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Nomor BPU & Tanggal */}
                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            {item.no_bpu}
                          </span>
                          {multiCount > 1 && (
                            <button
                              type="button"
                              onClick={() => selectSameBpu(item.no_bpu)}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition"
                              title="Klik untuk mencentang seluruh item dalam BPU ini sekaligus"
                            >
                              Gabung {multiCount} Item
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {formatTanggalIndo(item.tanggal_transaksi)}
                        </div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.sumber_dana?.includes('Kinerja')
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.sumber_dana}
                        </span>
                      </td>

                      {/* Uraian Belanja & Kode Rekening */}
                      <td className="py-3.5 px-3 align-top max-w-md">
                        <div className="font-bold text-slate-900 leading-snug">{item.uraian}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                          <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {item.kode_rekening}
                          </code>
                          <span>•</span>
                          <span className="truncate">{item.nama_kegiatan}</span>
                        </div>
                      </td>

                      {/* Volume & Satuan */}
                      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {item.volume} {item.satuan}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          @ {formatRupiah(item.harga_satuan)}
                        </div>
                      </td>

                      {/* Jumlah Bruto & Pajak */}
                      <td className="py-3.5 px-3 align-top text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-mono text-sm">
                          {formatRupiah(item.nominal)}
                        </div>
                        {totalPajakItem > 0 && (
                          <div className="text-[11px] text-amber-700 font-mono mt-0.5">
                            Pajak: {formatRupiah(totalPajakItem)}
                          </div>
                        )}
                      </td>

                      {/* Data Pelengkap dari Cloud Neon */}
                      <td className="py-3.5 px-3 align-top">
                        {syncedSpj ? (
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{syncedSpj.nama_toko || 'Penyedia Terpilih'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              SP: {syncedSpj.no_surat_pesanan || '-'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              BAST: {syncedSpj.no_bast || '-'} ({formatTanggalIndo(syncedSpj.tanggal_bast)})
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            Belum ada data toko / nomor surat di Neon
                          </div>
                        )}
                      </td>

                      {/* Status & Tombol Aksi */}
                      <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-2">
                          {syncedSpj?.status_cetak === 'Sudah Dicetak' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Sudah Dicetak
                            </span>
                          ) : syncedSpj ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Tersinkron Neon
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3" />
                              Belum Lengkap
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenSingleBpu(item.no_bpu, false)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition"
                              title="Isi / Edit Penyedia, Nomor Surat & Gabung Item BPU"
                            >
                              <Edit3 className="w-3 h-3" />
                              {syncedSpj ? 'Edit SPJ' : 'Lengkapi SPJ'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenSingleBpu(item.no_bpu, true)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition"
                              title="Pratinjau & Cetak Kwitansi, Nota Pesanan, dan BAST"
                            >
                              <Printer className="w-3 h-3 text-emerald-600" />
                              Cetak
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bar Gabung Transaksi (Muncul saat pengguna mencentang >= 1 item) */}
      {checkedItems.length > 0 && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl rounded-2xl bg-slate-900 text-white shadow-2xl border border-amber-400/60 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2">
                <span>{checkedItems.length} Item Belanja Dipilih untuk Digabungkan</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                  {Array.from(new Set(checkedItems.map((i) => i.no_bpu))).join(', ')}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Total Gabungan:{' '}
                <strong className="text-emerald-400 font-mono">
                  {formatRupiah(checkedItems.reduce((s, i) => s + (Number(i.nominal) || 0), 0))}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCheckedIds([])}
              className="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Reset Pilihan
            </button>
            <button
              type="button"
              onClick={handleGroupCheckedAndEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gabung & Lengkapi SPJ (Simpan ke Neon)
            </button>
            <button
              type="button"
              onClick={handleGroupCheckedAndPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Langsung Cetak Gabungan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
