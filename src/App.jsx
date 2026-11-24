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
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Volume2,
  LogOut,
  CloudDownload,
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
  syncExtractedBkuToNeon,
} from './services/neonClient';
import BalineseOrnamentFrame, {
  HeaderBaliCarvingCorner,
  SidebarCarvingDivider,
} from './components/BalineseOrnamentFrame';
import LoginWindow from './components/LoginWindow';
import DatabaseSettingsModal from './components/DatabaseSettingsModal';
import SqliteInspectorTab from './components/SqliteInspectorTab';
import BkuGroupingTab from './components/BkuGroupingTab';
import MasterDataTab from './components/MasterDataTab';
import SpjFormModal from './components/SpjFormModal';
import PrintPreviewTab from './components/PrintPreviewTab';

const AUTH_SESSION_KEY = 'siapbosku_auth_npsn_v1';

const RUNNING_TEXT_MESSAGE =
  'Rahajeng Rawuh & selamat datang di SiapBosKu — Layanan Administrasi & Cetak SPJ ARKAS 4 SD Negeri 7 Pedungan. Mari dukung tata kelola Dana BOSP Reguler Tahun Anggaran 2027 yang rapi, transparan, dan tepat waktu';

export default function App() {
  // State Autentikasi Login (Username NPSN: 50103069, Password: siapbos123)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === '50103069';
  });

  const [activeTab, setActiveTab] = useState('BKU_GROUPING');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // State SQLite ARKAS (Client-Side WebAssembly sql.js untuk Table Inspector)
  const [sqliteDb, setSqliteDb] = useState(null);
  const [sqliteFileInfo, setSqliteFileInfo] = useState(null);
  const [tables, setTables] = useState([]);
  const [loadingSqlite, setLoadingSqlite] = useState(false);

  // State Cloud Neon PostgreSQL (Sumber Utama Seluruh Data Web)
  const [cloudStatus, setCloudStatus] = useState({
    connected: false,
    loading: false,
    error: '',
    source: '',
    latencyMs: null,
    counts: null,
  });
  const [profilSekolah, setProfilSekolah] = useState(null);
  const [bkuList, setBkuList] = useState([]);
  const [penyediaList, setPenyediaList] = useState([]);
  const [spjMap, setSpjMap] = useState({});

  // State Modal Pelengkapan SPJ & Draft Cetak
  const [isSpjModalOpen, setIsSpjModalOpen] = useState(false);
  const [activeGroupedDraft, setActiveGroupedDraft] = useState(null);
  const [selectedPrintBpu, setSelectedPrintBpu] = useState('BPU-01');

  // Fungsi utama: Memuat SELURUH data web langsung dari Database Cloud Neon
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
      setBkuList(cloudData.bkuList || []);
      setPenyediaList(cloudData.penyediaList || []);
      setSpjMap(cloudData.spjMap || {});
      if (cloudData.bkuList?.length > 0) {
        setSelectedPrintBpu((prev) => prev || cloudData.bkuList[0].no_bpu);
      }
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

  // Fungsi memuat instance database SQLite ke Table Inspector
  const applySqliteInspectorOnly = useCallback((dbInstance, fileName, fileSize = 0) => {
    const allTables = getAllSqliteTables(dbInstance);
    setSqliteDb(dbInstance);
    setSqliteFileInfo({
      name: fileName,
      size: fileSize,
      loadedAt: new Date().toLocaleTimeString('id-ID'),
    });
    setTables(allTables);
  }, []);

  // Saat pengguna mengunggah file SQLite ARKAS (.db) baru di Modul 1,
  // ekstrak BKU dan langsung simpan/sinkronkan ke tabel bku_arkas di Cloud Neon!
  const handleLoadFileBuffer = async (arrayBuffer, fileName, fileSize) => {
    setLoadingSqlite(true);
    try {
      const db = await loadSqliteFromArrayBuffer(arrayBuffer);
      applySqliteInspectorOnly(db, fileName, fileSize);
      const extractedBku = extractBkuTransactions(db);
      if (extractedBku.length > 0) {
        await syncExtractedBkuToNeon(extractedBku, fileName, true);
        await refreshNeonData();
      }
    } catch (err) {
      alert(`Gagal membaca atau menyinkronkan file SQLite ARKAS ke Neon: ${err.message}`);
    } finally {
      setLoadingSqlite(false);
    }
  };

  // Muat Database Simulasi SQLite untuk Table Inspector & sinkronkan ke Neon jika tabel bku_arkas kosong
  const handleLoadDemoDatabase = useCallback(
    async (syncToNeon = false) => {
      setLoadingSqlite(true);
      try {
        const db = await createDemoArkasDatabase();
        applySqliteInspectorOnly(db, 'arkas_4_cloud_neon_sdn7.db', 65536);
        if (syncToNeon) {
          const extractedBku = extractBkuTransactions(db);
          await syncExtractedBkuToNeon(extractedBku, 'Simulasi ARKAS 4 (Cloud Neon)', true);
          await refreshNeonData();
        }
      } catch (err) {
        console.error('Gagal memuat simulasi SQLite:', err);
      } finally {
        setLoadingSqlite(false);
      }
    },
    [applySqliteInspectorOnly, refreshNeonData]
  );

  // Inisialisasi saat aplikasi dibuka: langsung muat seluruh data dari Cloud Neon
  useEffect(() => {
    refreshNeonData();
    handleLoadDemoDatabase(false);
  }, [refreshNeonData, handleLoadDemoDatabase]);

  const handleLoginSuccess = ({ username }) => {
    sessionStorage.setItem(AUTH_SESSION_KEY, username);
    setIsAuthenticated(true);
    refreshNeonData();
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setIsAuthenticated(false);
  };

  // Impor profil sekolah dari SQLite ARKAS ke Cloud Neon
  const handleImportSchoolProfile = async (detected) => {
    try {
      const merged = { ...(profilSekolah || {}), ...detected, npsn: '50103069' };
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

  // TAMPILKAN JENDELA LOGIN MEWAH JIKA BELUM LOGIN
  if (!isAuthenticated) {
    return (
      <LoginWindow
        onLoginSuccess={handleLoginSuccess}
        cloudConnected={cloudStatus.connected}
      />
    );
  }

  const navItems = [
    {
      id: 'SQLITE_INSPECTOR',
      stepNumber: '01',
      title: 'Pembaca SQLite & Table Inspector',
      subtitle: 'Unggah .db ARKAS & sinkron ke Neon',
      badge: `${tables.length} Tabel`,
      icon: FileSpreadsheet,
      protectedPin: true,
    },
    {
      id: 'BKU_GROUPING',
      stepNumber: '02',
      title: 'Pengelompokan & Pelengkapan SPJ',
      subtitle: 'Data BKU langsung dari Cloud Neon',
      badge: `${bkuList.length} BKU Neon`,
      icon: Layers,
    },
    {
      id: 'MASTER_DATA',
      stepNumber: '03',
      title: 'Profil Sekolah & Data Penyedia',
      subtitle: 'Master pejabat & toko di Cloud Neon',
      badge: `${penyediaList.length} Toko`,
      icon: Building2,
    },
    {
      id: 'PRINT_PREVIEW',
      stepNumber: '04',
      title: 'Cetak Dokumen Resmi (A4 / F4)',
      subtitle: 'Kwitansi Dinas, Nota Pesanan, & BAST',
      badge: 'Siap Cetak',
      icon: Printer,
    },
  ];

  const activeNavMeta = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen flex flex-col relative text-slate-800 pb-11 print:pb-0">
      {/* Latar Belakang Tekstur Transparan Batik Emas & Sisi Kiri-Kanan Ornamen Ukiran Bali Kuno */}
      <BalineseOrnamentFrame />

      {/* Header Utama Berwarna Soft Champagne-Gold & Berkilau Terus-Menerus */}
      <header className="luxury-header-shimmer border-b-2 border-amber-400/75 shadow-md sticky top-0 z-30 print:hidden">
        {/* Garis Pita Emas Atas */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-700 via-yellow-300 to-amber-700" />

        {/* Ukiran Bali Kuno di Sudut Kiri & Kanan Header */}
        <div className="absolute left-0 bottom-0 top-1 hidden sm:block pointer-events-none z-0">
          <HeaderBaliCarvingCorner flip={false} />
        </div>
        <div className="absolute right-0 bottom-0 top-1 hidden sm:block pointer-events-none z-0">
          <HeaderBaliCarvingCorner flip={true} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Kiri: Tombol Toggle Sidebar + Logo GIF/PNG SiapBosKu & Identitas Sekolah */}
          <div className="flex items-center gap-3.5">
            {/* Tombol Tampilkan / Sembunyikan Menu Sidebar */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#16233b] hover:bg-[#223559] text-amber-200 border border-amber-400/70 shadow-sm text-xs font-bold transition"
              title={isSidebarOpen ? 'Sembunyikan Menu Sidebar' : 'Tampilkan Menu Sidebar'}
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Sembunyikan Menu</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Tampilkan Menu</span>
                </>
              )}
            </button>

            {/* Emblem Logo SiapBosKu */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 p-1 shadow-lg border-2 border-amber-500/80 flex items-center justify-center shrink-0">
              <img
                src="./logo-siapbosku.gif"
                onError={(e) => {
                  e.currentTarget.src = './logo-siapbosku.png';
                }}
                alt="Logo SiapBosKu Pengelolaan Keuangan Sekolah"
                className="w-full h-full object-contain logo-gleam-effect"
              />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-[#16233b] flex items-center justify-center shadow">
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#16233b] text-amber-300 border border-amber-400/60 shadow-sm">
                  SIAPBOSKU • ARKAS 4
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-900 border border-emerald-500/40">
                  <CloudDownload className="w-3 h-3 text-emerald-700" />
                  100% Data Cloud Neon Aktif
                </span>
              </div>
              <h1
                className="text-base sm:text-xl font-extrabold tracking-tight text-[#16233b] mt-0.5"
                style={{ fontFamily: "'Cinzel', Georgia, serif" }}
              >
                Sistem Administrasi & Cetak SPJ ARKAS
              </h1>
              <p className="text-xs font-semibold text-amber-950/85">
                {profilSekolah?.nama_sekolah || 'SD NEGERI 7 PEDUNGAN'} • NPSN:{' '}
                {profilSekolah?.npsn || '50103069'} • Tahun Anggaran {profilSekolah?.tahun_anggaran || 2027}
              </p>
            </div>
          </div>

          {/* Kanan: Indikator Neon + Tombol Pengaturan Database + Tombol Keluar (Logout) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshNeonData}
              disabled={cloudStatus.loading}
              className="p-2.5 rounded-xl bg-white/85 hover:bg-white text-[#16233b] border border-amber-400/70 shadow-sm transition"
              title="Muat Ulang Seluruh Data dari Cloud Neon"
            >
              <RefreshCw className={`w-4 h-4 ${cloudStatus.loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border shadow-sm transition ${
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
                  <span className="hidden sm:inline">
                    {cloudStatus.connected ? 'Neon Cloud Terhubung' : 'Koneksi Neon'}
                  </span>
                  <Lock className="w-3 h-3 text-amber-400/90" title="Dilindungi PIN Pengaman" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/85 hover:bg-red-50 text-red-700 border border-red-300/80 shadow-sm text-xs font-bold transition"
              title="Keluar dari Sesi Login (Logout)"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* BODY UTAMA: SIDEBAR KIRI MEWAH (DAPAT DITAMPILKAN / DISEMBUNYIKAN) + KONTEN MODUL */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 lg:px-16 py-6 flex flex-col lg:flex-row items-start gap-6 print:p-0 print:max-w-none print:block">
        {/* Tombol Melayang Pembuka Menu di Sisi Kiri jika Sidebar sedang Disembunyikan */}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-3 top-28 z-30 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-r-2xl rounded-l-lg bg-gradient-to-r from-[#16233b] to-[#23375c] hover:from-[#1e3050] hover:to-[#2c4573] text-amber-200 border-2 border-amber-400/80 shadow-xl text-xs font-bold transition print:hidden"
            title="Tampilkan Menu Navigasi"
          >
            <PanelLeftOpen className="w-4 h-4 text-amber-400" />
            <span>Tampilkan Menu</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        )}

        {/* SIDEBAR KIRI ELEGAN & MEWAH (MENU 1 - 4) */}
        {isSidebarOpen && (
          <aside className="w-full lg:w-80 shrink-0 rounded-3xl border-2 border-amber-400/80 luxury-sidebar-card shadow-xl overflow-hidden lg:sticky lg:top-28 transition-all duration-300 print:hidden">
            {/* Header Sidebar */}
            <div className="bg-gradient-to-r from-[#16233b] via-[#1f3154] to-[#16233b] text-amber-200 px-5 py-4 border-b border-amber-400/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <h2
                    className="text-xs font-extrabold uppercase tracking-widest text-amber-200"
                    style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                  >
                    Menu Utama SPJ
                  </h2>
                  <p className="text-[11px] text-amber-100/70">NPSN Login: 50103069</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 text-[11px] font-bold border border-amber-400/40 transition"
                title="Sembunyikan Menu Sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5 text-amber-400" />
                <span>Sembunyikan</span>
              </button>
            </div>

            {/* Pembatas Ukiran Bali Kuno Atas */}
            <div className="px-4 pt-2.5">
              <SidebarCarvingDivider />
            </div>

            {/* Daftar Tombol Menu 1 - 4 */}
            <nav className="p-3.5 space-y-2.5">
              {navItems.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-3.5 relative overflow-hidden group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#16233b] via-[#1f3154] to-[#16233b] text-white border-amber-400 shadow-lg'
                        : 'bg-white/85 hover:bg-white text-[#16233b] border-amber-300/70 hover:border-amber-500 shadow-sm'
                    }`}
                  >
                    {/* Nomor & Ikon Modul */}
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border transition ${
                        isActive
                          ? 'bg-amber-400/20 border-amber-400/70 text-amber-300'
                          : 'bg-amber-50 border-amber-300/80 text-amber-800 group-hover:bg-amber-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[9px] font-extrabold tracking-tighter leading-none mt-0.5">
                        {tab.stepNumber}
                      </span>
                    </div>

                    {/* Judul & Subjudul Menu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`text-xs font-extrabold leading-snug ${
                            isActive ? 'text-amber-200' : 'text-[#16233b]'
                          }`}
                        >
                          {tab.title}
                        </span>
                        {tab.protectedPin && (
                          <Lock
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-amber-300' : 'text-amber-700'
                            }`}
                            title="Dilindungi PIN Pengaman"
                          />
                        )}
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 leading-snug ${
                          isActive ? 'text-amber-100/80' : 'text-slate-500'
                        }`}
                      >
                        {tab.subtitle}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-amber-400/25 text-amber-200 border border-amber-300/50'
                              : 'bg-amber-100/90 text-amber-900 border border-amber-300/60'
                          }`}
                        >
                          {tab.badge}
                        </span>
                        <span
                          className={`text-[10px] font-bold inline-flex items-center gap-0.5 ${
                            isActive ? 'text-amber-300' : 'text-amber-800 opacity-0 group-hover:opacity-100'
                          } transition`}
                        >
                          {isActive ? 'Aktif' : 'Buka'}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Pembatas Ukiran Bali Kuno Bawah */}
            <div className="px-4 pb-1">
              <SidebarCarvingDivider />
            </div>

            {/* Ringkasan Status Cloud Neon di Bawah Sidebar */}
            <div className="p-4 m-3.5 mt-1 rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50/70 to-amber-100/60 border border-amber-300/80 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-[#16233b]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Sumber Data Utama
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  Cloud Neon
                </span>
              </div>
              <div className="text-[11px] text-slate-600 leading-relaxed">
                Transaksi BKU Neon:{' '}
                <strong className="text-[#16233b]">{bkuList.length} Item Belanja</strong>
              </div>
              <div className="text-[11px] text-slate-600">
                SPJ & Penyedia Neon:{' '}
                <strong className="text-emerald-700">
                  {Object.keys(spjMap).length} SPJ • {penyediaList.length} Toko
                </strong>
              </div>
            </div>
          </aside>
        )}

        {/* AREA KONTEN UTAMA */}
        <main className="flex-1 min-w-0 w-full print:p-0 print:max-w-none">
          {/* Bar Info Modul Aktif & Tombol Toggle Cepat */}
          <div className="mb-4 rounded-2xl border border-amber-300/80 bg-white/90 backdrop-blur-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm print:hidden">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16233b] hover:bg-[#223559] text-amber-200 text-xs font-bold border border-amber-400/60 transition"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5 text-amber-400" />
                  Tampilkan Menu
                </button>
              )}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Modul {activeNavMeta.stepNumber} dari 04 • Terhubung Otomatis ke Cloud Neon
                </div>
                <div className="text-sm font-extrabold text-[#16233b]">{activeNavMeta.title}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">{activeNavMeta.subtitle}</div>
          </div>

          {(loadingSqlite || cloudStatus.loading) && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center gap-2.5 print:hidden">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
              Menyinkronkan data dari database Cloud Neon PostgreSQL...
            </div>
          )}

          {activeTab === 'SQLITE_INSPECTOR' && (
            <SqliteInspectorTab
              sqliteDb={sqliteDb}
              sqliteFileInfo={sqliteFileInfo}
              tables={tables}
              bkuList={bkuList}
              onLoadFileBuffer={handleLoadFileBuffer}
              onLoadDemoDatabase={() => handleLoadDemoDatabase(true)}
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
      </div>

      {/* RUNNING TEXT (MARQUEE) DI BAGIAN BAWAH DENGAN KECEPATAN NYAMAN DIBACA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#16233b] via-[#1f3154] to-[#16233b] text-amber-100 border-t-2 border-amber-400/85 shadow-2xl print:hidden">
        <div className="max-w-7xl mx-auto flex items-center overflow-hidden h-10">
          <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-[#16233b] px-3.5 h-full flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider shrink-0 z-10 shadow-md">
            <Volume2 className="w-3.5 h-3.5" />
            <span>SiapBosKu Info</span>
          </div>

          <div className="flex-1 overflow-hidden relative h-full flex items-center">
            <div className="running-text-track text-xs sm:text-sm font-medium tracking-wide text-amber-100">
              <span className="px-8 whitespace-nowrap flex items-center gap-4">
                <span className="text-amber-400">❖</span>
                <span>{RUNNING_TEXT_MESSAGE}</span>
                <span className="text-amber-400">❖</span>
              </span>
              <span className="px-8 whitespace-nowrap flex items-center gap-4" aria-hidden="true">
                <span className="text-amber-400">❖</span>
                <span>{RUNNING_TEXT_MESSAGE}</span>
                <span className="text-amber-400">❖</span>
              </span>
            </div>
          </div>
        </div>
      </div>

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
