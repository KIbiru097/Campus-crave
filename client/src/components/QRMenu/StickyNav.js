import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'Coffee', 'Pastries', 'Breakfast', 'Sandwiches', 'Salads', 'Desserts', 'Cold Drinks'];

export default function StickyNav({ activeCategory, onCategoryChange }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`qr-sticky-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="qr-nav-inner">
        <span className="qr-nav-logo">Sunny Corner</span>
        <div className="qr-pills-scroll">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              className={`qr-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat)}
              whileTap={{ scale: 0.92 }}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
}
