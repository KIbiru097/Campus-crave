import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SIZES = ['Small', 'Medium', 'Large'];
const MILKS = ['Whole Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk', 'Coconut', 'No Milk'];
const SUGAR = ['No Sugar', 'Less', 'Normal', 'Extra'];
const ICE = ['Hot', 'Warm', 'Light Ice', 'Regular Ice', 'Extra Ice'];
const SPICE = ['Mild', 'Medium', 'Spicy', 'Extra Hot'];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function ItemDetailSheet({ item, onClose, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('Medium');
  const [milk, setMilk] = useState('Whole Milk');
  const [sugar, setSugar] = useState('Normal');
  const [ice, setIce] = useState('Regular Ice');
  const [spice, setSpice] = useState(null);
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const isCoffee = item.category === 'Coffee' || item.category === 'Cold Drinks';
  const isFood = item.category === 'Sandwiches' || item.category === 'Breakfast';
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  const handleAdd = () => {
    onAddToCart({ id: item.id, quantity: qty, size: isCoffee ? size : undefined, milk: isCoffee ? milk : undefined, sugar: isCoffee ? sugar : undefined, ice: isCoffee ? ice : undefined, spice: isFood ? spice : undefined, notes });
    onClose();
  };

  return (
    <>
      <motion.div className="qr-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="qr-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }} drag="y" dragConstraints={{ top: 0 }} dragElastic={0.15} onDragEnd={(_, info) => { if (info.velocity.y > 180 || info.offset.y > 180) onClose(); }}>
        <div className="qr-handle" />

        <div className="qr-detail-img-wrap">
          <motion.img className="qr-detail-img" src={item.image} alt={item.name} initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} />
          <div className="qr-detail-img-grad" />
          {hasDiscount && (
            <motion.div style={{ position: 'absolute', top: 16, right: 16, padding: '6px 14px', background: 'rgba(239,68,68,0.9)', borderRadius: 9999, fontSize: 12, fontWeight: 700, color: '#FFF', backdropFilter: 'blur(8px)' }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              Save ${(item.originalPrice - item.price).toFixed(2)}
            </motion.div>
          )}
        </div>

        <motion.div className="qr-detail-body" variants={stagger} initial="hidden" animate="show">
          <motion.h2 className="qr-detail-name" variants={fade}>{item.name}</motion.h2>
          <motion.p className="qr-detail-desc" variants={fade}>{item.description}</motion.p>

          {item.tags?.length > 0 && (
            <motion.div className="qr-detail-tags" variants={fade}>
              {item.tags.map((t, i) => (
                <span key={i} className={`qr-tag ${(t.toLowerCase() === 'vegan' || t.toLowerCase() === 'plant-based') ? 'vg' : ''}`}>{t}</span>
              ))}
            </motion.div>
          )}

          <motion.div className="qr-detail-stats" variants={fade}>
            {item.rating && <span className="qr-detail-stat"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><strong>{item.rating}</strong></span>}
            {item.prepTime && <span className="qr-detail-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{item.prepTime}</span>}
            {item.calories && <span className="qr-detail-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6v6l4 2"/></svg>{item.calories} cal</span>}
            {item.spiceLevel && <span className="qr-detail-stat" style={{ color: '#EF4444' }}>{Array.from({ length: item.spiceLevel }, () => '🌶️').join('')}</span>}
          </motion.div>

          {item.nutrition && (
            <motion.div className="qr-detail-nutrition" variants={fade}>
              {Object.entries(item.nutrition).map(([k, v]) => (
                <div key={k} className="qr-nut-item"><div className="qr-nut-val">{v}</div><div className="qr-nut-lbl">{k}</div></div>
              ))}
            </motion.div>
          )}

          {item.ingredients?.length > 0 && (
            <motion.div className="qr-detail-ings" variants={fade}>
              <div className="qr-detail-ings-title">Ingredients</div>
              <div className="qr-detail-ings-list">
                {item.ingredients.map((ing, i) => <span key={i} className="qr-detail-ing">{ing}</span>)}
              </div>
            </motion.div>
          )}

          {item.allergens?.length > 0 && (
            <motion.div className="qr-detail-allergens" variants={fade}>
              {item.allergens.map((a, i) => (
                <span key={i} className="qr-allergen">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {a}
                </span>
              ))}
            </motion.div>
          )}

          {isCoffee && (
            <>
              <motion.div className="qr-detail-custom" variants={fade}>
                <div className="qr-detail-label">Size</div>
                <div className="qr-detail-opts">{SIZES.map(s => <motion.button key={s} className={`qr-detail-opt ${size === s ? 'sel' : ''}`} onClick={() => setSize(s)} whileTap={{ scale: 0.94 }}>{s}</motion.button>)}</div>
              </motion.div>
              <motion.div className="qr-detail-custom" variants={fade}>
                <div className="qr-detail-label">Milk</div>
                <div className="qr-detail-opts">{MILKS.map(m => <motion.button key={m} className={`qr-detail-opt ${milk === m ? 'sel' : ''}`} onClick={() => setMilk(m)} whileTap={{ scale: 0.94 }}>{m}</motion.button>)}</div>
              </motion.div>
              <motion.div className="qr-detail-custom" variants={fade}>
                <div className="qr-detail-label">Sugar</div>
                <div className="qr-detail-opts">{SUGAR.map(s => <motion.button key={s} className={`qr-detail-opt ${sugar === s ? 'sel' : ''}`} onClick={() => setSugar(s)} whileTap={{ scale: 0.94 }}>{s}</motion.button>)}</div>
              </motion.div>
              <motion.div className="qr-detail-custom" variants={fade}>
                <div className="qr-detail-label">Temperature</div>
                <div className="qr-detail-opts">{ICE.map(i => <motion.button key={i} className={`qr-detail-opt ${ice === i ? 'sel' : ''}`} onClick={() => setIce(i)} whileTap={{ scale: 0.94 }}>{i}</motion.button>)}</div>
              </motion.div>
            </>
          )}

          {isFood && (
            <motion.div className="qr-detail-custom" variants={fade}>
              <div className="qr-detail-label">Spice Level</div>
              <div className="qr-detail-opts">{SPICE.map(s => <motion.button key={s} className={`qr-detail-opt ${spice === s ? 'sel' : ''}`} onClick={() => setSpice(s)} whileTap={{ scale: 0.94 }}>{s}</motion.button>)}</div>
            </motion.div>
          )}

          <motion.div className="qr-detail-custom" variants={fade}>
            <div className="qr-detail-label">Special Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any allergies or requests..." style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-xs)', color: 'var(--qr-text)', fontFamily: 'var(--font-body)', fontSize: '14px', resize: 'vertical', minHeight: '56px', outline: 'none', transition: 'border-color .2s, box-shadow .2s' }} onFocus={e => { e.target.style.borderColor = 'rgba(217,119,6,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(217,119,6,0.06)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none'; }} />
          </motion.div>

          <motion.div className="qr-detail-stepper" variants={fade}>
            <motion.button onClick={() => setQty(Math.max(1, qty - 1))} whileTap={{ scale: 0.82 }}>−</motion.button>
            <motion.span className="cnt" key={qty} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400 }}>{qty}</motion.span>
            <motion.button onClick={() => setQty(qty + 1)} whileTap={{ scale: 0.82 }}>+</motion.button>
          </motion.div>

          <motion.button className="qr-detail-add" onClick={handleAdd} whileTap={{ scale: 0.97 }} whileHover={{ y: -2 }} variants={fade}>
            Add to Order — ${(item.price * qty).toFixed(2)}
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
}
