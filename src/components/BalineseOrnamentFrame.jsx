import React from 'react';

// ============================================================================
// ORNAMEN UKIRAN BALI KUNO (PATRA PUNGGEL, KARANG BUNGA, & SULUR PADMA KLASIK)
// Menghiasi sisi kiri dan kanan tampilan web serta sudut header & sidebar
// ============================================================================

function ClassicalBalineseCarvingPillar({ flip = false }) {
  return (
    <svg
      viewBox="0 0 120 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full ${flip ? 'scale-x-[-1]' : ''}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="antiqueGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E6C35C" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#B8860B" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#7A5605" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="antiqueFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#16233B" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#C59B27" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#E6C35C" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Bingkai Tiang Ukiran Kuno */}
      <rect x="0" y="0" width="14" height="900" fill="url(#antiqueFill)" />
      <line x1="14" y1="0" x2="14" y2="900" stroke="url(#antiqueGold)" strokeWidth="2" />
      <line x1="21" y1="0" x2="21" y2="900" stroke="url(#antiqueGold)" strokeWidth="0.9" strokeDasharray="4 4" />

      {/* Deretan Gelung Ukiran Bali Kuno (Patra Punggel & Karang Sari) Berulang Vertikal */}
      {[0, 180, 360, 540, 720].map((offsetY) => (
        <g key={offsetY} transform={`translate(14, ${offsetY})`} opacity="0.88">
          {/* Mahkota Karang Daun & Kelopak Padma Kuno */}
          <path
            d="M0 15 C28 12, 54 26, 62 52 C68 72, 50 92, 32 86 C18 81, 14 64, 26 55 C36 48, 48 58, 42 70"
            stroke="url(#antiqueGold)"
            strokeWidth="2.2"
            fill="url(#antiqueFill)"
          />
          <path
            d="M0 26 C22 24, 42 34, 47 52 C51 65, 38 77, 26 72"
            stroke="url(#antiqueGold)"
            strokeWidth="1.3"
            fill="none"
          />

          {/* Lidah Api / Daun Ukiran Patra Punggel */}
          <path
            d="M44 26 C64 18, 86 24, 94 42 C78 40, 66 44, 58 54"
            stroke="url(#antiqueGold)"
            strokeWidth="1.6"
            fill="url(#antiqueFill)"
          />
          <path
            d="M58 58 C78 56, 96 66, 102 84 C84 80, 70 82, 54 90"
            stroke="url(#antiqueGold)"
            strokeWidth="1.6"
            fill="url(#antiqueFill)"
          />

          {/* Sulur Melingkar Bawah (Simbar & Patra Sari) */}
          <path
            d="M0 95 C34 92, 68 110, 74 138 C78 158, 56 174, 36 166 C20 160, 16 142, 28 132 C38 124, 52 134, 45 148"
            stroke="url(#antiqueGold)"
            strokeWidth="2.2"
            fill="url(#antiqueFill)"
          />
          <path
            d="M52 106 C72 102, 88 112, 92 128 C76 125, 64 128, 54 138"
            stroke="url(#antiqueGold)"
            strokeWidth="1.4"
            fill="url(#antiqueFill)"
          />

          {/* Inti Bunga Mas (Mutiara Ukiran) */}
          <circle cx="34" cy="64" r="4" fill="#D4AF37" fillOpacity="0.7" />
          <circle cx="37" cy="144" r="4" fill="#D4AF37" fillOpacity="0.7" />
          <circle cx="7" cy="90" r="3" fill="#B8860B" fillOpacity="0.65" />
          <path d="M0 84 L16 90 L0 96 Z" fill="#D4AF37" fillOpacity="0.55" />
        </g>
      ))}
    </svg>
  );
}

export function HeaderBaliCarvingCorner({ flip = false }) {
  return (
    <svg
      viewBox="0 0 240 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-full w-auto pointer-events-none select-none ${flip ? 'scale-x-[-1]' : ''}`}
    >
      {/* Ukiran Sudut Karang Bunga & Patra Punggel Bali Kuno */}
      <g opacity="0.42">
        <path
          d="M0 0 L130 0 C105 14, 92 26, 72 28 C48 30, 32 18, 42 10 C50 4, 64 12, 58 22"
          stroke="#9A6F0A"
          strokeWidth="1.8"
          fill="#D4AF37"
          fillOpacity="0.18"
        />
        <path
          d="M0 0 L0 110 C12 86, 28 74, 34 52 C40 28, 22 14, 12 24 C4 32, 14 48, 24 42"
          stroke="#9A6F0A"
          strokeWidth="1.8"
          fill="#16233B"
          fillOpacity="0.14"
        />
        <path
          d="M28 48 C58 44, 88 58, 96 82 C102 98, 82 110, 66 102 C54 96, 52 80, 64 74 C74 68, 84 78, 78 88"
          stroke="#9A6F0A"
          strokeWidth="1.8"
          fill="#D4AF37"
          fillOpacity="0.16"
        />
        <path
          d="M84 22 C116 14, 148 22, 162 44 C140 42, 122 48, 108 62"
          stroke="#9A6F0A"
          strokeWidth="1.5"
          fill="#D4AF37"
          fillOpacity="0.14"
        />
        <path
          d="M100 66 C132 62, 162 72, 174 94 C150 90, 130 94, 110 106"
          stroke="#9A6F0A"
          strokeWidth="1.4"
          fill="none"
        />
        <circle cx="70" cy="84" r="4" fill="#B8860B" />
        <circle cx="48" cy="18" r="3.5" fill="#B8860B" />
        <circle cx="18" cy="34" r="3.5" fill="#B8860B" />
      </g>
    </svg>
  );
}

export function SidebarCarvingDivider() {
  return (
    <svg viewBox="0 0 240 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-5">
      <line x1="8" y1="12" x2="88" y2="12" stroke="#D4AF37" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="152" y1="12" x2="232" y2="12" stroke="#D4AF37" strokeOpacity="0.5" strokeWidth="1" />
      <path
        d="M120 3 L130 12 L120 21 L110 12 Z"
        fill="#D4AF37"
        fillOpacity="0.35"
        stroke="#E6C35C"
        strokeWidth="1.2"
      />
      <path
        d="M106 12 C98 5, 88 6, 84 12 C88 18, 98 19, 106 12 Z"
        stroke="#E6C35C"
        strokeOpacity="0.75"
        strokeWidth="1.1"
        fill="none"
      />
      <path
        d="M134 12 C142 5, 152 6, 156 12 C152 18, 142 19, 134 12 Z"
        stroke="#E6C35C"
        strokeOpacity="0.75"
        strokeWidth="1.1"
        fill="none"
      />
      <circle cx="120" cy="12" r="2.5" fill="#FDE68A" />
    </svg>
  );
}

export default function BalineseOrnamentFrame() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden">
      {/* Latar Belakang Tekstur Transparan Batik Prada Emas */}
      <div className="absolute inset-0 bg-batik-gold opacity-100" />

      {/* Cahaya Ambient Lembut Emas */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-yellow-200/20 blur-3xl" />

      {/* Sisi Kiri: Ornamen Ukiran Bali Kuno (Patra Punggel & Karang Bunga) */}
      <div className="hidden md:block fixed top-0 bottom-0 left-0 w-20 lg:w-28 pointer-events-none select-none z-10">
        <ClassicalBalineseCarvingPillar flip={false} />
      </div>

      {/* Sisi Kanan: Ornamen Ukiran Bali Kuno (Patra Punggel & Karang Bunga) */}
      <div className="hidden md:block fixed top-0 bottom-0 right-0 w-20 lg:w-28 pointer-events-none select-none z-10">
        <ClassicalBalineseCarvingPillar flip={true} />
      </div>
    </div>
  );
}
