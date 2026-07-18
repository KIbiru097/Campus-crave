import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function MenuItemCard({ item, index, cartQty, onAdd, onRemove, onDetail }) {
  const cardRef = useRef(null);

  const handleAdd = (e) => {
    e.stopPropagation();
    onAdd(item);

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const bubble = document.querySelector('.qr-cart-btn');
      if (bubble) {
        const bubbleRect = bubble.getBoundingClientRect();
        const flyEl = document.createElement('div');
        flyEl.style.cssText = `
          position: fixed;
          top: ${rect.top}px;
          left: ${rect.left}px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D97706, #F59E0B);
          z-index: 9999;
          pointer-events: none;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        document.body.appendChild(flyEl);
        requestAnimationFrame(() => {
          flyEl.style.top = `${bubbleRect.top + bubbleRect.height / 2 - 20}px`;
          flyEl.style.left = `${bubbleRect.left + bubbleRect.width / 2 - 20}px`;
          flyEl.style.opacity = '0';
          flyEl.style.transform = 'scale(0.2)';
        });
        setTimeout(() => flyEl.remove(), 700);
      }
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(item.id);
  };

  const isHero = index === 0;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  return (
    <motion.div
      ref={cardRef}
      className={`qr-menu-card ${isHero ? 'hero-card' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (index % 4) * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => onDetail(item)}
      whileHover={{ y: -3 }}
    >
      <div className="qr-card-img-wrap">
        <img
          className="qr-card-img"
          src={item.image}
          alt={item.name}
          loading="lazy"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        />
        {item.badge && (
          <span className={`qr-card-badge ${item.badge === 'Popular' ? 'popular' : item.badge === "Chef's Pick" ? 'chef-pick' : 'vegan'}`}>
            {item.badge}
          </span>
        )}
      </div>
      <div className="qr-card-body">
        <h3 className="qr-card-name">{item.name}</h3>
        <p className="qr-card-desc">{item.description}</p>

        {item.tags && item.tags.length > 0 && (
          <div className="qr-card-tags">
            {item.tags.map((tag, i) => (
              <span key={i} className={`qr-card-tag ${tag.toLowerCase() === 'vegan' || tag.toLowerCase() === 'plant-based' ? 'vegan-tag' : ''}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="qr-card-meta">
          {item.rating && (
            <span className="qr-card-rating">
              ★ {item.rating}
            </span>
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

        <div className="qr-card-footer">
          <div className="qr-card-price">
            ${item.price.toFixed(2)}
            {hasDiscount && (
              <span className="old-price">${item.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <div className="qr-card-add">
            {cartQty > 0 ? (
              <>
                <button className="qr-card-add-btn" onClick={handleRemove}>−</button>
                <span className="qr-card-add-count">{cartQty}</span>
                <button className="qr-card-add-btn plus" onClick={handleAdd}>+</button>
              </>
            ) : (
              <button className="qr-card-add-btn plus" onClick={handleAdd}>+</button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
