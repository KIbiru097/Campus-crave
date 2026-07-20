import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const MOSAIC = [
  { img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=600&fit=crop&q=80', alt: 'Latte art' },
  { img: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400&h=400&fit=crop&q=80', alt: 'Croissant' },
  { img: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=400&fit=crop&q=80', alt: 'Avocado toast' },
];

const BEANS = [
  { x: '8%', y: '12%', s: 28, r: 25, d: 0 },
  { x: '88%', y: '10%', s: 22, r: -15, d: 2 },
  { x: '78%', y: '62%', s: 18, r: 40, d: 4 },
  { x: '14%', y: '68%', s: 24, r: -30, d: 1 },
  { x: '52%', y: '6%', s: 16, r: 60, d: 3 },
];

const STEAM = [
  { x: '18%', y: '8%', s: 26, c: '#D97706', o: 0.15, d: 0 },
  { x: '80%', y: '16%', s: 20, c: '#F59E0B', o: 0.1, d: -2 },
  { x: '58%', y: '4%', s: 16, c: '#84CC16', o: 0.07, d: -4 },
];

export default function HeroSection({ tableNumber, onBrowse, onStartOrder }) {
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleScroll = () => {
      const y = window.scrollY;
      const beans = el.querySelectorAll('.qr-bean');
      beans.forEach((b, i) => {
        b.style.transform = `translateY(${-y * (0.15 + i * 0.05)}px) rotate(${y * (0.02 + i * 0.01)}deg)`;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="qr-hero" ref={heroRef}>
      {/* Floating coffee beans — parallax */}
      {BEANS.map((b, i) => (
        <div key={i} className="qr-bean" style={{ left: b.x, top: b.y, animationDelay: `${b.d}s` }}>
          <svg width={b.s} height={b.s} viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${b.r}deg)` }}>
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

      {/* Mosaic */}
      <motion.div className="qr-mosaic" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}>
        {MOSAIC.map((m, i) => (
          <motion.div key={i} className="qr-mosaic-item" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }} whileHover={{ scale: 1.04 }}>
            <img src={m.img} alt={m.alt} loading="eager" />
          </motion.div>
        ))}
      </motion.div>

      {/* Logo */}
      <motion.div className="qr-logo" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}>
        ☕
      </motion.div>

      {/* Title */}
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}>
        Sunny Corner Cafe
      </motion.h1>

      {/* Tagline */}
      <motion.p className="tagline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        Slow mornings. Deep roasts. Fresh pastries.
      </motion.p>

      {/* Meta badges */}
      <motion.div className="qr-hero-meta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
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
      <motion.div className="qr-hero-ctas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <motion.button className="btn-primary" onClick={onStartOrder} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Start Order</motion.button>
        <motion.button className="btn-ghost" onClick={onBrowse} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Browse Menu</motion.button>
      </motion.div>

      {/* Wave */}
      <div className="qr-wave">
        <svg width="100%" height="24" viewBox="0 0 400 24" preserveAspectRatio="none">
          <path d="M0 24 Q60 4,120 14 T240 10 T360 12 T400 8 V24 Z" fill="var(--qr-bg)" opacity="0.6" />
          <path d="M0 24 Q80 8,160 16 T320 12 T400 14 V24 Z" fill="var(--qr-bg)" opacity="0.3" />
        </svg>
      </div>
    </section>
  );
}
