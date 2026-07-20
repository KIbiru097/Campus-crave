import React from 'react';

export default function SteamDivider() {
  return (
    <div className="qr-divider">
      <svg width="240" height="32" viewBox="0 0 240 32" fill="none">
        <path d="M0 16 Q30 6,60 16 T120 14 T180 16 T240 14" stroke="url(#s1)" strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M10 22 Q40 12,70 22 T130 20 T190 22" stroke="url(#s1)" strokeWidth="0.8" fill="none" opacity="0.25" />
        <path d="M20 10 Q50 18,80 10 T140 12 T200 10" stroke="url(#s2)" strokeWidth="0.6" fill="none" opacity="0.15" />
        <circle cx="120" cy="16" r="2" fill="#D97706" opacity="0.3" />
        <circle cx="120" cy="16" r="1" fill="#F59E0B" opacity="0.5" />
        <defs>
          <linearGradient id="s1" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D97706" stopOpacity="0" />
            <stop offset="0.3" stopColor="#D97706" stopOpacity="0.8" />
            <stop offset="0.5" stopColor="#F59E0B" stopOpacity="1" />
            <stop offset="0.7" stopColor="#D97706" stopOpacity="0.8" />
            <stop offset="1" stopColor="#D97706" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="s2" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#84CC16" stopOpacity="0" />
            <stop offset="0.5" stopColor="#84CC16" stopOpacity="0.6" />
            <stop offset="1" stopColor="#84CC16" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
