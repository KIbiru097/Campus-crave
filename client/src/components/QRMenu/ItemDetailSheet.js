import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZES = ['Small', 'Medium', 'Large'];
const MILKS = ['Whole Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk', 'No Milk'];
const SPICE_LEVELS = ['Mild', 'Medium', 'Spicy', 'Extra Hot'];

export default function ItemDetailSheet({ item, onClose, onAddToCart, cartQty }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('Medium');
  const [milk, setMilk] = useState('Whole Milk');
  const [spice, setSpice] = useState(null);

  if (!item) return null;

  const isCoffee = item.category === 'Coffee' || item.category === 'Cold Drinks';
  const isSpicy = item.category === 'Sandwiches' || item.category === 'Breakfast';
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const unitPrice = item.price;
  const totalPrice = unitPrice * qty;

  const handleAdd = () => {
    onAddToCart({
      id: item.id,
      quantity: qty,
      size: isCoffee ? size : undefined,
      milk: isCoffee ? milk : undefined,
      spice: isSpicy ? spice : undefined,
    });
    onClose();
  };

  return (
    <>
      <motion.div
        className="qr-sheet-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="qr-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.velocity.y > 200 || info.offset.y > 200) {
            onClose();
          }
        }}
      >
        <div className="qr-sheet-handle" />

        <img className="qr-detail-img" src={item.image} alt={item.name} />

        <div className="qr-detail-body">
          <h2 className="qr-detail-name">{item.name}</h2>
          <p className="qr-detail-desc">{item.description}</p>

          {item.tags && item.tags.length > 0 && (
            <div className="qr-detail-tags">
              {item.tags.map((tag, i) => (
                <span key={i} className={`qr-card-tag ${tag.toLowerCase() === 'vegan' || tag.toLowerCase() === 'plant-based' ? 'vegan-tag' : ''}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="qr-card-meta" style={{ marginBottom: 20 }}>
            {item.rating && (
              <span className="qr-card-rating">★ {item.rating}</span>
            )}
            {item.prepTime && (
              <span className="qr-card-time">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {item.prepTime}
              </span>
            )}
            {item.calories && (
              <span className="qr-card-cal">{item.calories} cal</span>
            )}
          </div>

          {item.allergens && item.allergens.length > 0 && (
            <div className="qr-detail-allergens">
              {item.allergens.map((a, i) => (
                <span key={i} className="qr-detail-allergen">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {a}
                </span>
              ))}
            </div>
          )}

          {isCoffee && (
            <>
              <div className="qr-detail-custom">
                <div className="qr-detail-custom-label">Size</div>
                <div className="qr-detail-options">
                  {SIZES.map(s => (
                    <button key={s} className={`qr-detail-option ${size === s ? 'selected' : ''}`} onClick={() => setSize(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="qr-detail-custom">
                <div className="qr-detail-custom-label">Milk</div>
                <div className="qr-detail-options">
                  {MILKS.map(m => (
                    <button key={m} className={`qr-detail-option ${milk === m ? 'selected' : ''}`} onClick={() => setMilk(m)}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {isSpicy && (
            <div className="qr-detail-custom">
              <div className="qr-detail-custom-label">Spice Level</div>
              <div className="qr-detail-options">
                {SPICE_LEVELS.map(s => (
                  <button key={s} className={`qr-detail-option ${spice === s ? 'selected' : ''}`} onClick={() => setSpice(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="qr-detail-stepper">
            <button className="qr-stepper-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span className="qr-stepper-count">{qty}</span>
            <button className="qr-stepper-btn" onClick={() => setQty(qty + 1)}>+</button>
          </div>

          <button className="qr-detail-add-btn" onClick={handleAdd}>
            Add to Order — ${totalPrice.toFixed(2)}
          </button>
        </div>
      </motion.div>
    </>
  );
}
