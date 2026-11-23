import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  FileSpreadsheet,
  Layers,
  Printer,
  Building2,
  ShieldCheck,
  RefreshCw,
  Lock,
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
import BalineseOrnamentFrame, { HeaderBaliSilhouette } from './components/BalineseOrnamentFrame';
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
      protectedPin: true,
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
    <div className="min-h-screen flex flex-col relative text-slate-800">
      {/* Latar Belakang Tekstur Transparan Batik Emas & Sisi Kiri-Kanan Arsitektur Bali Modern */}
      <BalineseOrnamentFrame />

      {/* Header Utama Berwarna Soft Champagne-Gold & Berkilau Terus-Menerus */}
      <header className="luxury-header-shimmer border-b-2 border-amber-400/70 shadow-md sticky top-0 z-30 print:hidden">
        {/* Garis Pita Emas Atas */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-600" />

        {/* Siluet Arsitektur Bali Modern di Sisi Kiri & Kanan Header */}
        <div className="absolute left-0 bottom-0 top-1 hidden sm:block pointer-events-none z-0">
          <HeaderBaliSilhouette flip={false} />
        </div>
        <div className="absolute right-0 bottom-0 top-1 hidden sm:block pointer-events-none z-0">
          <HeaderBaliSilhouette flip={true} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo GIF/PNG SiapBosKu & Identitas Sekolah */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 p-1 shadow-lg border-2 border-amber-500/80 flex items-center justify-center shrink-0">
              <img
                src="./logo-siapbosku.gif"
                onError={(e) => {
                  e.currentTarget.src = './logo-siapbosku.png';
                }}
                alt="Logo SiapBosKu Pengelolaan Keuangan Sekolah"
                className="w-full h-full object-contain logo-gleam-effect"
              />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-[#16233b] flex items-center justify-center shadow">
                <Sparkles className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#16233b] text-amber-300 border border-amber-400/60 shadow-sm">
                  SIAPBOSKU • ARKAS 4
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-950 border border-amber-500/40">
                  SQLite WASM + Cloud Neon PostgreSQL
                </span>
              </div>
              <h1
                className="text-lg sm:text-xl font-extrabold tracking-tight text-[#16233b] mt-0.5"
                style={{ fontFamily: "'Cinzel', Georgia, serif" }}
              >
                Sistem Administrasi & Cetak SPJ ARKAS
              </h1>
              <p className="text-xs font-semibold text-amber-950/85">
                {profilSekolah?.nama_sekolah || 'SD NEGERI 7 PEDUNGAN'} • NPSN:{' '}
                {profilSekolah?.npsn || '50103123'} • Tahun Anggaran {profilSekolah?.tahun_anggaran || 2026}
              </p>
            </div>
          </div>

          {/* Indikator & Tombol Pengaturan Koneksi Database Neon (Dilindungi PIN) */}
          <div className="flex items-center gap-2.5">
            {cloudStatus.connected && (
              <button
                type="button"
                onClick={refreshNeonData}
                disabled={cloudStatus.loading}
                className="p-2.5 rounded-xl bg-white/80 hover:bg-white text-[#16233b] border border-amber-400/60 shadow-sm transition"
                title="Sinkronkan ulang dengan Cloud Neon"
              >
                <RefreshCw className={`w-4 h-4 ${cloudStatus.loading ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold border shadow-sm transition ${
                cloudStatus.connected
                  ? 'bg-[#16233b] hover:bg-[#223559] border-amber-400/70 text-amber-200'
                  : 'bg-amber-900 hover:bg-amber-950 border-amber-300 text-amber-100'
              }`}
            >
              <Database className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cloudStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{cloudStatus.connected ? 'Neon Cloud Aktif' : 'Atur Koneksi Neon'}</span>
                  <Lock className="w-3 h-3 text-amber-400/90 ml-0.5" title="Dilindungi PIN Pengaman" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Navigasi Tab 4 Modul Utama */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 pt-1 flex items-center gap-1.5 overflow-x-auto">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-t border-x whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#16233b] text-amber-200 border-amber-400/80 shadow-sm'
                    : 'bg-white/65 text-[#16233b] border-amber-300/60 hover:bg-white/95'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-amber-700'}`} />
                <span>{tab.label}</span>
                {tab.protectedPin && (
                  <Lock
                    className={`w-3 h-3 ${isActive ? 'text-amber-300' : 'text-amber-700'}`}
                    title="Dilindungi PIN Pengaman"
                  />
                )}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40'
                      : 'bg-amber-100/90 text-amber-900'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Konten Utama Aplikasi (Diberi padding horizontal pada layar besar agar ornamen Bali kiri-kanan tampil anggun) */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 lg:px-14 py-6 print:p-0 print:max-w-none">
        {loadingSqlite && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center gap-2.5 print:hidden">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
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
      <footer className="relative z-10 luxury-header-shimmer border-t border-amber-300/80 py-3.5 px-6 text-xs text-[#16233b] print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>
              <strong>SiapBosKu</strong> — Pembaca SQLite ARKAS 4 (<code className="font-mono">sql.js</code> WebAssembly)
              & Sinkronisasi Cloud Neon PostgreSQL
            </span>
          </div>
          <div className="font-semibold text-amber-950/80">
            Arsitektur Bali Modern • Dilindungi PIN Keamanan & Tanpa Hardcoded Secret
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
