import React, { useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HeroSection from '../components/QRMenu/HeroSection';
import StickyNav from '../components/QRMenu/StickyNav';
import SteamDivider from '../components/QRMenu/SteamDivider';
import MenuItemCard from '../components/QRMenu/MenuItemCard';
import CartBubble from '../components/QRMenu/CartBubble';
import ItemDetailSheet from '../components/QRMenu/ItemDetailSheet';
import CheckoutSheet from '../components/QRMenu/CheckoutSheet';
import { MOCK_MENU } from '../components/QRMenu/menuData';
import '../components/QRMenu/QRMenu.css';

export default function QRMenuPage() {
  const { tableId } = useParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const menuRef = useRef(null);

  const menuItems = MOCK_MENU;

  const categories = ['All', 'Coffee', 'Pastries', 'Breakfast', 'Sandwiches', 'Salads', 'Desserts', 'Cold Drinks'];

  const groupedMenu = categories.reduce((acc, cat) => {
    if (cat === 'All') return acc;
    const items = menuItems.filter(item => item.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const displayedItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const displayedGrouped = activeCategory === 'All'
    ? groupedMenu
    : { [activeCategory]: displayedItems };

  const getCartQty = useCallback((itemId) => {
    const cartItem = cart.find(c => c.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  }, [cart]);

  const handleAddToCart = useCallback((itemData) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemData.id);
      if (existing) {
        return prev.map(c =>
          c.id === itemData.id
            ? { ...c, quantity: c.quantity + (itemData.quantity || 1) }
            : c
        );
      }
      return [...prev, {
        id: itemData.id,
        quantity: itemData.quantity || 1,
        size: itemData.size,
        milk: itemData.milk,
        spice: itemData.spice,
      }];
    });
  }, []);

  const handleRemoveFromCart = useCallback((itemId) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(c =>
          c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter(c => c.id !== itemId);
    });
  }, []);

  const handleUpdateQty = useCallback((itemId, delta) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(c => c.id !== itemId);
      return prev.map(c =>
        c.id === itemId ? { ...c, quantity: newQty } : c
      );
    });
  }, []);

  const handleClearItem = useCallback((itemId) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  }, []);

  const handleBrowse = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartOrder = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="qr-menu-root">
      <HeroSection
        tableNumber={tableId}
        onBrowse={handleBrowse}
        onStartOrder={handleStartOrder}
      />

      <div ref={menuRef}>
        <StickyNav
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {activeCategory === 'All' ? (
        Object.entries(displayedGrouped).map(([category, items]) => (
          <React.Fragment key={category}>
            <SteamDivider />
            <section className="qr-menu-section">
              <h2 className="qr-section-title">{category}</h2>
              <div className="qr-menu-grid">
                {items.map((item, index) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    cartQty={getCartQty(item.id)}
                    onAdd={handleAddToCart}
                    onRemove={handleRemoveFromCart}
                    onDetail={setSelectedItem}
                  />
                ))}
              </div>
            </section>
          </React.Fragment>
        ))
      ) : (
        <section className="qr-menu-section" style={{ paddingTop: 16 }}>
          <div className="qr-menu-grid">
            {displayedItems.map((item, index) => (
              <MenuItemCard
                key={item.id}
                item={item}
                index={index}
                cartQty={getCartQty(item.id)}
                onAdd={handleAddToCart}
                onRemove={handleRemoveFromCart}
                onDetail={setSelectedItem}
              />
            ))}
          </div>
        </section>
      )}

      <div style={{ height: 120 }} />

      <AnimatePresence>
        {selectedItem && !showCheckout && (
          <ItemDetailSheet
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAddToCart={handleAddToCart}
            cartQty={getCartQty(selectedItem.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckout && (
          <CheckoutSheet
            items={cart}
            menuItems={menuItems}
            tableNumber={tableId}
            onClose={() => setShowCheckout(false)}
          />
        )}
      </AnimatePresence>

      <CartBubble
        items={cart}
        menuItems={menuItems}
        onUpdateQty={handleUpdateQty}
        onRemove={handleClearItem}
        onCheckout={() => setShowCheckout(true)}
      />
    </div>
  );
}
