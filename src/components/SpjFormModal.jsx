import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Printer,
  Store,
  Plus,
  Wand2,
  Calculator,
  Trash2,
  Layers,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { formatRupiah, terbilangRupiah } from '../utils/terbilang';
import { upsertSpjPelengkap, upsertPenyedia } from '../services/neonClient';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function subtractDays(dateStr, days = 2) {
  if (!dateStr) return '2026-01-12';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function SpjFormModal({
  isOpen,
  onClose,
  groupedDraft,
  existingSpj,
  penyediaList,
  onSavedSuccess,
  onSavedAndPrint,
}) {
  const [form, setForm] = useState({
    no_bpu: '',
    id_penyedia: '',
    no_surat_pesanan: '',
    tanggal_pesanan: '',
    no_bast: '',
    tanggal_bast: '',
    no_nota_toko: '',
    tanggal_lunas: '',
    sumber_dana: 'BOSP Reguler',
    kode_rekening: '',
    nama_kegiatan: '',
    uraian_kwitansi: '',
    total_bruto: 0,
    ppn: 0,
    pph21: 0,
    pph22: 0,
    pph23: 0,
    pajak_daerah: 0,
    items_json: [],
    status_cetak: 'Siap Cetak',
  });

  const [showQuickVendor, setShowQuickVendor] = useState(false);
  const [quickVendor, setQuickVendor] = useState({
    nama_toko: '',
    alamat_toko: '',
    npwp: '',
    nama_pemilik: '',
    jabatan_pemilik: 'Pemilik / Direktur',
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !groupedDraft) return;
    setErrorMsg('');

    const items = (
      existingSpj?.items_json && Array.isArray(existingSpj.items_json) && existingSpj.items_json.length > 0
        ? existingSpj.items_json
        : groupedDraft.items || []
    ).map((it, idx) => ({
      no: idx + 1,
      uraian: it.uraian || '',
      volume: Number(it.volume || 1),
      satuan: it.satuan || 'Paket',
      harga_satuan: Number(it.harga_satuan || it.nominal || 0),
      jumlah: Number(it.nominal || it.jumlah || Number(it.volume || 1) * Number(it.harga_satuan || 0)),
      kode_rekening: it.kode_rekening || groupedDraft.kode_rekening || '',
    }));

    const sumBruto = items.reduce((acc, it) => acc + (Number(it.jumlah) || 0), 0);
    const tglTransaksi = groupedDraft.tanggal_transaksi || '2026-01-15';
    const monthIdx = Math.max(0, Math.min(11, (parseInt(tglTransaksi.slice(5, 7), 10) || 1) - 1));
    const roman = ROMAN_MONTHS[monthIdx];
    const bpuDigits = String(groupedDraft.no_bpu || '01').replace(/\D/g, '') || '01';

    setForm({
      no_bpu: groupedDraft.no_bpu || 'BPU-01',
      id_penyedia: existingSpj?.id_penyedia || penyediaList[0]?.id_penyedia || '',
      no_surat_pesanan:
        existingSpj?.no_surat_pesanan || `421.2/${bpuDigits.padStart(3, '0')}/SP-BOSP/SDN7/${roman}/2026`,
      tanggal_pesanan: existingSpj?.tanggal_pesanan
        ? String(existingSpj.tanggal_pesanan).slice(0, 10)
        : subtractDays(tglTransaksi, 3),
      no_bast:
        existingSpj?.no_bast || `421.2/${bpuDigits.padStart(3, '0')}/BAST-BOSP/SDN7/${roman}/2026`,
      tanggal_bast: existingSpj?.tanggal_bast
        ? String(existingSpj.tanggal_bast).slice(0, 10)
        : tglTransaksi,
      no_nota_toko: existingSpj?.no_nota_toko || `INV/${bpuDigits.padStart(3, '0')}/${roman}/2026`,
      tanggal_lunas: existingSpj?.tanggal_lunas
        ? String(existingSpj.tanggal_lunas).slice(0, 10)
        : tglTransaksi,
      sumber_dana: existingSpj?.sumber_dana || groupedDraft.sumber_dana || 'BOSP Reguler',
      kode_rekening: existingSpj?.kode_rekening || groupedDraft.kode_rekening || '5.1.02.01.01.0024',
      nama_kegiatan: existingSpj?.nama_kegiatan || groupedDraft.nama_kegiatan || '',
      uraian_kwitansi:
        existingSpj?.uraian_kwitansi ||
        groupedDraft.uraian_gabungan ||
        items.map((i) => i.uraian).join('; '),
      total_bruto: sumBruto || Number(existingSpj?.total_bruto || groupedDraft.total_bruto || 0),
      ppn: Number(existingSpj?.ppn ?? groupedDraft.ppn ?? 0),
      pph21: Number(existingSpj?.pph21 ?? groupedDraft.pph21 ?? 0),
      pph22: Number(existingSpj?.pph22 ?? groupedDraft.pph22 ?? 0),
      pph23: Number(existingSpj?.pph23 ?? groupedDraft.pph23 ?? 0),
      pajak_daerah: Number(existingSpj?.pajak_daerah ?? groupedDraft.pajak_daerah ?? 0),
      items_json: items,
      status_cetak: existingSpj?.status_cetak || 'Siap Cetak',
    });
  }, [isOpen, groupedDraft, existingSpj, penyediaList]);

  if (!isOpen) return null;

  const recalculateItemsTotal = (updatedItems) => {
    const total = updatedItems.reduce((acc, it) => acc + (Number(it.jumlah) || 0), 0);
    setForm((prev) => ({
      ...prev,
      items_json: updatedItems,
      total_bruto: total,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const next = [...form.items_json];
    const item = { ...next[index], [field]: value };
    if (field === 'volume' || field === 'harga_satuan') {
      const vol = Number(field === 'volume' ? value : item.volume) || 0;
      const hrg = Number(field === 'harga_satuan' ? value : item.harga_satuan) || 0;
      item.jumlah = Math.round(vol * hrg);
    }
    next[index] = item;
    recalculateItemsTotal(next);
  };

  const handleAddItem = () => {
    const next = [
      ...form.items_json,
      {
        no: form.items_json.length + 1,
        uraian: 'Rincian Barang / Jasa Tambahan',
        volume: 1,
        satuan: 'Paket',
        harga_satuan: 0,
        jumlah: 0,
        kode_rekening: form.kode_rekening,
      },
    ];
    recalculateItemsTotal(next);
  };

  const handleRemoveItem = (idx) => {
    if (form.items_json.length <= 1) return;
    const next = form.items_json.filter((_, i) => i !== idx).map((it, i) => ({ ...it, no: i + 1 }));
    recalculateItemsTotal(next);
  };

  const handleAutoCalcTax = (preset) => {
    const bruto = Number(form.total_bruto) || 0;
    const dpp = Math.round((bruto * 100) / 111);
    if (preset === 'ppn_pph22') {
      setForm({
        ...form,
        ppn: Math.round(dpp * 0.11),
        pph22: Math.round(dpp * 0.015),
        pph23: 0,
        pajak_daerah: 0,
      });
    } else if (preset === 'mamin_10') {
      setForm({
        ...form,
        ppn: 0,
        pph22: 0,
        pph23: Math.round(bruto * 0.02),
        pajak_daerah: Math.round(bruto * 0.1),
      });
    } else if (preset === 'jasa_pph23') {
      setForm({
        ...form,
        ppn: 0,
        pph22: 0,
        pph23: Math.round(bruto * 0.02),
        pajak_daerah: 0,
      });
    } else if (preset === 'bebas_pajak') {
      setForm({
        ...form,
        ppn: 0,
        pph21: 0,
        pph22: 0,
        pph23: 0,
        pajak_daerah: 0,
      });
    }
  };

  const handleSaveQuickVendor = async () => {
    if (!quickVendor.nama_toko || !quickVendor.nama_pemilik) return;
    setSaving(true);
    try {
      const created = await upsertPenyedia(quickVendor);
      setShowQuickVendor(false);
      setQuickVendor({
        nama_toko: '',
        alamat_toko: '',
        npwp: '',
        nama_pemilik: '',
        jabatan_pemilik: 'Pemilik / Direktur',
      });
      if (onSavedSuccess) await onSavedSuccess();
      if (created?.id_penyedia) {
        setForm((prev) => ({ ...prev, id_penyedia: created.id_penyedia }));
      }
    } catch (err) {
      setErrorMsg(`Gagal menambah penyedia: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (andPrint = false) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const saved = await upsertSpjPelengkap(form);
      if (onSavedSuccess) await onSavedSuccess();
      if (andPrint && onSavedAndPrint) {
        onSavedAndPrint(saved.no_bpu);
      } else {
        onClose();
      }
    } catch (err) {
      setErrorMsg(`Gagal menyimpan SPJ ke Neon: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const totalPajak =
    (Number(form.ppn) || 0) +
    (Number(form.pph21) || 0) +
    (Number(form.pph22) || 0) +
    (Number(form.pph23) || 0) +
    (Number(form.pajak_daerah) || 0);
  const totalNetto = Math.max(0, (Number(form.total_bruto) || 0) - totalPajak);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-6">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">
                  Pelengkapan & Pengelompokan SPJ — {form.no_bpu}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {form.items_json.length} Item Digabung
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Data langsung tersimpan ke tabel <code className="font-mono">spj_pelengkap</code> di Cloud Neon PostgreSQL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs">
          {/* Baris 1: Pilih Penyedia/Toko & Nomor BPU */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="md:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">Nomor BPU (Referensi ARKAS)</label>
              <input
                type="text"
                value={form.no_bpu}
                onChange={(e) => setForm({ ...form, no_bpu: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-blue-800 bg-white"
              />
            </div>

            <div className="md:col-span-6">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Pilih Toko / Penyedia / Rekanan (Neon) *</label>
                <button
                  type="button"
                  onClick={() => setShowQuickVendor(!showQuickVendor)}
                  className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {showQuickVendor ? 'Tutup Form Toko' : 'Tambah Toko Cepat'}
                </button>
              </div>
              <select
                value={form.id_penyedia}
                onChange={(e) => setForm({ ...form, id_penyedia: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:border-blue-600 outline-none"
              >
                <option value="">-- Pilih Penyedia / Toko --</option>
                {penyediaList.map((p) => (
                  <option key={p.id_penyedia} value={p.id_penyedia}>
                    {p.nama_toko} — ({p.nama_pemilik})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">Sumber Dana BOSP</label>
              <select
                value={form.sumber_dana}
                onChange={(e) => setForm({ ...form, sumber_dana: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
              >
                <option value="BOSP Reguler">BOSP Reguler</option>
                <option value="BOSP Kinerja">BOSP Kinerja</option>
                <option value="SiLPA BOSP">SiLPA BOSP</option>
              </select>
            </div>

            {/* Form Tambah Toko Cepat Inline */}
            {showQuickVendor && (
              <div className="md:col-span-12 bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-3">
                <div className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-blue-600" />
                  Tambah Penyedia / Toko Baru ke Cloud Neon
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nama Toko / CV *"
                    value={quickVendor.nama_toko}
                    onChange={(e) => setQuickVendor({ ...quickVendor, nama_toko: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Nama Pemilik / Penerima *"
                    value={quickVendor.nama_pemilik}
                    onChange={(e) => setQuickVendor({ ...quickVendor, nama_pemilik: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Alamat Toko"
                    value={quickVendor.alamat_toko}
                    onChange={(e) => setQuickVendor({ ...quickVendor, alamat_toko: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveQuickVendor}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Simpan & Pilih Toko
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Baris 2: Nomor Surat Pesanan, Tanggal Pesanan, Nomor BAST, Tanggal BAST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Surat / Nota Pesanan *</label>
              <input
                type="text"
                value={form.no_surat_pesanan}
                onChange={(e) => setForm({ ...form, no_surat_pesanan: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tanggal Surat Pesanan *</label>
              <input
                type="date"
                value={form.tanggal_pesanan}
                onChange={(e) => setForm({ ...form, tanggal_pesanan: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor BAST (Serah Terima) *</label>
              <input
                type="text"
                value={form.no_bast}
                onChange={(e) => setForm({ ...form, no_bast: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tanggal BAST & Lunas *</label>
              <input
                type="date"
                value={form.tanggal_bast}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tanggal_bast: e.target.value,
                    tanggal_lunas: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* Baris 3: Kode Rekening, Kegiatan & Uraian Kwitansi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Kode Rekening Belanja</label>
              <input
                type="text"
                value={form.kode_rekening}
                onChange={(e) => setForm({ ...form, kode_rekening: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Program / Kegiatan ARKAS</label>
              <input
                type="text"
                value={form.nama_kegiatan}
                onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Nota / Faktur Toko</label>
              <input
                type="text"
                value={form.no_nota_toko}
                onChange={(e) => setForm({ ...form, no_nota_toko: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">
                Uraian Pembayaran pada Kwitansi Dinas (Untuk Pembayaran) *
              </label>
              <textarea
                rows={2}
                value={form.uraian_kwitansi}
                onChange={(e) => setForm({ ...form, uraian_kwitansi: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Baris 4: Tabel Rincian Item Gabungan (Nota Pesanan & BAST) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Rincian Item Belanja yang Digabung (Tercetak di Nota Pesanan & BAST)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Baris Barang
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2 px-3 w-10 text-center">No</th>
                    <th className="py-2 px-3">Nama Barang / Uraian Pekerjaan</th>
                    <th className="py-2 px-2 w-20 text-center">Vol</th>
                    <th className="py-2 px-2 w-24 text-center">Satuan</th>
                    <th className="py-2 px-3 w-32 text-right">Harga Satuan</th>
                    <th className="py-2 px-3 w-36 text-right">Jumlah (Rp)</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {form.items_json.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={it.uraian}
                          onChange={(e) => handleItemChange(idx, 'uraian', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-slate-300"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          value={it.volume}
                          onChange={(e) => handleItemChange(idx, 'volume', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-300 text-center"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={it.satuan}
                          onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-300 text-center"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          value={it.harga_satuan}
                          onChange={(e) => handleItemChange(idx, 'harga_satuan', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-300 text-right font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(it.jumlah, false)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {form.items_json.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Baris 5: Kalkulator Pajak (PPN / PPh) & Ringkasan Terbilang */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                Perhitungan Pajak SPJ (PPN & PPh)
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Hitung Cepat:</span>
                <button
                  type="button"
                  onClick={() => handleAutoCalcTax('ppn_pph22')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-blue-50 text-slate-700 font-semibold"
                >
                  Barang (PPN 11% + PPh22 1,5%)
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoCalcTax('mamin_10')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-blue-50 text-slate-700 font-semibold"
                >
                  Konsumsi (Pajak Daerah 10% + PPh23 2%)
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoCalcTax('jasa_pph23')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-blue-50 text-slate-700 font-semibold"
                >
                  Jasa Servis (PPh23 2%)
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoCalcTax('bebas_pajak')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-red-50 text-slate-600"
                >
                  Reset 0
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">PPN (Rp)</label>
                <input
                  type="number"
                  value={form.ppn}
                  onChange={(e) => setForm({ ...form, ppn: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">PPh Pasal 21 (Rp)</label>
                <input
                  type="number"
                  value={form.pph21}
                  onChange={(e) => setForm({ ...form, pph21: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">PPh Pasal 22 (Rp)</label>
                <input
                  type="number"
                  value={form.pph22}
                  onChange={(e) => setForm({ ...form, pph22: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">PPh Pasal 23 (Rp)</label>
                <input
                  type="number"
                  value={form.pph23}
                  onChange={(e) => setForm({ ...form, pph23: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pajak Daerah / Resto (Rp)</label>
                <input
                  type="number"
                  value={form.pajak_daerah}
                  onChange={(e) => setForm({ ...form, pajak_daerah: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500">Terbilang Bruto Kwitansi:</div>
                <div className="text-xs font-bold italic text-blue-900">
                  &ldquo;# {terbilangRupiah(form.total_bruto)} #&rdquo;
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[11px] text-slate-500">Total Bruto</div>
                  <div className="text-sm font-bold text-slate-900">{formatRupiah(form.total_bruto)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Total Potongan Pajak</div>
                  <div className="text-sm font-bold text-amber-700">{formatRupiah(totalPajak)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Diterima Bersih (Netto)</div>
                  <div className="text-sm font-bold text-emerald-700">{formatRupiah(totalNetto)}</div>
                </div>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            Batal
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Data SPJ ke Neon
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Simpan & Langsung Cetak SPJ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
