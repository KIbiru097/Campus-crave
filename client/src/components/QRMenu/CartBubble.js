import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartBubble({ items, onUpdateQty, onRemove, onCheckout, menuItems }) {
  const [expanded, setExpanded] = useState(false);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const menuItem = menuItems.find(m => m.id === i.id);
    return sum + (menuItem ? menuItem.price * i.quantity : 0);
  }, 0);

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              className="qr-sheet-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
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
                  setExpanded(false);
                }
              }}
            >
              <div className="qr-sheet-handle" />
              <div className="qr-sheet-header">
                <h2 className="qr-sheet-title">Your Order</h2>
                <button className="qr-sheet-close" onClick={() => setExpanded(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {items.length === 0 ? (
                <div className="qr-cart-empty">
                  <div className="qr-cart-empty-icon">🛒</div>
                  <p className="qr-cart-empty-text">Your order is empty</p>
                </div>
              ) : (
                <>
                  <div className="qr-cart-items">
                    {items.map((cartItem) => {
                      const menuItem = menuItems.find(m => m.id === cartItem.id);
                      if (!menuItem) return null;
                      return (
                        <div key={cartItem.id} className="qr-cart-item">
                          <img className="qr-cart-item-img" src={menuItem.image} alt={menuItem.name} />
                          <div className="qr-cart-item-info">
                            <div className="qr-cart-item-name">{menuItem.name}</div>
                            <div className="qr-cart-item-meta">
                              {cartItem.size && `${cartItem.size} · `}
                              ${menuItem.price.toFixed(2)} each
                            </div>
                          </div>
                          <div className="qr-cart-item-controls">
                            <div className="qr-cart-item-qty">
                              <button onClick={() => onUpdateQty(cartItem.id, -1)}>−</button>
                              <span>{cartItem.quantity}</span>
                              <button onClick={() => onUpdateQty(cartItem.id, 1)}>+</button>
                            </div>
                            <span className="qr-cart-item-price">
                              ${(menuItem.price * cartItem.quantity).toFixed(2)}
                            </span>
                          </div>
                          <button className="qr-cart-item-remove" onClick={() => onRemove(cartItem.id)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="qr-cart-footer">
                    <div className="qr-cart-summary">
                      <div className="qr-cart-summary-row">
                        <span>Subtotal</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="qr-cart-summary-row">
                        <span>Tax (8%)</span>
                        <span>${(totalPrice * 0.08).toFixed(2)}</span>
                      </div>
                      <div className="qr-cart-summary-row total">
                        <span>Total</span>
                        <span>${(totalPrice * 1.08).toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      className="qr-cart-checkout-btn"
                      onClick={() => { setExpanded(false); onCheckout(); }}
                    >
                      Send to Kitchen — ${(totalPrice * 1.08).toFixed(2)}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="qr-cart-bubble" style={{ display: totalItems > 0 ? 'block' : 'none' }}>
        <motion.button
          className="qr-cart-btn"
          onClick={() => setExpanded(true)}
          whileTap={{ scale: 0.9 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3 }}
          key={totalItems}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <motion.span
            className="qr-cart-count"
            key={totalItems}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {totalItems}
          </motion.span>
          <span className="qr-cart-total">${totalPrice.toFixed(2)}</span>
        </motion.button>
      </div>
    </>
  );
}
