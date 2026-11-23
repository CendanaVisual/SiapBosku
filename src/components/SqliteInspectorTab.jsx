import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Table2,
  Database,
  Play,
  Download,
  CheckCircle2,
  Sparkles,
  Search,
  Terminal,
  ArrowRight,
  School,
  Info,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  inspectTableRows,
  runCustomSqliteQuery,
  extractSchoolProfileFromArkas,
} from '../services/arkasSqliteService';

const REQUIRED_PIN = 'siapbos123';

export default function SqliteInspectorTab({
  sqliteDb,
  sqliteFileInfo,
  tables,
  bkuList,
  onLoadFileBuffer,
  onLoadDemoDatabase,
  onImportSchoolProfile,
  onGoToBkuTab,
}) {
  // State Pengaman PIN ("siapbos123") untuk Modul 1: Pembaca SQLite & Table Inspector
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');

  const [selectedTable, setSelectedTable] = useState(tables[0]?.name || '');
  const [rowLimit, setRowLimit] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const [customSql, setCustomSql] = useState(
    'SELECT no_bukti, tanggal_transaksi, kode_rekening, uraian, saldo, sumber_dana FROM kas_umum LIMIT 10;'
  );
  const [customResult, setCustomResult] = useState(null);
  const [sqlError, setSqlError] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const fileInputRef = useRef(null);

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === REQUIRED_PIN) {
      setIsUnlocked(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('PIN Pengaman salah! Akses ke Modul Pembaca SQLite & Table Inspector ditolak.');
    }
  };

  // Tampilkan Gerbang Keamanan PIN apabila belum dibuka
  if (!isUnlocked) {
    return (
      <div className="max-w-xl mx-auto my-6 rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-[#fffdf8] via-[#fcf6e6] to-[#f8eed2] shadow-xl overflow-hidden">
        <div className="luxury-header-shimmer border-b border-amber-300/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-800" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#16233b]">
              Proteksi Keamanan Modul 1 — SQLite & Table Inspector
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#16233b] text-amber-300 border border-amber-400/50">
            Terkunci PIN
          </span>
        </div>

        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-28 h-28 rounded-full bg-white p-2 shadow-lg border-2 border-amber-400/80 flex items-center justify-center relative">
            <img
              src="./logo-siapbosku.gif"
              onError={(e) => {
                e.currentTarget.src = './logo-siapbosku.png';
              }}
              alt="Logo SiapBosKu"
              className="w-full h-full object-contain drop-shadow"
            />
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#16233b] text-amber-300 border-2 border-amber-300 flex items-center justify-center shadow-md">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-extrabold text-[#16233b]">
              Pembaca File SQLite ARKAS & Table Inspector
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menu ini digunakan untuk memuat file database lokal ARKAS 4 (<code className="font-mono">.db</code> /{' '}
              <code className="font-mono">.sqlite</code>) dan menginspeksi struktur tabel mentah. Masukkan{' '}
              <strong>PIN Pengaman</strong> untuk membuka akses.
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

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#16233b] via-[#1f3154] to-[#16233b] hover:from-[#1f3154] hover:to-[#29406b] text-amber-200 border border-amber-400/60 text-xs font-bold shadow-md transition"
              >
                <Unlock className="w-4 h-4 text-amber-400" />
                Buka Modul SQLite Inspector
              </button>
              <button
                type="button"
                onClick={onGoToBkuTab}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-400/80 bg-white/80 hover:bg-amber-50 text-[#16233b] text-xs font-bold transition"
              >
                Lanjut ke Pengelompokan SPJ
                <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const activeTableName =
    selectedTable && tables.some((t) => t.name === selectedTable)
      ? selectedTable
      : tables[0]?.name || '';

  const activeTableMeta = tables.find((t) => t.name === activeTableName) || null;
  const previewData =
    sqliteDb && activeTableName
      ? inspectTableRows(sqliteDb, activeTableName, rowLimit, 0)
      : { columns: [], rows: [], total: 0 };

  const detectedProfile = sqliteDb ? extractSchoolProfileFromArkas(sqliteDb) : null;

  const handleFileChange = async (file) => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    await onLoadFileBuffer(buffer, file.name, file.size);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await handleFileChange(file);
    }
  };

  const handleDownloadDemoSqlite = () => {
    if (!sqliteDb) return;
    const binaryArray = sqliteDb.export();
    const blob = new Blob([binaryArray], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arkas_4_simulasi_sdn7.db';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteCustomSql = (e) => {
    e.preventDefault();
    if (!sqliteDb || !customSql.trim()) return;
    setSqlError('');
    try {
      const res = runCustomSqliteQuery(sqliteDb, customSql);
      setCustomResult(res);
    } catch (err) {
      setSqlError(err.message || 'Gagal menjalankan kueri SQL.');
      setCustomResult(null);
    }
  };

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(tableFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Baris Status Modul Terbuka & Tombol Kunci Kembali */}
      <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-[#fffdf7] via-[#fbf3dc] to-[#fffdf7] px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Unlock className="w-3.5 h-3.5 text-emerald-700" />
            Akses PIN Terverifikasi
          </span>
          <span className="text-slate-700 font-medium">
            Modul Pembaca SQLite ARKAS 4 & Table Inspector siap digunakan.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsUnlocked(false)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#16233b] hover:bg-[#223559] text-amber-200 border border-amber-400/50 text-xs font-bold transition shadow-sm"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          Kunci Kembali Modul Ini
        </button>
      </div>

      {/* Bagian Atas: Drag & Drop SQLite File + Tombol Simulasi ARKAS 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-2 rounded-2xl border-2 border-dashed p-6 transition cursor-pointer flex flex-col sm:flex-row items-center gap-5 ${
            isDragging
              ? 'border-amber-600 bg-amber-50/70'
              : 'border-amber-300 hover:border-amber-500 bg-white/95'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".db,.sqlite,.sqlite3,.arkas,*/*"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              WebAssembly sql.js (100% Client-Side di Memori Browser)
            </div>
            <h3 className="text-base font-bold text-[#16233b]">
              Tarik & Lepas (Drag & Drop) File Database SQLite ARKAS 4 di Sini
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mendukung file database lokal ARKAS (<code className="font-mono bg-amber-50 px-1 rounded">.db</code>,{' '}
              <code className="font-mono bg-amber-50 px-1 rounded">.sqlite</code>,{' '}
              <code className="font-mono bg-amber-50 px-1 rounded">arkas.db</code>). File diproses langsung di RAM browser
              tanpa pernah diunggah ke server mana pun.
            </p>
          </div>
        </div>

        {/* Panel Status File & Tombol Demo */}
        <div className="rounded-2xl border border-amber-200/90 bg-white/95 p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Database SQLite Aktif
              </span>
              {sqliteDb && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Dimuat
                </span>
              )}
            </div>
            <div className="mt-2 font-bold text-sm text-[#16233b] truncate">
              {sqliteFileInfo?.name || 'Belum ada file dimuat'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {tables.length} Tabel ditemukan • {bkuList.length} Item Pengeluaran BKU
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onLoadDemoDatabase}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#16233b] via-[#223559] to-[#16233b] hover:from-[#1f3154] hover:to-[#2b436e] text-amber-200 border border-amber-400/50 text-xs font-bold shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Muat Database Simulasi ARKAS 4
            </button>
            {sqliteDb && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDemoSqlite}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 hover:bg-amber-50 text-slate-700 text-xs font-semibold transition"
                  title="Unduh file .db fisik untuk diuji Drag & Drop"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                  Unduh File .db
                </button>
                <button
                  type="button"
                  onClick={onGoToBkuTab}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                >
                  Kelola SPJ ({bkuList.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner Deteksi Profil Sekolah di SQLite */}
      {detectedProfile && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50/90 via-yellow-50/70 to-amber-50/90 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#16233b] text-amber-300 border border-amber-400/50">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Profil Sekolah Terdeteksi di Database SQLite ARKAS
              </div>
              <div className="text-sm font-bold text-[#16233b]">
                {detectedProfile.nama_sekolah} (NPSN: {detectedProfile.npsn}) — TA {detectedProfile.tahun_anggaran}
              </div>
              <div className="text-xs text-slate-600">
                Kepsek: {detectedProfile.nama_kepsek} • Bendahara: {detectedProfile.nama_bendahara}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onImportSchoolProfile(detectedProfile)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16233b] hover:bg-[#23375c] text-amber-200 border border-amber-400/50 text-xs font-bold shadow-sm transition"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            Sinkronkan Profil Sekolah ke Cloud Neon
          </button>
        </div>
      )}

      {/* Bagian Utama: Daftar Seluruh Tabel & Table Inspector (10 Baris Pertama) */}
      {sqliteDb && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Daftar Tabel */}
          <div className="lg:col-span-3 rounded-2xl border border-amber-200/80 bg-white/95 overflow-hidden flex flex-col shadow-sm">
            <div className="p-4 border-b border-amber-200/70 bg-amber-50/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#16233b] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-700" />
                  Daftar Tabel ({tables.length})
                </h3>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  placeholder="Cari nama tabel..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-amber-300/80 focus:border-amber-600 outline-none bg-white"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
              {filteredTables.map((t) => {
                const isSelected = t.name === activeTableName;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setSelectedTable(t.name)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-amber-50/90 text-[#16233b] font-bold border-l-4 border-amber-600'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-mono truncate">{t.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {t.columns.length} kolom
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isSelected ? 'bg-[#16233b] text-amber-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.rowCount} baris
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel Table Inspector */}
          <div className="lg:col-span-9 space-y-6">
            <div className="rounded-2xl border border-amber-200/80 bg-white/95 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-amber-200/70 bg-amber-50/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Table2 className="w-5 h-5 text-amber-700" />
                  <div>
                    <h3 className="text-sm font-bold text-[#16233b]">
                      Table Inspector:{' '}
                      <span className="font-mono text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                        {activeTableName}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Menampilkan {Math.min(rowLimit, previewData.rows.length)} dari total {previewData.total} baris untuk verifikasi struktur kolom ARKAS 4
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Tampilkan:</span>
                  {[10, 25, 50].map((lim) => (
                    <button
                      key={lim}
                      type="button"
                      onClick={() => setRowLimit(lim)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        rowLimit === lim
                          ? 'bg-[#16233b] text-amber-300'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {lim} Baris
                    </button>
                  ))}
                </div>
              </div>

              {/* Skema Kolom Badge */}
              {activeTableMeta && (
                <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-amber-600" />
                    Struktur Kolom Tabel ({activeTableMeta.columns.length} Kolom)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTableMeta.columns.map((c) => (
                      <span
                        key={c.name}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-800"
                      >
                        {c.pk && (
                          <span className="text-[10px] font-bold px-1 rounded bg-amber-100 text-amber-800">
                            PK
                          </span>
                        )}
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-[10px] text-slate-400">({c.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabel Data 10 Baris Pertama */}
              <div className="overflow-x-auto">
                {previewData.columns.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Tidak ada kolom untuk ditampilkan.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono">
                        <th className="py-2.5 px-3 border-r border-slate-200 w-10 text-center">#</th>
                        {previewData.columns.map((col) => (
                          <th key={col} className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {previewData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-amber-50/40">
                          <td className="py-2 px-3 border-r border-slate-100 text-center font-mono text-slate-400">
                            {rIdx + 1}
                          </td>
                          {previewData.columns.map((col) => (
                            <td
                              key={col}
                              className="py-2 px-3 border-r border-slate-100 font-mono text-slate-700 max-w-xs truncate"
                              title={String(row[col] ?? '')}
                            >
                              {row[col] === null || row[col] === undefined ? (
                                <span className="text-slate-300 italic">NULL</span>
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Konsol Kueri SQLite Interaktif */}
            <div className="rounded-2xl border border-amber-200/80 bg-white overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-[#16233b] text-white flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  SQLite Query Runner (Uji Kueri Ekstraksi BKU ARKAS 4)
                </div>
                <span className="text-[11px] text-amber-200/70 font-mono">Read-Only Memory Execution</span>
              </div>
              <form onSubmit={handleExecuteCustomSql} className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customSql}
                    onChange={(e) => setCustomSql(e.target.value)}
                    className="flex-1 font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-600 outline-none"
                    placeholder="SELECT * FROM kas_umum LIMIT 10;"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#16233b] hover:bg-[#23375c] text-amber-200 text-xs font-bold transition shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    Jalankan SQL
                  </button>
                </div>

                {sqlError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-mono">
                    {sqlError}
                  </div>
                )}

                {customResult && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-mono text-slate-700">
                          {customResult.columns.map((c) => (
                            <th key={c} className="py-2 px-3 border-r border-slate-200">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {customResult.rows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            {customResult.columns.map((c) => (
                              <td key={c} className="py-2 px-3 border-r border-slate-100 font-mono text-slate-700">
                                {String(r[c] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
