import React from 'react';
import { motion } from 'framer-motion';

const SteamSVG = ({ width = 200, height = 30 }) => (
  <svg width={width} height={height} viewBox="0 0 200 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 15 Q25 5, 50 15 T100 15 T150 15 T200 15"
      stroke="url(#steam-grad)"
      strokeWidth="1.5"
      fill="none"
      opacity="0.6"
    />
    <path
      d="M10 20 Q35 10, 60 20 T110 20 T160 20"
      stroke="url(#steam-grad)"
      strokeWidth="1"
      fill="none"
      opacity="0.3"
    />
    <defs>
      <linearGradient id="steam-grad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D97706" stopOpacity="0" />
        <stop offset="0.5" stopColor="#D97706" stopOpacity="0.6" />
        <stop offset="1" stopColor="#D97706" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

export default function HeroSection({ tableNumber, onBrowse, onStartOrder }) {
  return (
    <section className="qr-hero">
      <div className="qr-steam-floater" style={{ top: '10%', left: '10%' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 8 8 8 12C8 14.2 9.8 16 12 16C14.2 16 16 14.2 16 12C16 8 12 2 12 2Z" fill="#D97706" opacity="0.3" />
        </svg>
      </div>
      <div className="qr-steam-floater" style={{ top: '20%', right: '15%' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 8 8 8 12C8 14.2 9.8 16 12 16C14.2 16 16 14.2 16 12C16 8 12 2 12 2Z" fill="#F59E0B" opacity="0.2" />
        </svg>
      </div>
      <div className="qr-steam-floater" style={{ top: '5%', left: '60%' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 8 8 8 12C8 14.2 9.8 16 12 16C14.2 16 16 14.2 16 12C16 8 12 2 12 2Z" fill="#84CC16" opacity="0.15" />
        </svg>
      </div>

      <motion.div
        className="qr-hero-logo"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
      >
        ☕
      </motion.div>

      <motion.h1
        className="qr-hero-name"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Sunny Corner Cafe
      </motion.h1>

      <motion.p
        className="qr-hero-tagline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Slow mornings, deep roasts
      </motion.p>

      <motion.div
        className="qr-hero-meta"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <span className="qr-hero-table">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          Table {tableNumber || '12'}
        </span>
        <span className="qr-hero-wait">
          <span className="dot" />
          ~10 min
        </span>
      </motion.div>

      <motion.div
        className="qr-hero-ctas"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <button className="qr-btn-primary" onClick={onStartOrder}>
          Start Order
        </button>
        <button className="qr-btn-ghost" onClick={onBrowse}>
          Browse Menu
        </button>
      </motion.div>
    </section>
  );
}
