import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  FileSpreadsheet,
  Layers,
  Printer,
  Building2,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  loadSqliteFromArrayBuffer,
  getAllSqliteTables,
  extractBkuTransactions,
  createDemoArkasDatabase,
} from './services/arkasSqliteService';
import {
  getActiveNeonConnectionInfo,
  initializeNeonSchema,
  fetchAllCloudData,
  saveProfilSekolah,
} from './services/neonClient';
import DatabaseSettingsModal from './components/DatabaseSettingsModal';
import SqliteInspectorTab from './components/SqliteInspectorTab';
import BkuGroupingTab from './components/BkuGroupingTab';
import MasterDataTab from './components/MasterDataTab';
import SpjFormModal from './components/SpjFormModal';
import PrintPreviewTab from './components/PrintPreviewTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('SQLITE_INSPECTOR');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // State SQLite ARKAS (Client-Side WebAssembly sql.js)
  const [sqliteDb, setSqliteDb] = useState(null);
  const [sqliteFileInfo, setSqliteFileInfo] = useState(null);
  const [tables, setTables] = useState([]);
  const [bkuList, setBkuList] = useState([]);
  const [loadingSqlite, setLoadingSqlite] = useState(false);

  // State Cloud Neon PostgreSQL
  const [cloudStatus, setCloudStatus] = useState({
    connected: false,
    loading: false,
    error: '',
    source: '',
    latencyMs: null,
    counts: null,
  });
  const [profilSekolah, setProfilSekolah] = useState(null);
  const [penyediaList, setPenyediaList] = useState([]);
  const [spjMap, setSpjMap] = useState({});

  // State Modal Pelengkapan SPJ & Draft Cetak
  const [isSpjModalOpen, setIsSpjModalOpen] = useState(false);
  const [activeGroupedDraft, setActiveGroupedDraft] = useState(null);
  const [selectedPrintBpu, setSelectedPrintBpu] = useState('BPU-01');

  // Fungsi sinkronisasi data dari Cloud Neon
  const refreshNeonData = useCallback(async () => {
    const conn = getActiveNeonConnectionInfo();
    if (!conn.url) {
      setCloudStatus({
        connected: false,
        loading: false,
        error: 'Belum dikonfigurasi',
        source: conn.source,
        latencyMs: null,
        counts: null,
      });
      return;
    }

    setCloudStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const initRes = await initializeNeonSchema();
      const cloudData = await fetchAllCloudData();
      setProfilSekolah(cloudData.profil);
      setPenyediaList(cloudData.penyediaList);
      setSpjMap(cloudData.spjMap);
      setCloudStatus({
        connected: true,
        loading: false,
        error: '',
        source: conn.source,
        latencyMs: initRes.latencyMs,
        counts: initRes.counts,
      });
    } catch (err) {
      setCloudStatus({
        connected: false,
        loading: false,
        error: err.message || 'Gagal menghubungi Neon PostgreSQL',
        source: conn.source,
        latencyMs: null,
        counts: null,
      });
    }
  }, []);

  // Fungsi memuat instance database SQLite ke state aplikasi
  const applySqliteDatabase = useCallback((dbInstance, fileName, fileSize = 0) => {
    const allTables = getAllSqliteTables(dbInstance);
    const extractedBku = extractBkuTransactions(dbInstance);
    setSqliteDb(dbInstance);
    setSqliteFileInfo({
      name: fileName,
      size: fileSize,
      loadedAt: new Date().toLocaleTimeString('id-ID'),
    });
    setTables(allTables);
    setBkuList(extractedBku);
    if (extractedBku.length > 0) {
      setSelectedPrintBpu(extractedBku[0].no_bpu);
    }
  }, []);

  // Muat File SQLite asli dari Drag & Drop / File Picker
  const handleLoadFileBuffer = async (arrayBuffer, fileName, fileSize) => {
    setLoadingSqlite(true);
    try {
      const db = await loadSqliteFromArrayBuffer(arrayBuffer);
      applySqliteDatabase(db, fileName, fileSize);
    } catch (err) {
      alert(`Gagal membaca file SQLite ARKAS: ${err.message}`);
    } finally {
      setLoadingSqlite(false);
    }
  };

  // Muat Database Simulasi ARKAS 4
  const handleLoadDemoDatabase = useCallback(async () => {
    setLoadingSqlite(true);
    try {
      const db = await createDemoArkasDatabase();
      applySqliteDatabase(db, 'arkas_4_simulasi_sdn7.db (Memori Browser)', 65536);
    } catch (err) {
      console.error('Gagal memuat simulasi SQLite:', err);
    } finally {
      setLoadingSqlite(false);
    }
  }, [applySqliteDatabase]);

  // Inisialisasi saat aplikasi dibuka
  useEffect(() => {
    handleLoadDemoDatabase();
    refreshNeonData();
  }, [handleLoadDemoDatabase, refreshNeonData]);

  // Impor profil sekolah dari SQLite ARKAS ke Cloud Neon
  const handleImportSchoolProfile = async (detected) => {
    try {
      const merged = { ...(profilSekolah || {}), ...detected };
      await saveProfilSekolah(merged);
      await refreshNeonData();
      alert(`Profil sekolah "${detected.nama_sekolah}" berhasil disinkronkan ke Cloud Neon!`);
    } catch (err) {
      alert(`Gagal menyinkronkan profil sekolah: ${err.message}. Pastikan koneksi Neon aktif.`);
    }
  };

  const handleOpenSpjModal = (groupedDraft) => {
    setActiveGroupedDraft(groupedDraft);
    setIsSpjModalOpen(true);
  };

  const handleDirectPrintGroup = (groupedDraft) => {
    setActiveGroupedDraft(groupedDraft);
    setSelectedPrintBpu(groupedDraft.no_bpu);
    setActiveTab('PRINT_PREVIEW');
  };

  const handleSavedAndPrint = (noBpu) => {
    setIsSpjModalOpen(false);
    setSelectedPrintBpu(noBpu);
    setActiveTab('PRINT_PREVIEW');
  };

  const navItems = [
    {
      id: 'SQLITE_INSPECTOR',
      label: '1. Pembaca SQLite & Table Inspector',
      badge: `${tables.length} Tabel`,
      icon: FileSpreadsheet,
    },
    {
      id: 'BKU_GROUPING',
      label: '2. Pengelompokan & Pelengkapan SPJ',
      badge: `${bkuList.length} BKU`,
      icon: Layers,
    },
    {
      id: 'MASTER_DATA',
      label: '3. Profil Sekolah & Data Penyedia (Neon)',
      badge: `${penyediaList.length} Toko`,
      icon: Building2,
    },
    {
      id: 'PRINT_PREVIEW',
      label: '4. Cetak Dokumen Resmi (A4 / F4)',
      badge: 'Kwitansi • SP • BAST',
      icon: Printer,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Header Utama Aplikasi (Disembunyikan saat @media print) */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Nama Aplikasi */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30 font-extrabold text-lg tracking-tighter">
              SB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
                  SiapBosKu — Sistem Administrasi & Cetak SPJ ARKAS
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  ARKAS 4 • SQLite WASM + Neon Cloud
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                {profilSekolah?.nama_sekolah || 'SD NEGERI 7 PEDUNGAN'} • NPSN:{' '}
                {profilSekolah?.npsn || '50103123'} • Tahun Anggaran {profilSekolah?.tahun_anggaran || 2026}
              </p>
            </div>
          </div>

          {/* Indikator & Tombol Pengaturan Koneksi Database Neon */}
          <div className="flex items-center gap-2.5">
            {cloudStatus.connected && (
              <button
                type="button"
                onClick={refreshNeonData}
                disabled={cloudStatus.loading}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-blue-200 transition"
                title="Sinkronkan ulang dengan Cloud Neon"
              >
                <RefreshCw className={`w-4 h-4 ${cloudStatus.loading ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                cloudStatus.connected
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/25'
                  : 'bg-amber-500/20 border-amber-400/40 text-amber-200 hover:bg-amber-500/30'
              }`}
            >
              <Database className="w-4 h-4" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cloudStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{cloudStatus.connected ? 'Neon Cloud Aktif' : 'Atur Koneksi Neon'}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Navigasi Tab 4 Modul Utama */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-1 flex items-center gap-1.5 overflow-x-auto">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 whitespace-nowrap transition ${
                  isActive
                    ? 'bg-slate-50 text-blue-900 border-blue-600'
                    : 'text-slate-300 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive ? 'bg-blue-100 text-blue-800' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Konten Utama Aplikasi */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 print:p-0 print:max-w-none">
        {loadingSqlite && (
          <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2.5 print:hidden">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            Memproses database SQLite ARKAS di memori WebAssembly browser...
          </div>
        )}

        {activeTab === 'SQLITE_INSPECTOR' && (
          <SqliteInspectorTab
            sqliteDb={sqliteDb}
            sqliteFileInfo={sqliteFileInfo}
            tables={tables}
            bkuList={bkuList}
            onLoadFileBuffer={handleLoadFileBuffer}
            onLoadDemoDatabase={handleLoadDemoDatabase}
            onImportSchoolProfile={handleImportSchoolProfile}
            onGoToBkuTab={() => setActiveTab('BKU_GROUPING')}
          />
        )}

        {activeTab === 'BKU_GROUPING' && (
          <BkuGroupingTab
            bkuList={bkuList}
            spjMap={spjMap}
            penyediaList={penyediaList}
            onOpenSpjModal={handleOpenSpjModal}
            onDirectPrintGroup={handleDirectPrintGroup}
          />
        )}

        {activeTab === 'MASTER_DATA' && (
          <MasterDataTab
            profil={profilSekolah}
            penyediaList={penyediaList}
            onRefreshCloud={refreshNeonData}
          />
        )}

        {activeTab === 'PRINT_PREVIEW' && (
          <PrintPreviewTab
            bkuList={bkuList}
            spjMap={spjMap}
            profil={profilSekolah}
            penyediaList={penyediaList}
            activeDraft={activeGroupedDraft}
            selectedBpuKey={selectedPrintBpu}
            onSelectBpuKey={setSelectedPrintBpu}
            onOpenSpjModal={handleOpenSpjModal}
            onRefreshCloud={refreshNeonData}
          />
        )}
      </main>

      {/* Footer Aplikasi (Disembunyikan saat @media print) */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-6 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>SiapBosKu</strong> — Pembaca SQLite ARKAS 4 (<code className="font-mono">sql.js</code> WebAssembly)
              & Sinkronisasi Cloud Neon PostgreSQL
            </span>
          </div>
          <div>
            Keamanan Kredensial: Tanpa Hardcoded Secret • Siap Deploy GitHub Pages
          </div>
        </div>
      </footer>

      {/* Modal Pengaturan Koneksi Database Neon */}
      <DatabaseSettingsModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onConnectionUpdated={refreshNeonData}
        cloudStatus={cloudStatus}
      />

      {/* Modal Pelengkapan & Pengelompokan SPJ */}
      <SpjFormModal
        isOpen={isSpjModalOpen}
        onClose={() => setIsSpjModalOpen(false)}
        groupedDraft={activeGroupedDraft}
        existingSpj={activeGroupedDraft ? spjMap[activeGroupedDraft.no_bpu] : null}
        penyediaList={penyediaList}
        onSavedSuccess={refreshNeonData}
        onSavedAndPrint={handleSavedAndPrint}
      />
    </div>
  );
}
