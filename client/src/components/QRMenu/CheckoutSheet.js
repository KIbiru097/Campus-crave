import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TIPS = [{ label: '10%', value: 0.10 }, { label: '15%', value: 0.15 }, { label: '20%', value: 0.20 }, { label: '25%', value: 0.25 }, { label: 'None', value: 0 }];
const STEPS = [{ key: 'received', label: 'Received', icon: '✓' }, { key: 'preparing', label: 'Preparing', icon: '🔥' }, { key: 'ready', label: 'Ready', icon: '✨' }, { key: 'served', label: 'Served', icon: '🍽️' }];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function CheckoutSheet({ items, menuItems, tableNumber, onClose }) {
  const [tip, setTip] = useState(0.15);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const [note, setNote] = useState('');
  const [promo, setPromo] = useState('');
  const [promoOn, setPromoOn] = useState(false);

  const sub = items.reduce((s, i) => { const m = menuItems.find(x => x.id === i.id); return s + (m ? m.price * i.quantity : 0); }, 0);
  const disc = promoOn ? sub * 0.1 : 0;
  const af = sub - disc;
  const tax = af * 0.08;
  const tipAmt = af * tip;
  const total = af + tax + tipAmt;

  const submit = () => {
    setDone(true);
    let s = 0;
    const iv = setInterval(() => { s++; if (s < STEPS.length) setStep(s); else clearInterval(iv); }, 3500);
  };

  if (done) {
    return (
      <>
        <motion.div className="qr-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
        <motion.div className="qr-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}>
          <div className="qr-handle" />
          <div className="qr-status">
            <motion.div className="qr-status-check" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>✓</motion.div>
            <motion.h2 className="qr-sheet-title" style={{ marginBottom: 6 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>Order Sent!</motion.h2>
            <motion.p style={{ color: 'var(--qr-muted)', fontSize: 14, marginBottom: 4 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>Table {tableNumber} · {items.length} item{items.length > 1 ? 's' : ''}</motion.p>
            <motion.p style={{ color: 'var(--qr-dim)', fontSize: 13, fontStyle: 'italic', fontFamily: 'var(--font-display)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>Being prepared with care</motion.p>

            <div className="qr-steps">
              {STEPS.map((s, i) => (
                <motion.div key={s.key} className={`qr-step ${i < step ? 'done-line' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.1 }}>
                  <div className={`qr-step-dot ${i < step ? 'done' : i === step ? 'on' : ''}`}>{i < step ? '✓' : s.icon}</div>
                  <span className={`qr-step-lbl ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}>{s.label}</span>
                </motion.div>
              ))}
            </div>

            <motion.div className="qr-est" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--qr-secondary)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Estimated: <strong>~8 minutes</strong>
            </motion.div>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <motion.div className="qr-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="qr-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }} drag="y" dragConstraints={{ top: 0 }} dragElastic={0.15} onDragEnd={(_, i) => { if (i.velocity.y > 180 || i.offset.y > 180) onClose(); }}>
        <div className="qr-handle" />
        <div className="qr-sheet-head">
          <h2 className="qr-sheet-title">Checkout</h2>
          <motion.button className="qr-sheet-x" onClick={onClose} whileTap={{ scale: 0.9 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></motion.button>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div className="qr-co-section" variants={fade}>
            <div className="qr-co-title">Table</div>
            <div className="qr-co-table">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--qr-secondary)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
              Table {tableNumber || '12'}
            </div>
          </motion.div>

          <motion.div className="qr-co-section" variants={fade}>
            <div className="qr-co-title">Order Summary</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-xs)', padding: '14px 16px' }}>
              {items.map(ci => {
                const m = menuItems.find(x => x.id === ci.id);
                if (!m) return null;
                return <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--qr-muted)' }}><span>{ci.quantity}× {m.name}{ci.size ? ` (${ci.size})` : ''}</span><span style={{ color: 'var(--qr-text)', fontWeight: 500 }}>${(m.price * ci.quantity).toFixed(2)}</span></div>;
              })}
            </div>
          </motion.div>

          <motion.div className="qr-co-section" variants={fade}>
            <div className="qr-co-title">Promo Code</div>
            <div className="qr-promo-wrap">
              <input className="qr-promo-in" type="text" placeholder="Enter code" value={promo} onChange={e => setPromo(e.target.value.toUpperCase())} disabled={promoOn} />
              <motion.button className="qr-promo-btn" onClick={() => { if (promo.length > 0) setPromoOn(true); }} whileTap={{ scale: 0.95 }} style={promoOn ? { color: 'var(--qr-accent)', borderColor: 'rgba(132,204,22,0.2)' } : {}}>{promoOn ? '✓ Applied' : 'Apply'}</motion.button>
            </div>
            {promoOn && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 12, color: 'var(--qr-accent)', marginTop: 8 }}>10% discount applied</motion.p>}
          </motion.div>

          <motion.div className="qr-co-section" variants={fade}>
            <div className="qr-co-title">Tip</div>
            <div className="qr-tip-opts">
              {TIPS.map(t => (
                <motion.div key={t.label} className={`qr-tip ${tip === t.value ? 'on' : ''}`} onClick={() => setTip(t.value)} whileTap={{ scale: 0.93 }}>
                  <div className="pct">{t.label}</div>
                  <div className="amt">{t.value > 0 ? `$${(af * t.value).toFixed(2)}` : '—'}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="qr-co-section" variants={fade}>
            <div className="qr-co-title">Special Instructions</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any allergies or requests..." style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-xs)', color: 'var(--qr-text)', fontFamily: 'var(--font-body)', fontSize: '14px', resize: 'vertical', minHeight: '60px', outline: 'none', transition: 'border-color .2s, box-shadow .2s' }} onFocus={e => { e.target.style.borderColor = 'rgba(217,119,6,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(217,119,6,0.06)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none'; }} />
          </motion.div>
        </motion.div>

        <div className="qr-cart-foot">
          <div className="qr-cart-sum">
            <div className="qr-cart-row-sum"><span>Subtotal</span><span>${sub.toFixed(2)}</span></div>
            {promoOn && <div className="qr-cart-row-sum" style={{ color: 'var(--qr-accent)' }}><span>Discount (10%)</span><span>−${disc.toFixed(2)}</span></div>}
            <div className="qr-cart-row-sum"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
            {tip > 0 && <div className="qr-cart-row-sum"><span>Tip ({Math.round(tip * 100)}%)</span><span>${tipAmt.toFixed(2)}</span></div>}
            <div className="qr-cart-row-sum total"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14, fontSize: 13, color: 'var(--qr-muted)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Est. ~8 min
          </div>
          <motion.button className="qr-checkout-btn" onClick={submit} whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }}>Send to Kitchen — ${total.toFixed(2)}</motion.button>
        </div>
      </motion.div>
    </>
  );
}
