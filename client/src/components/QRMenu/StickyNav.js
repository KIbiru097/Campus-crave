import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATS = ['All', 'Coffee', 'Pastries', 'Breakfast', 'Sandwiches', 'Salads', 'Desserts', 'Cold Drinks'];

export default function StickyNav({ activeCategory, onCategoryChange, searchQuery, onSearchChange, cartCount, onCartClick, menuItems }) {
  const [shrunk, setShrunk] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const searchInputRef = useRef(null);
  const spotlightInputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (spotlightOpen && spotlightInputRef.current) {
      spotlightInputRef.current.focus();
    }
  }, [spotlightOpen]);

  useEffect(() => {
    if (!spotlightOpen) {
      setSpotlightQuery('');
    }
  }, [spotlightOpen]);

  const spotlightResults = useMemo(() => {
    if (!spotlightQuery.trim() || !menuItems) return [];
    const q = spotlightQuery.toLowerCase();
    return menuItems.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.tags?.some(t => t.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [spotlightQuery, menuItems]);

  return (
    <>
      <motion.nav
        className={`qr-nav ${shrunk ? 'shrunk' : ''}`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="qr-nav-inner">
          <span className="qr-nav-brand">☕ Sunny Corner</span>

          <div className="qr-nav-search" onClick={() => setSpotlightOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" placeholder="Search menu..." value={searchQuery || ''} onChange={e => onSearchChange && onSearchChange(e.target.value)} readOnly />
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

      <AnimatePresence>
        {spotlightOpen && (
          <motion.div className="qr-spotlight" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div className="qr-spotlight-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSpotlightOpen(false)} />
            <motion.div className="qr-spotlight-content" initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ type: 'spring', damping: 30, stiffness: 350 }}>
              <div className="qr-spotlight-input-wrap">
                <svg className="qr-spotlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input ref={spotlightInputRef} className="qr-spotlight-input" type="text" placeholder="Search coffee, pastries, drinks..." value={spotlightQuery} onChange={e => setSpotlightQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setSpotlightOpen(false); }} />
                <button className="qr-spotlight-close" onClick={() => setSpotlightOpen(false)}>✕</button>
              </div>

              <div className="qr-spotlight-results">
                {spotlightQuery.trim() && spotlightResults.length === 0 && (
                  <div className="qr-spotlight-empty">No items found for "{spotlightQuery}"</div>
                )}
                {spotlightResults.map((item, idx) => (
                  <motion.div key={item.id} className="qr-spotlight-item" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} onClick={() => { onSearchChange(item.name); setSpotlightOpen(false); }}>
                    <img src={item.image} alt={item.name} loading="lazy" />
                    <div className="info">
                      <div className="name">{item.name}</div>
                      <div className="desc">{item.description}</div>
                    </div>
                    <div className="price">${item.price.toFixed(2)}</div>
                  </motion.div>
                ))}
                {!spotlightQuery.trim() && (
                  <div style={{ padding: '8px 0' }}>
                    {CATS.filter(c => c !== 'All').slice(0, 6).map((c, idx) => (
                      <motion.div key={c} className="qr-spotlight-item" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} onClick={() => { onCategoryChange(c); setSpotlightOpen(false); }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                          {c === 'Coffee' ? '☕' : c === 'Pastries' ? '🥐' : c === 'Breakfast' ? '🍳' : c === 'Sandwiches' ? '🥪' : c === 'Salads' ? '🥗' : c === 'Desserts' ? '🍫' : '🧊'}
                        </div>
                        <div className="info">
                          <div className="name">{c}</div>
                          <div className="desc">Browse {c.toLowerCase()}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
