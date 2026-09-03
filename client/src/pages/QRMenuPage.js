import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import HeroSection from '../components/QRMenu/HeroSection';
import StickyNav from '../components/QRMenu/StickyNav';
import SteamDivider from '../components/QRMenu/SteamDivider';
import MenuItemCard from '../components/QRMenu/MenuItemCard';
import CartBubble from '../components/QRMenu/CartBubble';
import ItemDetailSheet from '../components/QRMenu/ItemDetailSheet';
import CheckoutSheet from '../components/QRMenu/CheckoutSheet';
import { MOCK_MENU } from '../components/QRMenu/menuData';
import '../components/QRMenu/QRMenu.css';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: 2 + Math.random() * 3,
  x: Math.random() * 100,
  delay: Math.random() * 25,
  duration: 18 + Math.random() * 22,
  opacity: 0.12 + Math.random() * 0.2,
}));

function AmbientParticles() {
  return (
    <div className="qr-particles">
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="qr-particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default function QRMenuPage() {
  const { tableId } = useParams();
  const [cat, setCat] = useState('All');
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [search, setSearch] = useState('');
  const [favs, setFavs] = useState(new Set());
  const [openCart, setOpenCart] = useState(false);
  const menuRef = useRef(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    if (openCart || selected || checkout) {
      lenisRef.current?.stop();
    } else {
      lenisRef.current?.start();
    }
  }, [openCart, selected, checkout]);

  const menu = MOCK_MENU;
  const cats = useMemo(() => ['All', 'Coffee', 'Pastries', 'Breakfast', 'Sandwiches', 'Salads', 'Desserts', 'Cold Drinks'], []);

  // ⚡ Bolt Optimization: Memoize menu filtering and grouping to prevent unnecessary recalculations on every state render
  const filtered = useMemo(() => {
    if (!search.trim()) return menu;
    const query = search.toLowerCase();
    return menu.filter(i =>
      i.name.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      i.tags?.some(t => t.toLowerCase().includes(query))
    );
  }, [menu, search]);

  const grouped = useMemo(() => {
    return cats.reduce((a, c) => {
      if (c === 'All') return a;
      const items = filtered.filter(i => i.category === c);
      if (items.length) a[c] = items;
      return a;
    }, {});
  }, [cats, filtered]);

  const shown = useMemo(() => {
    return cat === 'All' ? filtered : filtered.filter(i => i.category === cat);
  }, [cat, filtered]);

  const shownGrouped = useMemo(() => {
    return cat === 'All' ? grouped : { [cat]: shown };
  }, [cat, grouped, shown]);

  const cartQty = useCallback(id => { const c = cart.find(x => x.id === id); return c ? c.quantity : 0; }, [cart]);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const addCart = useCallback(d => {
    setCart(p => {
      const e = p.find(x => x.id === d.id);
      if (e) return p.map(x => x.id === d.id ? { ...x, quantity: x.quantity + (d.quantity || 1) } : x);
      return [...p, { id: d.id, quantity: d.quantity || 1, size: d.size, milk: d.milk, sugar: d.sugar, ice: d.ice, spice: d.spice, notes: d.notes }];
    });
  }, []);

  const removeCart = useCallback(id => {
    setCart(p => { const e = p.find(x => x.id === id); return e && e.quantity > 1 ? p.map(x => x.id === id ? { ...x, quantity: x.quantity - 1 } : x) : p.filter(x => x.id !== id); });
  }, []);

  const updateQty = useCallback((id, d) => {
    setCart(p => { const e = p.find(x => x.id === id); if (!e) return p; const n = e.quantity + d; return n <= 0 ? p.filter(x => x.id !== id) : p.map(x => x.id === id ? { ...x, quantity: n } : x); });
  }, []);

  const clearItem = useCallback(id => setCart(p => p.filter(x => x.id !== id)), []);
  const toggleFav = useCallback(id => setFavs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);

  return (
    <div className="qr-root">
      <div className="qr-aurora"><div className="orb o1" /><div className="orb o2" /><div className="orb o3" /><div className="orb o4" /></div>
      <AmbientParticles />

      <HeroSection tableNumber={tableId} onBrowse={() => lenisRef.current?.scrollTo(menuRef.current, { offset: -20 })} onStartOrder={() => lenisRef.current?.scrollTo(menuRef.current, { offset: -20 })} />

      <div ref={menuRef}>
        <StickyNav activeCategory={cat} onCategoryChange={c => { setCat(c); setSearch(''); }} searchQuery={search} onSearchChange={setSearch} cartCount={totalItems} onCartClick={() => setOpenCart(true)} menuItems={menu} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={cat + search} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          {search.trim() && (
            <div className="qr-section" style={{ paddingTop: 28 }}>
              <div className="qr-section-head">
                <h2 className="qr-section-title">Results</h2>
                <span className="qr-section-count">{shown.length} item{shown.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {shown.length === 0 ? (
            <div className="qr-empty">
              <motion.div className="icon" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>🔍</motion.div>
              <p>No items found</p>
              <p className="sub">Try a different search or category</p>
            </div>
          ) : cat === 'All' && !search.trim() ? (
            Object.entries(shownGrouped).map(([category, items]) => (
              <React.Fragment key={category}>
                <SteamDivider />
                <section className="qr-section">
                  <div className="qr-section-head">
                    <h2 className="qr-section-title">{category}</h2>
                    <span className="qr-section-count">{items.length}</span>
                  </div>
                  <div className="qr-grid">
                    {items.map((item, i) => (
                      <MenuItemCard key={item.id} item={item} index={i} cartQty={cartQty(item.id)} onAdd={addCart} onRemove={removeCart} onDetail={setSelected} isFav={favs.has(item.id)} onToggleFav={toggleFav} />
                    ))}
                  </div>
                </section>
              </React.Fragment>
            ))
          ) : (
            <section className="qr-section" style={{ paddingTop: 28 }}>
              <div className="qr-grid">
                {shown.map((item, i) => (
                  <MenuItemCard key={item.id} item={item} index={i} cartQty={cartQty(item.id)} onAdd={addCart} onRemove={removeCart} onDetail={setSelected} isFav={favs.has(item.id)} onToggleFav={toggleFav} />
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      <div style={{ height: totalItems > 0 ? 140 : 60 }} />

      <AnimatePresence>
        {selected && !checkout && <ItemDetailSheet item={selected} onClose={() => setSelected(null)} onAddToCart={addCart} />}
      </AnimatePresence>
      <AnimatePresence>
        {checkout && <CheckoutSheet items={cart} menuItems={menu} tableNumber={tableId} onClose={() => setCheckout(false)} />}
      </AnimatePresence>

      <CartBubble items={cart} menuItems={menu} onUpdateQty={updateQty} onRemove={clearItem} onCheckout={() => setCheckout(true)} openCart={openCart} onOpenCartChange={setOpenCart} />
    </div>
  );
}
