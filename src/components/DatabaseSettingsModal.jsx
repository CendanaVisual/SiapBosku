import React, { useState, useEffect } from 'react';
import {
  Database,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Server,
  Sparkles,
} from 'lucide-react';
import {
  getActiveNeonConnectionInfo,
  getSavedStorageMode,
  saveNeonConnectionUrl,
  clearSavedNeonConnectionUrl,
  maskConnectionUrl,
  initializeNeonSchema,
} from '../services/neonClient';

const REQUIRED_PIN = 'siapbos123';

const SQL_SCHEMA_PREVIEW = `-- Skrip Inisialisasi Otomatis Tabel Cloud Neon (PostgreSQL)
CREATE TABLE IF NOT EXISTS profil_sekolah (
  id SERIAL PRIMARY KEY,
  nama_sekolah VARCHAR(200) NOT NULL,
  npsn VARCHAR(30) NOT NULL,
  alamat TEXT,
  kabupaten_kota VARCHAR(100),
  nama_kepsek VARCHAR(150) NOT NULL,
  nip_kepsek VARCHAR(50),
  nama_bendahara VARCHAR(150) NOT NULL,
  nip_bendahara VARCHAR(50),
  tahun_anggaran INTEGER NOT NULL DEFAULT 2026,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_penyedia (
  id_penyedia SERIAL PRIMARY KEY,
  nama_toko VARCHAR(200) NOT NULL,
  alamat_toko TEXT,
  npwp VARCHAR(50),
  nama_pemilik VARCHAR(150) NOT NULL,
  jabatan_pemilik VARCHAR(100),
  telepon VARCHAR(50),
  nama_bank VARCHAR(100),
  nomor_rekening VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spj_pelengkap (
  id SERIAL PRIMARY KEY,
  no_bpu VARCHAR(100) UNIQUE NOT NULL,
  id_penyedia INTEGER REFERENCES data_penyedia(id_penyedia) ON DELETE SET NULL,
  no_surat_pesanan VARCHAR(150),
  tanggal_pesanan DATE,
  no_bast VARCHAR(150),
  tanggal_bast DATE,
  items_json JSONB DEFAULT '[]'::jsonb,
  status_cetak VARCHAR(30) DEFAULT 'Siap Cetak',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);`;

export default function DatabaseSettingsModal({ isOpen, onClose, onConnectionUpdated, cloudStatus }) {
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');

  const [connInfo, setConnInfo] = useState({ url: '', source: '' });
  const [inputUrl, setInputUrl] = useState('');
  const [storageMode, setStorageMode] = useState('localStorage');
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Setiap kali modal dibuka, wajib autentikasi PIN pengaman terlebih dahulu
      setIsPinUnlocked(false);
      setPinInput('');
      setPinError('');
      setShowPin(false);

      const info = getActiveNeonConnectionInfo();
      setConnInfo(info);
      setStorageMode(getSavedStorageMode());
      setInputUrl('');
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === REQUIRED_PIN) {
      setIsPinUnlocked(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('PIN Pengaman salah! Akses Pengaturan Database Cloud Neon ditolak.');
    }
  };

  const handleSaveAndInit = async (e) => {
    e.preventDefault();
    const targetUrl = inputUrl.trim() || connInfo.url;
    if (!targetUrl) {
      setFeedback({
        type: 'error',
        message: 'Masukkan Connection String Neon PostgreSQL (postgresql://...) terlebih dahulu.',
      });
      return;
    }

    setTesting(true);
    setFeedback(null);
    try {
      if (inputUrl.trim()) {
        saveNeonConnectionUrl(inputUrl.trim(), storageMode);
      }
      const res = await initializeNeonSchema(targetUrl);
      const updatedInfo = getActiveNeonConnectionInfo();
      setConnInfo(updatedInfo);
      setInputUrl('');
      setFeedback({
        type: 'success',
        message: `Berhasil terhubung & menginisialisasi skema tabel di Neon (${res.latencyMs} ms)! Tabel profil_sekolah (${res.counts.profil_count}), data_penyedia (${res.counts.penyedia_count}), dan spj_pelengkap (${res.counts.spj_count}) siap digunakan.`,
      });
      if (onConnectionUpdated) {
        await onConnectionUpdated();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Gagal terhubung ke Neon: ${err.message || 'Periksa kembali format connection string Anda.'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearStorage = () => {
    clearSavedNeonConnectionUrl();
    const updated = getActiveNeonConnectionInfo();
    setConnInfo(updated);
    setInputUrl('');
    setFeedback({
      type: 'info',
      message: 'Kredensial tersimpan di browser telah dihapus.',
    });
    if (onConnectionUpdated) {
      onConnectionUpdated();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_PREVIEW);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4 overflow-y-auto print:hidden">
      <div className="bg-[#fffdf8] rounded-2xl shadow-2xl border-2 border-amber-300/80 max-w-2xl w-full overflow-hidden my-8">
        {/* Header Mewah */}
        <div className="luxury-header-shimmer border-b border-amber-300/70 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white/90 p-1 shadow-md border border-amber-400/60 flex items-center justify-center shrink-0">
              <img
                src="./logo-siapbosku.png"
                onError={(e) => {
                  e.currentTarget.src = './logo-siapbosku.gif';
                }}
                alt="Logo SiapBosKu"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#16233b]">
                Pengaturan Koneksi Database Cloud (Neon)
              </h2>
              <p className="text-xs text-amber-900/80 font-medium">
                PostgreSQL Serverless • Dilindungi PIN Keamanan Administrator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPinUnlocked && (
              <button
                type="button"
                onClick={() => setIsPinUnlocked(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 transition"
                title="Kunci Kembali"
              >
                <Lock className="w-3.5 h-3.5" />
                Kunci
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-amber-200/40 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* GERBANG PIN PENGAMAN ("siapbos123") */}
        {!isPinUnlocked ? (
          <div className="p-8 text-center space-y-6 bg-gradient-to-b from-[#fffdf9] to-[#faf3e0]">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-200 p-2 shadow-inner border-2 border-amber-400/70 flex items-center justify-center relative">
              <img
                src="./logo-siapbosku.png"
                onError={(e) => {
                  e.currentTarget.src = './logo-siapbosku.gif';
                }}
                alt="Logo SiapBosKu"
                className="w-full h-full object-contain drop-shadow"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#16233b] text-amber-300 border-2 border-amber-300 flex items-center justify-center shadow">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                Area Terbatas Administrator & Bendahara
              </div>
              <h3 className="text-lg font-extrabold text-[#16233b]">
                Masukkan PIN Pengaman Database Neon
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Untuk mencegah pihak yang tidak berwenang mengubah konfigurasi{' '}
                <code className="font-mono bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-950">
                  NEON_DATABASE_URL
                </code>
                , silakan masukkan PIN pengaman terlebih dahulu.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="max-w-sm mx-auto space-y-4">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-700 absolute left-3.5 top-3.5" />
                <input
                  type={showPin ? 'text' : 'password'}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  placeholder="Masukkan PIN Pengaman..."
                  className="w-full pl-10 pr-10 py-3 text-sm font-mono font-bold tracking-widest text-center rounded-xl border-2 border-amber-300 bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-500/15 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#16233b] via-[#1f3154] to-[#16233b] hover:from-[#1f3154] hover:to-[#29406b] text-amber-200 border border-amber-400/50 text-xs font-bold shadow-md transition"
                >
                  <Unlock className="w-4 h-4 text-amber-400" />
                  Buka Pengaturan Database
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ISI PENGATURAN KONEKSI DATABASE NEON (SETELAH PIN TERBUKA) */
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Status Koneksi Aktif */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-amber-700" />
                  Status Koneksi Saat Ini
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    connInfo.url
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connInfo.url ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {connInfo.url ? `Terhubung (${connInfo.source})` : 'Belum Dikonfigurasi'}
                </span>
              </div>
              <div className="font-mono text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 text-slate-700 break-all">
                {maskConnectionUrl(connInfo.url)}
              </div>
              {cloudStatus?.counts && (
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-white border border-amber-200/80 rounded-lg p-2">
                    <div className="text-xs text-slate-500">Profil Sekolah</div>
                    <div className="text-sm font-bold text-slate-800">{cloudStatus.counts.profil_count ?? 1} Data</div>
                  </div>
                  <div className="bg-white border border-amber-200/80 rounded-lg p-2">
                    <div className="text-xs text-slate-500">Master Penyedia</div>
                    <div className="text-sm font-bold text-amber-800">{cloudStatus.counts.penyedia_count ?? 0} Toko/CV</div>
                  </div>
                  <div className="bg-white border border-amber-200/80 rounded-lg p-2">
                    <div className="text-xs text-slate-500">SPJ Tersinkron</div>
                    <div className="text-sm font-bold text-emerald-700">{cloudStatus.counts.spj_count ?? 0} BPU</div>
                  </div>
                </div>
              )}
            </div>

            {/* Aturan Keamanan Kredensial */}
            <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 space-y-1 leading-relaxed">
                <div className="font-bold">Keamanan Kredensial Terjamin (Zero Hardcoded Secret + PIN Guard)</div>
                <p>
                  Kredensial <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">NEON_DATABASE_URL</code>{' '}
                  <strong>tidak pernah</strong> disimpan di kode sumber GitHub, melainkan disimpan terenkripsi lokal di browser Anda
                  atau dibaca dari <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">import.meta.env.VITE_NEON_DATABASE_URL</code>.
                </p>
              </div>
            </div>

            {/* Form Input Connection String */}
            <form onSubmit={handleSaveAndInit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Masukkan / Perbarui Neon Connection String (PostgreSQL URL)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="postgresql://neondb_owner:xxxx@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-mono rounded-xl border border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Biarkan kosong jika hanya ingin menguji ulang & menginisialisasi tabel menggunakan koneksi aktif saat ini.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                    storageMode === 'localStorage'
                      ? 'border-amber-600 bg-amber-50/50'
                      : 'border-slate-200 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="storageMode"
                    value="localStorage"
                    checked={storageMode === 'localStorage'}
                    onChange={() => setStorageMode('localStorage')}
                    className="mt-0.5"
                  />
                  <div className="text-xs">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      Simpan di LocalStorage (Terenkripsi)
                    </div>
                    <div className="text-slate-500 mt-0.5">Tetap tersimpan di perangkat ini saat tab ditutup.</div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                    storageMode === 'sessionStorage'
                      ? 'border-amber-600 bg-amber-50/50'
                      : 'border-slate-200 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="storageMode"
                    value="sessionStorage"
                    checked={storageMode === 'sessionStorage'}
                    onChange={() => setStorageMode('sessionStorage')}
                    className="mt-0.5"
                  />
                  <div className="text-xs">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Simpan di SessionStorage (Sementara)
                    </div>
                    <div className="text-slate-500 mt-0.5">Otomatis terhapus saat browser/tab ditutup.</div>
                  </div>
                </label>
              </div>

              {feedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : feedback.type === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-relaxed">{feedback.message}</div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClearStorage}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Kredensial Browser
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSql(!showSql)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition bg-white"
                  >
                    {showSql ? 'Sembunyikan Skrip SQL' : 'Lihat Skrip DDL SQL'}
                  </button>
                  <button
                    type="submit"
                    disabled={testing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#16233b] to-[#24395e] hover:from-[#1e3050] hover:to-[#2d4775] disabled:opacity-60 text-amber-200 border border-amber-400/50 text-xs font-bold shadow-sm transition"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Menghubungkan & Inisialisasi Tabel...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Simpan & Inisialisasi Tabel Neon
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Pratinjau Skrip SQL DDL */}
            {showSql && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 text-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700 text-xs">
                  <span className="font-mono text-slate-300">sql/neon_schema.sql (Auto-Executed)</span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 text-amber-300 hover:text-white font-semibold"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Tersalin!' : 'Salin SQL'}
                  </button>
                </div>
                <pre className="p-4 text-[11px] font-mono overflow-x-auto text-emerald-300 leading-relaxed">
                  {SQL_SCHEMA_PREVIEW}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
