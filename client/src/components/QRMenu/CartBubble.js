import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartBubble({ items, onUpdateQty, onRemove, onCheckout, menuItems, openCart, onOpenCartChange }) {
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => { const m = menuItems.find(x => x.id === i.id); return s + (m ? m.price * i.quantity : 0); }, 0);
  const tax = total * 0.08;

  return (
    <>
      <AnimatePresence>
        {openCart && (
          <>
            <motion.div className="qr-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onOpenCartChange(false)} />
            <motion.div className="qr-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }} drag="y" dragConstraints={{ top: 0 }} dragElastic={0.15} onDragEnd={(_, info) => { if (info.velocity.y > 180 || info.offset.y > 180) onOpenCartChange(false); }}>
              <div className="qr-handle" />
              <div className="qr-sheet-head">
                <div>
                  <h2 className="qr-sheet-title">Your Order</h2>
                  <p style={{ fontSize: 12, color: 'var(--qr-dim)', marginTop: 2 }}>{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
                </div>
                <motion.button className="qr-sheet-x" onClick={() => onOpenCartChange(false)} whileTap={{ scale: 0.9 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </motion.button>
              </div>

              {items.length === 0 ? (
                <div className="qr-cart-empty">
                  <motion.div className="icon" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>🛒</motion.div>
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>Your order is empty</motion.p>
                  <p className="sub">Browse the menu and add items</p>
                </div>
              ) : (
                <>
                  <div className="qr-cart-items">
                    <AnimatePresence>
                      {items.map((ci, idx) => {
                        const m = menuItems.find(x => x.id === ci.id);
                        if (!m) return null;
                        return (
                          <motion.div key={ci.id} className="qr-cart-row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, height: 0, paddingTop: 0, paddingBottom: 0 }} transition={{ delay: idx * 0.04 }}>
                            <img src={m.image} alt={m.name} />
                            <div className="info">
                              <div className="name">{m.name}</div>
                              <div className="meta">{ci.size && `${ci.size} · `}{ci.milk && `${ci.milk} · `}${m.price.toFixed(2)} each</div>
                            </div>
                            <div className="ctrls">
                              <div className="qr-cart-qty">
                                <motion.button whileTap={{ scale: 0.8 }} onClick={() => onUpdateQty(ci.id, -1)}>−</motion.button>
                                <motion.span key={ci.quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>{ci.quantity}</motion.span>
                                <motion.button whileTap={{ scale: 0.8 }} onClick={() => onUpdateQty(ci.id, 1)}>+</motion.button>
                              </div>
                              <span className="amt">${(m.price * ci.quantity).toFixed(2)}</span>
                            </div>
                            <motion.button className="rm" onClick={() => onRemove(ci.id)} whileTap={{ scale: 0.85 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </motion.button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  <div className="qr-cart-foot">
                    <div className="qr-cart-sum">
                      <div className="qr-cart-row-sum"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                      <div className="qr-cart-row-sum"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                      <div className="qr-cart-row-sum total"><span>Total</span><span>${(total + tax).toFixed(2)}</span></div>
                    </div>
                    <motion.button className="qr-checkout-btn" onClick={() => { onOpenCartChange(false); onCheckout(); }} whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }}>Send to Kitchen — ${(total + tax).toFixed(2)}</motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="qr-cart-pos" style={{ display: totalItems > 0 ? 'block' : 'none' }}>
        <motion.button className="qr-cart-orb" onClick={() => onOpenCartChange(true)} whileTap={{ scale: 0.88 }} animate={totalItems > 0 ? { scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.35 }} key={totalItems}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
          <motion.span className="badge" key={totalItems} initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>{totalItems}</motion.span>
          <motion.span className="price-pill" key={`t-${total.toFixed(2)}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>${total.toFixed(2)}</motion.span>
        </motion.button>
      </div>
    </>
  );
}
