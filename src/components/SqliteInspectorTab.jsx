import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
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
} from 'lucide-react';
import {
  inspectTableRows,
  runCustomSqliteQuery,
  extractSchoolProfileFromArkas,
} from '../services/arkasSqliteService';

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
  const [selectedTable, setSelectedTable] = useState(tables[0]?.name || '');
  const [rowLimit, setRowLimit] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const [customSql, setCustomSql] = useState('SELECT no_bukti, tanggal_transaksi, kode_rekening, uraian, saldo, sumber_dana FROM kas_umum LIMIT 10;');
  const [customResult, setCustomResult] = useState(null);
  const [sqlError, setSqlError] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const fileInputRef = useRef(null);

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
              ? 'border-blue-600 bg-blue-50/70'
              : 'border-slate-300 hover:border-blue-500 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".db,.sqlite,.sqlite3,.arkas,*/*"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
              WebAssembly sql.js (100% Client-Side di Memori Browser)
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Tarik & Lepas (Drag & Drop) File Database SQLite ARKAS 4 di Sini
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mendukung file database lokal ARKAS (<code className="font-mono bg-slate-100 px-1 rounded">.db</code>,{' '}
              <code className="font-mono bg-slate-100 px-1 rounded">.sqlite</code>,{' '}
              <code className="font-mono bg-slate-100 px-1 rounded">arkas.db</code>). File diproses langsung di RAM browser
              tanpa pernah diunggah ke server mana pun.
            </p>
          </div>
        </div>

        {/* Panel Status File & Tombol Demo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4">
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
            <div className="mt-2 font-bold text-sm text-slate-900 truncate">
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
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              Muat Database Simulasi ARKAS 4
            </button>
            {sqliteDb && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDemoSqlite}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                  title="Unduh file .db fisik untuk diuji Drag & Drop"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
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
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Profil Sekolah Terdeteksi di Database SQLite ARKAS
              </div>
              <div className="text-sm font-bold text-slate-900">
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Database className="w-3.5 h-3.5" />
            Sinkronkan Profil Sekolah ke Cloud Neon
          </button>
        </div>
      )}

      {/* Bagian Utama: Daftar Seluruh Tabel & Table Inspector (10 Baris Pertama) */}
      {sqliteDb && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Daftar Tabel */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" />
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
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-blue-600 outline-none"
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
                        ? 'bg-blue-50/90 text-blue-900 font-bold border-l-4 border-blue-600'
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
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
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
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Table2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Table Inspector:{' '}
                      <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
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
                          ? 'bg-blue-600 text-white'
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
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
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
                        <tr key={rIdx} className="hover:bg-blue-50/40">
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
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  SQLite Query Runner (Uji Kueri Ekstraksi BKU ARKAS 4)
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Read-Only Memory Execution</span>
              </div>
              <form onSubmit={handleExecuteCustomSql} className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customSql}
                    onChange={(e) => setCustomSql(e.target.value)}
                    className="flex-1 font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none"
                    placeholder="SELECT * FROM kas_umum LIMIT 10;"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
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
