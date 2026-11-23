import React from 'react';

// ============================================================================
// ORNAMEN ARSITEKTUR BALI MODERN (SISI KIRI & KANAN WEB + HEADER)
// Menampilkan siluet artistik Candi Bentar (Gapura Bali), Meru Bertumpang,
// serta Ukiran Patra Punggel bernuansa Emas & Biru Royal (selaras dengan logo)
// ============================================================================

function CandiBentarPillar({ flip = false }) {
  return (
    <svg
      viewBox="0 0 140 760"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full ${flip ? 'scale-x-[-1]' : ''}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="baliGoldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#AA7C11" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#16233B" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="baliNavyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16233B" stopOpacity="0.18" />
          <stop offset="50%" stopColor="#C59B27" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#16233B" stopOpacity="0.22" />
        </linearGradient>
      </defs>

      {/* Garis Bingkai Vertikal Arsitektur Modern */}
      <line x1="12" y1="0" x2="12" y2="760" stroke="url(#baliGoldGrad)" strokeWidth="2" />
      <line x1="22" y1="0" x2="22" y2="760" stroke="url(#baliGoldGrad)" strokeWidth="0.8" strokeDasharray="6 4" />

      {/* Siluet Candi Bentar & Meru Modern (Bagian Atas) */}
      <g opacity="0.85">
        {/* Puncak Meru Bertumpang */}
        <path d="M12 45 L58 45 L48 32 L12 32 Z" fill="url(#baliNavyGrad)" stroke="#C59B27" strokeWidth="1.2" />
        <path d="M12 68 L72 68 L58 52 L12 52 Z" fill="url(#baliNavyGrad)" stroke="#C59B27" strokeWidth="1.2" />
        <path d="M12 92 L86 92 L70 75 L12 75 Z" fill="url(#baliNavyGrad)" stroke="#C59B27" strokeWidth="1.2" />
        <path d="M12 118 L102 118 L84 99 L12 99 Z" fill="url(#baliNavyGrad)" stroke="#C59B27" strokeWidth="1.2" />

        {/* Sayap Ukiran Candi Bentar */}
        <path
          d="M92 118 C112 118, 120 102, 108 92 C98 100, 92 104, 84 99"
          stroke="#C59B27"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M78 92 C96 92, 104 78, 94 70 C85 77, 79 80, 70 75"
          stroke="#C59B27"
          strokeWidth="1.3"
          fill="none"
        />
        <path
          d="M64 68 C78 68, 86 56, 77 48 C70 54, 65 56, 58 52"
          stroke="#C59B27"
          strokeWidth="1.2"
          fill="none"
        />
      </g>

      {/* Badan Pilar Candi Bentar Modern Geometris */}
      <g opacity="0.75">
        <rect x="12" y="124" width="64" height="18" fill="url(#baliNavyGrad)" stroke="#C59B27" strokeWidth="1.1" />
        <rect x="12" y="146" width="52" height="110" fill="url(#baliNavyGrad)" stroke="#C59B27" strokeWidth="1.2" />
        <rect x="20" y="158" width="34" height="86" stroke="#C59B27" strokeWidth="0.9" fill="none" />
        {/* Kisi-kisi kaca modern Bali */}
        <line x1="37" y1="158" x2="37" y2="244" stroke="#C59B27" strokeWidth="0.8" />
        <line x1="20" y1="186" x2="54" y2="186" stroke="#C59B27" strokeWidth="0.8" />
        <line x1="20" y1="215" x2="54" y2="215" stroke="#C59B27" strokeWidth="0.8" />

        {/* Sabuk Ornamen Patra Bali */}
        <path d="M12 262 L78 262 L66 280 L12 280 Z" fill="url(#baliGoldGrad)" stroke="#C59B27" strokeWidth="1.2" />
        <path
          d="M78 262 C98 262, 105 246, 92 236 C84 245, 76 250, 64 252"
          stroke="#C59B27"
          strokeWidth="1.4"
          fill="none"
        />
      </g>

      {/* Ukiran Sulur Patra Punggel Tengah */}
      <g opacity="0.65" transform="translate(12, 310)">
        <path
          d="M0 0 C35 10, 55 45, 32 75 C18 92, 5 80, 16 64 C26 50, 42 58, 35 74"
          stroke="#C59B27"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 95 C42 105, 62 140, 36 172 C20 190, 6 176, 18 160 C28 146, 44 154, 38 170"
          stroke="#C59B27"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="26" cy="40" r="3.5" fill="#D4AF37" />
        <circle cx="28" cy="135" r="3.5" fill="#D4AF37" />
      </g>

      {/* Fondasi Umpak Candi Bentar (Bagian Bawah) */}
      <g opacity="0.8" transform="translate(0, 520)">
        <path d="M12 40 L68 40 L82 60 L12 60 Z" fill="url(#baliNavyGrad)" stroke="#C59B27" strokeWidth="1.2" />
        <rect x="12" y="64" width="58" height="90" fill="url(#baliNavyGrad)" stroke="#C59B27" strokeWidth="1.2" />
        <rect x="22" y="76" width="38" height="66" stroke="#C59B27" strokeWidth="0.9" fill="none" />
        <path d="M12 158 L84 158 L98 182 L12 182 Z" fill="url(#baliGoldGrad)" stroke="#C59B27" strokeWidth="1.2" />
        <path d="M12 186 L108 186 L122 215 L12 215 Z" fill="url(#baliNavyGrad)" stroke="#C59B27" strokeWidth="1.2" />
        <path
          d="M98 182 C116 182, 126 168, 114 156 C104 166, 96 170, 84 158"
          stroke="#C59B27"
          strokeWidth="1.5"
          fill="none"
        />
      </g>
    </svg>
  );
}

export function HeaderBaliSilhouette({ flip = false }) {
  return (
    <svg
      viewBox="0 0 220 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-full w-auto pointer-events-none select-none ${flip ? 'scale-x-[-1]' : ''}`}
    >
      {/* Siluet Candi Bentar & Meru Modern di Sudut Header */}
      <g opacity="0.32">
        <path d="M0 120 L0 18 L28 18 L22 8 L0 8 Z" fill="#C59B27" />
        <path d="M0 36 L44 36 L34 23 L0 23 Z" fill="#16233B" stroke="#C59B27" strokeWidth="1" />
        <path d="M0 56 L62 56 L50 41 L0 41 Z" fill="#C59B27" />
        <path d="M0 78 L80 78 L66 61 L0 61 Z" fill="#16233B" stroke="#C59B27" strokeWidth="1" />
        <path d="M0 120 L96 120 L84 83 L0 83 Z" fill="#C59B27" />
        {/* Menara Meru Kedua */}
        <path d="M105 120 L105 64 L148 64 L138 52 L112 52 Z" fill="#16233B" stroke="#C59B27" strokeWidth="0.9" />
        <path d="M105 84 L162 84 L150 70 L105 70 Z" fill="#C59B27" />
        <path d="M105 120 L178 120 L166 90 L105 90 Z" fill="#16233B" stroke="#C59B27" strokeWidth="0.9" />
        {/* Ukiran Melengkung Khas Bali */}
        <path
          d="M80 78 C98 78, 104 64, 93 56 C85 63, 78 66, 66 61"
          stroke="#B8860B"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M162 84 C180 84, 188 70, 176 62 C168 69, 160 72, 150 70"
          stroke="#B8860B"
          strokeWidth="1.5"
          fill="none"
        />
      </g>
    </svg>
  );
}

export default function BalineseOrnamentFrame() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden">
      {/* Latar Belakang Tekstur Transparan Batik Prada Emas */}
      <div className="absolute inset-0 bg-batik-gold opacity-100" />

      {/* Cahaya Ambient Lembut Emas di Sudut Atas */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-yellow-200/20 blur-3xl" />

      {/* Sisi Kiri: Ornamen Arsitektur Bali Modern (Candi Bentar & Meru) */}
      <div className="hidden lg:block fixed top-0 bottom-0 left-0 w-24 xl:w-32 pointer-events-none select-none z-10">
        <CandiBentarPillar flip={false} />
      </div>

      {/* Sisi Kanan: Ornamen Arsitektur Bali Modern (Candi Bentar & Meru) */}
      <div className="hidden lg:block fixed top-0 bottom-0 right-0 w-24 xl:w-32 pointer-events-none select-none z-10">
        <CandiBentarPillar flip={true} />
      </div>
    </div>
  );
}
