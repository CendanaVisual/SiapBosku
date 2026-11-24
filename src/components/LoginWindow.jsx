import React, { useState } from 'react';
import {
  KeyRound,
  School,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  LogIn,
  AlertTriangle,
  Database,
  Volume2,
} from 'lucide-react';
import BalineseOrnamentFrame, {
  HeaderBaliCarvingCorner,
  SidebarCarvingDivider,
} from './BalineseOrnamentFrame';

const VALID_USERNAME_NPSN = '50103069';
const VALID_PASSWORD = 'siapbos123';

const RUNNING_TEXT_MESSAGE =
  'Rahajeng Rawuh & selamat datang di SiapBosKu — Layanan Administrasi & Cetak SPJ ARKAS 4 SD Negeri 7 Pedungan. Mari dukung tata kelola Dana BOSP Reguler Tahun Anggaran 2027 yang rapi, transparan, dan tepat waktu';

export default function LoginWindow({ onLoginSuccess, cloudConnected }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Mohon masukkan Username (NPSN) dan Password terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (cleanUser === VALID_USERNAME_NPSN && cleanPass === VALID_PASSWORD) {
        onLoginSuccess({ username: cleanUser, rememberMe });
      } else {
        setErrorMsg('Username (NPSN) atau Password tidak sesuai! Silakan periksa kembali.');
        setIsSubmitting(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative text-slate-800 pb-12 overflow-hidden">
      {/* Latar Belakang Tekstur Transparan Batik Prada Emas & Ornamen Ukiran Bali Kuno Kiri-Kanan */}
      <BalineseOrnamentFrame />

      {/* Kontainer Utama Jendela Login di Tengah Layar */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border-2 border-amber-400/90 bg-gradient-to-b from-[#fffdf9] via-[#fcf5e2] to-[#f8ebd0] shadow-[0_20px_60px_-15px_rgba(180,130,20,0.38)] overflow-hidden">
          {/* Pita Emas Atas */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-700 via-yellow-300 to-amber-700" />

          {/* HEADER JENDELA LOGIN MEWAH BERKILAU DENGAN LOGO SEBAGAI PUSAT HEADER */}
          <div className="luxury-header-shimmer relative border-b-2 border-amber-400/75 px-6 pt-7 pb-5 text-center">
            {/* Ukiran Bali Kuno di Sudut Kiri & Kanan Header Login */}
            <div className="absolute left-0 top-0 bottom-0 pointer-events-none opacity-80">
              <HeaderBaliCarvingCorner flip={false} />
            </div>
            <div className="absolute right-0 top-0 bottom-0 pointer-events-none opacity-80">
              <HeaderBaliCarvingCorner flip={true} />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              {/* Emblem Logo Besar Berkilau sebagai Header Utama */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-1.5 shadow-[0_0_30px_rgba(212,175,55,0.55)] border-2 border-amber-500 flex items-center justify-center">
                <img
                  src="./logo-siapbosku.gif"
                  onError={(e) => {
                    e.currentTarget.src = './logo-siapbosku.png';
                  }}
                  alt="Logo SiapBosKu Pengelolaan Keuangan Sekolah"
                  className="w-full h-full object-contain logo-gleam-effect"
                />
                <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[#16233b] border-2 border-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </span>
              </div>

              {/* Badge & Judul Aplikasi di Header Login */}
              <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#16233b] text-amber-300 border border-amber-400/70 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Gerbang Autentikasi Resmi
              </div>

              <h1
                className="text-xl sm:text-2xl font-extrabold tracking-wide text-[#16233b] mt-2"
                style={{ fontFamily: "'Cinzel', Georgia, serif" }}
              >
                SIAPBOSKU
              </h1>
              <p className="text-xs font-bold text-amber-950/90 mt-0.5">
                Sistem Administrasi & Cetak SPJ ARKAS 4
              </p>
              <p className="text-[11px] font-semibold text-amber-800/80">
                SD Negeri 7 Pedungan • Kota Denpasar
              </p>

              <div className="w-48 mt-2">
                <SidebarCarvingDivider />
              </div>
            </div>
          </div>

          {/* FORMULIR LOGIN */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
            {/* Indikator Koneksi Otomatis Cloud Neon */}
            <div className="rounded-xl bg-white/85 border border-amber-300/80 px-3.5 py-2.5 flex items-center justify-between text-xs shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-[#16233b]">
                <Database className="w-4 h-4 text-amber-700" />
                <span>Database Cloud Neon</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {cloudConnected ? 'Tersambung Otomatis' : 'Siap Terhubung'}
              </span>
            </div>

            {/* Input Username (NPSN) */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#16233b] mb-1.5">
                Username (NPSN Sekolah)
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-amber-700 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Masukkan NPSN Sekolah..."
                  className="w-full pl-10 pr-4 py-3 text-sm font-mono font-bold text-[#16233b] rounded-xl border-2 border-amber-300/90 bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-500/15 outline-none transition shadow-inner"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#16233b] mb-1.5">
                Password / Kata Sandi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-700 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Masukkan Password..."
                  className="w-full pl-10 pr-10 py-3 text-sm font-mono font-bold text-[#16233b] rounded-xl border-2 border-amber-300/90 bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-500/15 outline-none transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
                  title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Opsi Ingat Sesi */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-amber-400 text-[#16233b] focus:ring-amber-500"
                />
                <span>Ingat sesi login di browser ini</span>
              </label>
              <span className="text-[11px] font-semibold text-amber-800">TA 2027</span>
            </div>

            {/* Pesan Error */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Tombol Masuk Mewah */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#16233b] via-[#22365c] to-[#16233b] hover:from-[#1e3050] hover:to-[#2c4575] text-amber-200 border-2 border-amber-400/80 font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? 'Memverifikasi Akses...' : 'Masuk ke Aplikasi SiapBosKu'}</span>
            </button>
          </form>

          {/* Footer Kartu Login */}
          <div className="px-6 py-3 bg-amber-100/60 border-t border-amber-300/70 text-center text-[11px] text-amber-950/80 font-medium">
            Sinkronisasi Cloud Neon Aktif • Data SPJ & BKU Terpusat
          </div>
        </div>
      </div>

      {/* Running Text di Bagian Bawah Layar Login */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-[#16233b] via-[#1f3154] to-[#16233b] text-amber-100 border-t-2 border-amber-400/85 shadow-2xl">
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
    </div>
  );
}
