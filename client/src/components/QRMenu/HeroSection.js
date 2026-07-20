import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const MOSAIC = [
  { img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop&q=80', alt: 'Latte art' },
  { img: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=600&h=600&fit=crop&q=80', alt: 'Croissant' },
  { img: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600&h=600&fit=crop&q=80', alt: 'Avocado toast' },
  { img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=600&fit=crop&q=80', alt: 'Coffee pour' },
  { img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop&q=80', alt: 'Cafe interior' },
];

const BEANS = [
  { x: '6%', y: '15%', s: 36, r: 25, d: 0 },
  { x: '90%', y: '12%', s: 28, r: -15, d: 2 },
  { x: '82%', y: '65%', s: 24, r: 40, d: 4 },
  { x: '10%', y: '72%', s: 30, r: -30, d: 1 },
  { x: '55%', y: '5%', s: 20, r: 60, d: 3 },
  { x: '35%', y: '80%', s: 22, r: -45, d: 5 },
  { x: '72%', y: '30%', s: 18, r: 35, d: 2.5 },
];

const STEAM = [
  { x: '15%', y: '6%', s: 34, c: '#D97706', o: 0.2, d: 0 },
  { x: '82%', y: '18%', s: 28, c: '#F59E0B', o: 0.14, d: -2 },
  { x: '55%', y: '3%', s: 22, c: '#84CC16', o: 0.09, d: -4 },
  { x: '30%', y: '10%', s: 18, c: '#D97706', o: 0.1, d: -3 },
];

export default function HeroSection({ tableNumber, onBrowse, onStartOrder }) {
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [mosaicLoaded, setMosaicLoaded] = useState([false, false, false, false, false]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxBg = scrollY * 0.3;
  const parallaxContent = scrollY * 0.15;
  const fadeOut = Math.max(0, 1 - scrollY / 600);

  return (
    <section className="qr-hero" ref={heroRef}>
      {/* Layered aurora background */}
      <div className="qr-hero-bg" style={{ transform: `translateY(${parallaxBg}px)` }}>
        <div className="qr-hero-aurora a1" />
        <div className="qr-hero-aurora a2" />
        <div className="qr-hero-aurora a3" />
        <div className="qr-hero-aurora a4" />
        <div className="qr-hero-vignette" />
      </div>

      {/* Floating coffee beans */}
      {BEANS.map((b, i) => (
        <div key={i} className="qr-bean" style={{ left: b.x, top: b.y, animationDelay: `${b.d}s`, opacity: 0.07 + (i % 3) * 0.02 }}>
          <svg width={b.s} height={b.s} viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${b.r + scrollY * 0.02}deg)` }}>
            <ellipse cx="12" cy="12" rx="8" ry="5" fill="#D97706" opacity="0.6" transform={`rotate(${b.r} 12 12)`} />
            <path d="M12 7 Q10 12 12 17" stroke="#120D0A" strokeWidth="0.8" fill="none" opacity="0.4" />
          </svg>
        </div>
      ))}

      {/* Steam particles */}
      {STEAM.map((p, i) => (
        <div key={i} className="qr-steam" style={{ left: p.x, top: p.y, opacity: p.o, animationDelay: `${p.d}s` }}>
          <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none">
            <path d="M12 2C12 2 7 9 7 13C7 16 9.2 18 12 18C14.8 18 17 16 17 13C17 9 12 2 12 2Z" fill={p.c} opacity="0.5" />
          </svg>
        </div>
      ))}

      {/* Cinematic photo mosaic — large edge-to-edge */}
      <motion.div className="qr-hero-mosaic" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}>
        {MOSAIC.map((m, i) => (
          <motion.div
            key={i}
            className={`qr-hero-mosaic-item mosaic-${i}`}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: mosaicLoaded[i] ? 1 : 0, y: 0, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          >
            <img src={m.img} alt={m.alt} loading="eager" onLoad={() => setMosaicLoaded(prev => { const n = [...prev]; n[i] = true; return n; })} />
            <div className="qr-hero-mosaic-overlay" />
          </motion.div>
        ))}
      </motion.div>

      {/* Content */}
      <div className="qr-hero-content" style={{ transform: `translateY(${parallaxContent}px)`, opacity: fadeOut }}>
        {/* Logo */}
        <motion.div className="qr-logo" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 20 }}>
          ☕
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}>
          Sunny Corner<br />Cafe
        </motion.h1>

        {/* Tagline */}
        <motion.p className="tagline" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          Slow mornings.<br />Deep roasts.<br />Fresh pastries.
        </motion.p>

        {/* Meta badges */}
        <motion.div className="qr-hero-meta" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
          <span className="qr-badge tbl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            Table {tableNumber || '12'}
          </span>
          <span className="qr-badge wait">
            <span className="qr-dot" />
            ~8 min wait
          </span>
        </motion.div>

        {/* CTAs */}
        <motion.div className="qr-hero-ctas" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
          <motion.button className="btn-primary" onClick={onStartOrder} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
            Start Ordering
          </motion.button>
          <motion.button className="btn-ghost" onClick={onBrowse} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
            Browse Menu
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="qr-scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: fadeOut }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <div className="qr-scroll-line" />
        <span>Scroll to explore</span>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="qr-hero-bottom-fade" />
    </section>
  );
}
