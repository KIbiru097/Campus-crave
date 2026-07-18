import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TIPS = [
  { label: '10%', value: 0.10 },
  { label: '15%', value: 0.15 },
  { label: '20%', value: 0.20 },
  { label: '25%', value: 0.25 },
  { label: 'None', value: 0 },
];

const STATUS_STEPS = [
  { key: 'received', label: 'Received', icon: '✓' },
  { key: 'preparing', label: 'Preparing', icon: '🔥' },
  { key: 'ready', label: 'Ready', icon: '✨' },
];

export default function CheckoutSheet({ items, menuItems, tableNumber, onClose }) {
  const [tip, setTip] = useState(0.15);
  const [submitted, setSubmitted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [note, setNote] = useState('');

  const subtotal = items.reduce((sum, i) => {
    const menuItem = menuItems.find(m => m.id === i.id);
    return sum + (menuItem ? menuItem.price * i.quantity : 0);
  }, 0);
  const tax = subtotal * 0.08;
  const tipAmount = subtotal * tip;
  const total = subtotal + tax + tipAmount;

  const handleSubmit = () => {
    setSubmitted(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < STATUS_STEPS.length) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
      }
    }, 3000);
  };

  if (submitted) {
    return (
      <>
        <motion.div className="qr-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
        <motion.div
          className="qr-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="qr-sheet-handle" />
          <div className="qr-order-status">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              style={{ fontSize: 48, marginBottom: 12 }}
            >
              🎉
            </motion.div>
            <h2 className="qr-sheet-title" style={{ marginBottom: 4 }}>Order Sent!</h2>
            <p style={{ color: 'var(--qr-text-muted)', fontSize: 14, marginBottom: 4 }}>
              Table {tableNumber} · {items.length} item{items.length > 1 ? 's' : ''}
            </p>
            <p style={{ color: 'var(--qr-text-muted)', fontSize: 13 }}>
              Your order is being prepared
            </p>

            <div className="qr-status-steps">
              {STATUS_STEPS.map((step, i) => (
                <div key={step.key} className="qr-status-step">
                  <div className={`qr-status-dot ${i < activeStep ? 'done' : i === activeStep ? 'active' : ''}`}>
                    {i < activeStep ? '✓' : step.icon}
                  </div>
                  <span className={`qr-status-label ${i === activeStep ? 'active' : ''}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <motion.div className="qr-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
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
          if (info.velocity.y > 200 || info.offset.y > 200) onClose();
        }}
      >
        <div className="qr-sheet-handle" />
        <div className="qr-sheet-header">
          <h2 className="qr-sheet-title">Checkout</h2>
          <button className="qr-sheet-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="qr-checkout-section">
          <div className="qr-checkout-section-title">Table</div>
          <div className="qr-checkout-table">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--qr-secondary)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            Table {tableNumber}
          </div>
        </div>

        <div className="qr-checkout-section">
          <div className="qr-checkout-section-title">Tip</div>
          <div className="qr-tip-options">
            {TIPS.map(t => (
              <div
                key={t.label}
                className={`qr-tip-option ${tip === t.value ? 'selected' : ''}`}
                onClick={() => setTip(t.value)}
              >
                <div className="qr-tip-option-pct">{t.label}</div>
                <div className="qr-tip-option-amt">
                  {t.value > 0 ? `$${(subtotal * t.value).toFixed(2)}` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="qr-checkout-section">
          <div className="qr-checkout-section-title">Special Instructions</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any allergies or special requests..."
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--qr-glass)',
              border: '1px solid var(--qr-glass-border)',
              borderRadius: 'var(--qr-radius-xs)',
              color: 'var(--qr-text)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              resize: 'vertical',
              minHeight: '60px',
              outline: 'none',
            }}
          />
        </div>

        <div className="qr-cart-footer">
          <div className="qr-cart-summary">
            <div className="qr-cart-summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="qr-cart-summary-row">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="qr-cart-summary-row">
              <span>Tip ({Math.round(tip * 100)}%)</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
            <div className="qr-cart-summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <button className="qr-cart-checkout-btn" onClick={handleSubmit}>
            Send to Kitchen — ${total.toFixed(2)}
          </button>
        </div>
      </motion.div>
    </>
  );
}
