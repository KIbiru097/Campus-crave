import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CATS = ['All', 'Coffee', 'Pastries', 'Breakfast', 'Sandwiches', 'Salads', 'Desserts', 'Cold Drinks'];

export default function StickyNav({ activeCategory, onCategoryChange, searchQuery, onSearchChange, cartCount, onCartClick }) {
  const [shrunk, setShrunk] = useState(false);

  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      className={`qr-nav ${shrunk ? 'shrunk' : ''}`}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="qr-nav-inner">
        <span className="qr-nav-brand">☕ Sunny Corner</span>

        <div className="qr-nav-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Search menu..." value={searchQuery || ''} onChange={e => onSearchChange && onSearchChange(e.target.value)} />
        </div>

        <div className="qr-pills">
          {CATS.map(c => (
            <motion.button key={c} className={`qr-pill ${activeCategory === c ? 'on' : ''}`} onClick={() => onCategoryChange(c)} whileTap={{ scale: 0.92 }} layout>
              {c}
            </motion.button>
          ))}
        </div>

        <motion.button className="qr-nav-cart" onClick={onCartClick} whileTap={{ scale: 0.9 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartCount > 0 && <span className="cnt">{cartCount}</span>}
        </motion.button>
      </div>
    </motion.nav>
  );
}
