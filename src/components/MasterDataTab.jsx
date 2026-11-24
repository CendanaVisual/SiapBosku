import React, { useState, useEffect } from 'react';
import {
  School,
  Store,
  Plus,
  Save,
  Trash2,
  Edit3,
  CheckCircle2,
  RefreshCw,
  Building2,
  UserCheck,
  CreditCard,
  MapPin,
} from 'lucide-react';
import {
  saveProfilSekolah,
  upsertPenyedia,
  deletePenyediaById,
} from '../services/neonClient';

const EMPTY_PENYEDIA = {
  id_penyedia: null,
  nama_toko: '',
  alamat_toko: '',
  npwp: '',
  nama_pemilik: '',
  jabatan_pemilik: 'Pemilik / Direktur',
  telepon: '',
  nama_bank: 'BPD Bali',
  nomor_rekening: '',
  kategori_usaha: 'ATK & Perlengkapan Sekolah',
};

export default function MasterDataTab({ profil, penyediaList, onRefreshCloud }) {
  const [formProfil, setFormProfil] = useState({
    nama_sekolah: 'SD NEGERI 7 PEDUNGAN',
    npsn: '50103069',
    alamat: 'Jl. Pulau Saelus No. 45, Pedungan',
    kelurahan_desa: 'Pedungan',
    kecamatan: 'Denpasar Selatan',
    kabupaten_kota: 'Kota Denpasar',
    provinsi: 'Bali',
    kode_pos: '80222',
    telepon: '(0361) 721890',
    email: 'sdn7pedungan@pendidikan.denpasarkota.go.id',
    nama_dinas: 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA',
    pemerintah_daerah: 'PEMERINTAH KOTA DENPASAR',
    nama_kepsek: 'I Wayan Sudarma, S.Pd., M.Pd.',
    nip_kepsek: '19750412 199903 1 006',
    nama_bendahara: 'Ni Luh Putu Sari Dewi, S.Pd.',
    nip_bendahara: '19860819 201101 2 012',
    nama_pemeriksa: 'I Made Arya Wibawa, S.Kom.',
    nip_pemeriksa: '19900215 201903 1 004',
    tahun_anggaran: 2027,
    kota_ttd: 'Denpasar',
  });

  const [savingProfil, setSavingProfil] = useState(false);
  const [profilMsg, setProfilMsg] = useState('');

  const [formPenyedia, setFormPenyedia] = useState(EMPTY_PENYEDIA);
  const [savingPenyedia, setSavingPenyedia] = useState(false);
  const [penyediaMsg, setPenyediaMsg] = useState('');

  useEffect(() => {
    if (profil) {
      setFormProfil((prev) => ({ ...prev, ...profil }));
    }
  }, [profil]);

  const handleSaveProfil = async (e) => {
    e.preventDefault();
    setSavingProfil(true);
    setProfilMsg('');
    try {
      await saveProfilSekolah(formProfil);
      setProfilMsg('Profil sekolah berhasil disimpan ke Cloud Neon PostgreSQL!');
      if (onRefreshCloud) await onRefreshCloud();
    } catch (err) {
      setProfilMsg(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSavingProfil(false);
    }
  };

  const handleSavePenyedia = async (e) => {
    e.preventDefault();
    if (!formPenyedia.nama_toko || !formPenyedia.nama_pemilik) return;
    setSavingPenyedia(true);
    setPenyediaMsg('');
    try {
      await upsertPenyedia(formPenyedia);
      setFormPenyedia(EMPTY_PENYEDIA);
      setPenyediaMsg('Data penyedia/toko berhasil disimpan ke Neon!');
      if (onRefreshCloud) await onRefreshCloud();
    } catch (err) {
      setPenyediaMsg(`Gagal menyimpan penyedia: ${err.message}`);
    } finally {
      setSavingPenyedia(false);
    }
  };

  const handleDeletePenyedia = async (id) => {
    if (!window.confirm('Hapus data penyedia/toko ini dari database Neon?')) return;
    try {
      await deletePenyediaById(id);
      if (onRefreshCloud) await onRefreshCloud();
    } catch (err) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Kolom Kiri: Form Profil Sekolah */}
      <div className="xl:col-span-5 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Profil Sekolah & Pejabat Penandatangan</h3>
            <p className="text-[11px] text-blue-200/80">
              Tabel <code className="font-mono">profil_sekolah</code> di Cloud Neon (Kop Surat & TTD SPJ)
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfil} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Pemerintah Daerah (Baris 1 Kop Surat)</label>
              <input
                type="text"
                value={formProfil.pemerintah_daerah || ''}
                onChange={(e) => setFormProfil({ ...formProfil, pemerintah_daerah: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Nama Dinas Pendidikan (Baris 2 Kop Surat)</label>
              <input
                type="text"
                value={formProfil.nama_dinas || ''}
                onChange={(e) => setFormProfil({ ...formProfil, nama_dinas: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Satuan Pendidikan / Sekolah *</label>
              <input
                type="text"
                required
                value={formProfil.nama_sekolah || ''}
                onChange={(e) => setFormProfil({ ...formProfil, nama_sekolah: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">NPSN *</label>
              <input
                type="text"
                required
                value={formProfil.npsn || ''}
                onChange={(e) => setFormProfil({ ...formProfil, npsn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap Sekolah</label>
              <input
                type="text"
                value={formProfil.alamat || ''}
                onChange={(e) => setFormProfil({ ...formProfil, alamat: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Kecamatan</label>
              <input
                type="text"
                value={formProfil.kecamatan || ''}
                onChange={(e) => setFormProfil({ ...formProfil, kecamatan: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                value={formProfil.kabupaten_kota || ''}
                onChange={(e) => setFormProfil({ ...formProfil, kabupaten_kota: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Kota Tanda Tangan</label>
              <input
                type="text"
                value={formProfil.kota_ttd || ''}
                onChange={(e) => setFormProfil({ ...formProfil, kota_ttd: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tahun Anggaran</label>
              <input
                type="number"
                value={formProfil.tahun_anggaran || 2026}
                onChange={(e) => setFormProfil({ ...formProfil, tahun_anggaran: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none font-bold"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Pejabat Penandatangan Dokumen SPJ
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Kepala Sekolah *</label>
                <input
                  type="text"
                  required
                  value={formProfil.nama_kepsek || ''}
                  onChange={(e) => setFormProfil({ ...formProfil, nama_kepsek: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={formProfil.nip_kepsek || ''}
                  onChange={(e) => setFormProfil({ ...formProfil, nip_kepsek: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Bendahara BOSP *</label>
                <input
                  type="text"
                  required
                  value={formProfil.nama_bendahara || ''}
                  onChange={(e) => setFormProfil({ ...formProfil, nama_bendahara: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">NIP Bendahara BOSP</label>
                <input
                  type="text"
                  value={formProfil.nip_bendahara || ''}
                  onChange={(e) => setFormProfil({ ...formProfil, nip_bendahara: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {profilMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profilMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfil}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition"
          >
            {savingProfil ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Profil Sekolah ke Cloud Neon
          </button>
        </form>
      </div>

      {/* Kolom Kanan: Master Data Penyedia / Toko / CV */}
      <div className="xl:col-span-7 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Store className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {formPenyedia.id_penyedia ? 'Edit Data Penyedia / Toko' : 'Tambah Data Penyedia / Toko Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Tabel <code className="font-mono">data_penyedia</code> di Neon PostgreSQL
                </p>
              </div>
            </div>
            {formPenyedia.id_penyedia && (
              <button
                type="button"
                onClick={() => setFormPenyedia(EMPTY_PENYEDIA)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                + Mode Tambah Baru
              </button>
            )}
          </div>

          <form onSubmit={handleSavePenyedia} className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Nama Toko / CV / PT / Penyedia *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CV. Cendana Mitra Media"
                  value={formPenyedia.nama_toko}
                  onChange={(e) => setFormPenyedia({ ...formPenyedia, nama_toko: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">NPWP Penyedia</label>
                <input
                  type="text"
                  placeholder="00.000.000.0-901.000"
                  value={formPenyedia.npwp}
                  onChange={(e) => setFormPenyedia({ ...formPenyedia, npwp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none font-mono"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap Toko / Penyedia</label>
                <input
                  type="text"
                  placeholder="Jl. Tukad Batanghari No. 88, Denpasar Selatan"
                  value={formPenyedia.alamat_toko}
                  onChange={(e) => setFormPenyedia({ ...formPenyedia, alamat_toko: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pemilik / Penerima *</label>
                <input
                  type="text"
                  required
                  placeholder="I Gede Cendana Putra"
                  value={formPenyedia.nama_pemilik}
                  onChange={(e) => setFormPenyedia({ ...formPenyedia, nama_pemilik: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Jabatan Penandatangan</label>
                <input
                  type="text"
                  placeholder="Direktur / Pemilik Toko"
                  value={formPenyedia.jabatan_pemilik}
                  onChange={(e) => setFormPenyedia({ ...formPenyedia, jabatan_pemilik: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">No. Telepon / HP</label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={formPenyedia.telepon}
                  onChange={(e) => setFormPenyedia({ ...formPenyedia, telepon: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Bank</label>
                <input
                  type="text"
                  placeholder="BPD Bali / BRI / Mandiri"
                  value={formPenyedia.nama_bank}
                  onChange={(e) => setFormPenyedia({ ...formPenyedia, nama_bank: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  placeholder="010.02.02.xxxxx-x"
                  value={formPenyedia.nomor_rekening}
                  onChange={(e) => setFormPenyedia({ ...formPenyedia, nomor_rekening: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori Usaha</label>
                <input
                  type="text"
                  placeholder="ATK & Percetakan"
                  value={formPenyedia.kategori_usaha}
                  onChange={(e) => setFormPenyedia({ ...formPenyedia, kategori_usaha: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            {penyediaMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{penyediaMsg}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPenyedia}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition"
              >
                {savingPenyedia ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {formPenyedia.id_penyedia ? 'Simpan Perubahan Penyedia' : 'Tambahkan ke Database Neon'}
              </button>
            </div>
          </form>
        </div>

        {/* Tabel Daftar Penyedia Tersimpan */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Daftar Rekanan / Toko Tersimpan di Neon ({penyediaList.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-200">
            {penyediaList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada data penyedia. Tambahkan toko/rekanan melalui formulir di atas.
              </div>
            ) : (
              penyediaList.map((p) => (
                <div
                  key={p.id_penyedia}
                  className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{p.nama_toko}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {p.kategori_usaha || 'Rekanan'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{p.alamat_toko || '-'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Penerima: <strong className="text-slate-700">{p.nama_pemilik}</strong> ({p.jabatan_pemilik || 'Pemilik'})
                      </span>
                      {p.npwp && (
                        <span>
                          NPWP: <code className="font-mono text-slate-700">{p.npwp}</code>
                        </span>
                      )}
                      {p.nomor_rekening && (
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {p.nama_bank}: <code className="font-mono text-slate-700">{p.nomor_rekening}</code>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormPenyedia(p)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-xs font-semibold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePenyedia(p.id_penyedia)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
