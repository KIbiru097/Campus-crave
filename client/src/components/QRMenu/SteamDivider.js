import React from 'react';

export default function SteamDivider() {
  return (
    <div className="qr-steam-divider">
      <svg width="200" height="30" viewBox="0 0 200 30" fill="none">
        <path
          d="M0 15 Q25 5, 50 15 T100 15 T150 15 T200 15"
          stroke="url(#sd-grad)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M10 20 Q35 10, 60 20 T110 20 T160 20"
          stroke="url(#sd-grad)"
          strokeWidth="1"
          fill="none"
          opacity="0.25"
        />
        <defs>
          <linearGradient id="sd-grad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D97706" stopOpacity="0" />
            <stop offset="0.5" stopColor="#D97706" stopOpacity="0.6" />
            <stop offset="1" stopColor="#D97706" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
