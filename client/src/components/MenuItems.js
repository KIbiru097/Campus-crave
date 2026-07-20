import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { GET_MENU_ITEMS } from '../graphql/queries';
import { ADD_TO_CART } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MenuItems.css';

// Deterministic category → emoji + featured-size mapping so cards feel bento-like
// without inventing any data the backend doesn't actually provide.
const CATEGORY_EMOJI = {
  pizza: '🍕', burger: '🍔', burgers: '🍔', pasta: '🍝', chicken: '🍗',
  salad: '🥗', salads: '🥗', drink: '🥤', drinks: '🥤', beverage: '🥤',
  dessert: '🍰', desserts: '🍰', breakfast: '🥞', coffee: '☕', sandwich: '🥪',
  sandwiches: '🥪', pastry: '🥐', pastries: '🥐', snack: '🍟', snacks: '🍟',
  soup: '🍲', rice: '🍚', seafood: '🦐', vegetarian: '🥦', drinks2: '🧃',
};
const FALLBACK_EMOJI = ['🍽️', '🍴', '🧆', '🥙'];
const SIZE_PATTERN = ['', '', 'featured', '', '', ''];

const emojiFor = (category, index) => {
  const key = (category || '').toLowerCase().trim();
  return CATEGORY_EMOJI[key] || FALLBACK_EMOJI[index % FALLBACK_EMOJI.length];
};

const MenuItems = ({ cafeId }) => {
  const [quantities, setQuantities] = useState({});
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const { user } = useAuth();
  const navigate = useNavigate();
  const gridRef = useRef(null);

  const { loading, error, data } = useQuery(GET_MENU_ITEMS, {
    variables: { cafeId: parseInt(cafeId) }
  });

  const [addToCart] = useMutation(ADD_TO_CART, {
    refetchQueries: ['GetCart']
  });

  const items = useMemo(() => data?.menuItems || [], [data]);

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (activeCat !== 'All') list = list.filter(i => i.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, activeCat, search]);

  const getQty = id => quantities[id] || 1;
  const bump = (id, delta) => {
    setQuantities(q => ({ ...q, [id]: Math.max(1, Math.min(10, (q[id] || 1) + delta)) }));
  };

  const flyToCart = useCallback((cardEl) => {
    if (!cardEl) return;
    const target = document.getElementById('cc-nav-cart');
    const r = cardEl.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.style.cssText = `position:fixed;top:${r.top + r.height / 3}px;left:${r.left + r.width / 2}px;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#FF7A3D,#FFB84D);z-index:9999;pointer-events:none;transition:all .6s cubic-bezier(.4,0,.2,1);box-shadow:0 6px 22px rgba(255,122,61,0.5);opacity:1;transform:scale(1)`;
    document.body.appendChild(dot);
    requestAnimationFrame(() => {
      const dest = target ? target.getBoundingClientRect() : { top: 20, left: window.innerWidth - 60, width: 40, height: 20 };
      dot.style.top = `${dest.top + dest.height / 2 - 20}px`;
      dot.style.left = `${dest.left + dest.width / 2 - 20}px`;
      dot.style.opacity = '0';
      dot.style.transform = 'scale(0.15)';
    });
    setTimeout(() => dot.remove(), 700);
  }, []);

  const handleRipple = (e, cardEl) => {
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'cc-ripple';
    const size = Math.max(rect.width, rect.height) * 0.6;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    e.currentTarget.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleAddToCart = async (e, item) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const quantity = getQty(item.id);
    const card = e.currentTarget.closest('.cc-card');
    handleRipple(e, e.currentTarget);
    flyToCart(card);

    try {
      await addToCart({
        variables: {
          input: {
            menu_item_id: parseInt(item.id),
            quantity,
            customizations: null
          }
        }
      });
      setToast({ type: 'ok', text: `Added ${quantity} × ${item.name}` });
    } catch (err) {
      setToast({ type: 'err', text: err.message });
    }
    setTimeout(() => setToast(null), 2600);
  };

  const AuroraBg = () => (
    <div className="cc-menu-aurora">
      <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
    </div>
  );

  if (loading) {
    return (
      <div className="cc-menu-page">
        <AuroraBg />
        <div className="cc-menu-hero">
          <span className="cc-menu-eyebrow">✨ Fresh from the kitchen</span>
          <h1 className="cc-menu-title">The Menu</h1>
          <p className="cc-menu-sub">Loading today's selection…</p>
        </div>
        <div className="cc-menu-grid">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="cc-skel" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cc-menu-page">
        <AuroraBg />
        <div className="cc-menu-empty">
          <div className="ico">⚠️</div>
          <p className="title">Couldn't load the menu</p>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cc-menu-page">
        <AuroraBg />
        <div className="cc-menu-empty">
          <div className="ico">🍽️</div>
          <p className="title">Nothing on the menu yet</p>
          <p>This cafe hasn't added any items for this menu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-menu-page">
      <AuroraBg />

      <div className="cc-menu-hero">
        <span className="cc-menu-eyebrow">✨ Fresh from the kitchen</span>
        <h1 className="cc-menu-title">The Menu</h1>
        <p className="cc-menu-sub">Handpicked dishes, made to order — browse and add your favorites to the cart.</p>
      </div>

      <div className="cc-menu-controls">
        <div className="cc-menu-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            placeholder="Search dishes, ingredients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="cc-menu-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cc-menu-pill ${activeCat === cat ? 'active' : ''}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCat + search}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {filtered.length === 0 ? (
            <div className="cc-menu-empty">
              <div className="ico">🔍</div>
              <p className="title">No matches</p>
              <p>Try a different search term or category.</p>
            </div>
          ) : (
            <div className="cc-menu-grid" ref={gridRef}>
              {filtered.map((item, i) => {
                const size = SIZE_PATTERN[i % SIZE_PATTERN.length];
                return (
                  <motion.div
                    key={item.id}
                    className={`cc-card ${size}`}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: (i % 6) * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div className="cc-card-top">
                      {item.category && <span className="cc-card-cat">{item.category}</span>}
                      {item.status && item.status.toLowerCase() === 'available' && (
                        <span className="cc-card-status">Available</span>
                      )}
                      <div className="cc-card-emoji">{emojiFor(item.category, i)}</div>
                    </div>

                    <div className="cc-card-body">
                      <h3 className="cc-card-name">{item.name}</h3>
                      {item.description && <p className="cc-card-desc">{item.description}</p>}

                      <div className="cc-card-foot">
                        <span className="cc-card-price">ETB {Number(item.price).toFixed(2)}</span>
                        <div className="cc-stepper">
                          <button onClick={() => bump(item.id, -1)} aria-label="decrease">−</button>
                          <span className="n">{getQty(item.id)}</span>
                          <button onClick={() => bump(item.id, 1)} aria-label="increase">+</button>
                        </div>
                      </div>

                      <motion.button
                        className="cc-add-btn"
                        style={{ marginTop: 6, width: '100%' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleAddToCart(e, item)}
                      >
                        Add to Cart
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className={`cc-toast ${toast.type === 'err' ? 'err' : ''}`}
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
          >
            <span className="dot" />
            {toast.type === 'err' ? `Error: ${toast.text}` : toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuItems;