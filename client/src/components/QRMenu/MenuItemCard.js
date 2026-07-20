import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const SIZES = ['hero', 'wide', 'sm', 'tall', 'sm', 'featured', 'sm', 'wide'];

export default function MenuItemCard({ item, index, cartQty, onAdd, onRemove, onDetail, favorites, onToggleFav }) {
  const ref = useRef(null);
  const [justAdded, setJustAdded] = useState(false);
  const size = SIZES[index % SIZES.length];
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const isFav = favorites && favorites.has(item.id);

  const handleAdd = e => {
    e.stopPropagation();
    onAdd(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 400);
    // Fly-to-cart
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      const b = document.querySelector('.qr-cart-orb');
      if (b) {
        const br = b.getBoundingClientRect();
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;top:${r.top + r.height / 3}px;left:${r.left + r.width / 2}px;width:44px;height:44px;border-radius:50%;background:linear-gradient(145deg,#D97706,#F59E0B);z-index:9999;pointer-events:none;transition:all .65s cubic-bezier(.4,0,.2,1);box-shadow:0 6px 24px rgba(217,119,6,0.5);opacity:1;transform:scale(1)`;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
          el.style.top = `${br.top + br.height / 2 - 22}px`;
          el.style.left = `${br.left + br.width / 2 - 22}px`;
          el.style.opacity = '0';
          el.style.transform = 'scale(0.12)';
        });
        setTimeout(() => el.remove(), 750);
      }
    }
  };

  const handleRipple = e => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'qr-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const spice = item.spiceLevel ? Array.from({ length: item.spiceLevel }, (_, i) => <span key={i}>🌶️</span>) : null;

  return (
    <motion.div
      ref={ref}
      className={`qr-card ${size}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: (index % 4) * 0.06, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      onClick={e => { handleRipple(e); onDetail(item); }}
    >
      <div className="qr-card-img-wrap">
        <img className="qr-card-img" src={item.image} alt={item.name} loading="lazy" />

        {item.badge && (
          <span className={`qr-card-badge ${item.badge === 'Popular' ? 'pop' : item.badge === "Chef's Pick" ? 'chef' : item.badge === 'Vegan' ? 'vegan' : 'pop'}`}>
            {item.badge}
          </span>
        )}
        {hasDiscount && (
          <span className="qr-card-badge disc">−{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%</span>
        )}

        <motion.button className={`qr-card-fav ${isFav ? 'on' : ''}`} onClick={e => { e.stopPropagation(); onToggleFav && onToggleFav(item.id); }} whileTap={{ scale: 0.8 }}>
          <svg viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </motion.button>
      </div>

      <div className="qr-card-body">
        <h3 className="qr-card-name">{item.name}</h3>
        <p className="qr-card-desc">{item.description}</p>

        {item.tags?.length > 0 && (
          <div className="qr-card-tags">
            {item.tags.map((t, i) => (
              <span key={i} className={`qr-tag ${(t.toLowerCase() === 'vegan' || t.toLowerCase() === 'plant-based') ? 'vg' : ''}`}>{t}</span>
            ))}
          </div>
        )}

        <div className="qr-card-meta">
          {item.rating && <span className="qr-card-rating">★ {item.rating}</span>}
          {item.prepTime && (
            <span className="qr-card-time">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {item.prepTime}
            </span>
          )}
          {item.calories && <span className="qr-card-cal">{item.calories} cal</span>}
          {spice && <span className="qr-card-spice">{spice}</span>}
        </div>

        <div className="qr-card-foot">
          <div className="qr-card-price">
            ${item.price.toFixed(2)}
            {hasDiscount && <span className="old">${item.originalPrice.toFixed(2)}</span>}
          </div>
          <motion.div className="qr-stepper" animate={justAdded ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.3 }}>
            {cartQty > 0 ? (
              <>
                <button onClick={e => { e.stopPropagation(); onRemove(item.id); }}>−</button>
                <span className="n">{cartQty}</span>
                <button className="ap" onClick={handleAdd}>+</button>
              </>
            ) : (
              <motion.button className="ap" onClick={handleAdd} whileTap={{ scale: 0.85 }}>+</motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
