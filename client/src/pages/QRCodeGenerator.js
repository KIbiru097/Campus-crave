import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

const BASE_URL = window.location.origin;

export default function QRCodeGenerator() {
  const [tableCount, setTableCount] = useState(12);
  const [cafeName, setCafeName] = useState('Sunny Corner Cafe');
  const [selectedTables, setSelectedTables] = useState(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
  const printRef = useRef(null);

  const toggleTable = (num) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set();
    for (let i = 1; i <= tableCount; i++) all.add(i);
    setSelectedTables(all);
  };

  const handlePrint = useCallback(() => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes - ${cafeName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #fff; padding: 40px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; max-width: 720px; margin: 0 auto; }
          .qr-card {
            display: flex; flex-direction: column; align-items: center;
            padding: 28px 20px; border: 1.5px solid #e5e5e5; border-radius: 16px;
            page-break-inside: avoid;
          }
          .qr-card svg { margin-bottom: 14px; }
          .table-num { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
          .cafe-name { font-size: 11px; color: #888; letter-spacing: 0.5px; }
          .scan-text { font-size: 9px; color: #aaa; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
          @media print {
            body { padding: 20px; }
            .grid { gap: 20px; }
            .qr-card { border-color: #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${Array.from(selectedTables).sort((a, b) => a - b).map(num => `
            <div class="qr-card">
              ${(() => {
                const svg = printRef.current.querySelector(`[data-table="${num}"] svg`);
                return svg ? svg.outerHTML : '';
              })()}
              <div class="table-num">Table ${num}</div>
              <div class="cafe-name">${cafeName}</div>
              <div class="scan-text">Scan to order</div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  }, [cafeName, selectedTables]);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFDF9', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40 }}
        >
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 32, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
            Table QR Codes
          </h1>
          <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>
            Generate printable QR codes for each table. Customers scan to open the menu and order directly.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: '#fff', borderRadius: 16, padding: '24px 28px',
            border: '1px solid #eee', marginBottom: 32,
            display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end'
          }}
        >
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Cafe Name</label>
            <input
              type="text"
              value={cafeName}
              onChange={e => setCafeName(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #ddd',
                borderRadius: 10, fontSize: 14, outline: 'none',
                transition: 'border-color .2s'
              }}
              onFocus={e => e.target.style.borderColor = '#E8532B'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>
          <div style={{ flex: '0 1 140px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Number of Tables</label>
            <input
              type="number"
              min={1}
              max={50}
              value={tableCount}
              onChange={e => {
                const v = Math.min(50, Math.max(1, parseInt(e.target.value) || 1));
                setTableCount(v);
                const all = new Set();
                for (let i = 1; i <= v; i++) all.add(i);
                setSelectedTables(all);
              }}
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #ddd',
                borderRadius: 10, fontSize: 14, outline: 'none',
                transition: 'border-color .2s'
              }}
              onFocus={e => e.target.style.borderColor = '#E8532B'}
              onBlur={e => e.target.style.borderColor = '#ddd'}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={selectAll}
              style={{
                padding: '10px 18px', borderRadius: 10, border: '1px solid #ddd',
                background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                color: '#555', transition: 'all .2s'
              }}
            >
              Select All
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedTables.size === 0}
              style={{
                padding: '10px 22px', borderRadius: 10, border: 'none',
                background: selectedTables.size > 0 ? 'linear-gradient(135deg, #E8532B, #FF7A3D)' : '#ccc',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: selectedTables.size > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedTables.size > 0 ? '0 4px 16px rgba(232,83,43,0.3)' : 'none',
                transition: 'all .2s'
              }}
            >
              Print ({selectedTables.size})
            </button>
          </div>
        </motion.div>

        {/* Table selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: 32 }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 10 }}>
            Click to select/deselect tables
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Array.from({ length: tableCount }, (_, i) => i + 1).map(num => (
              <motion.button
                key={num}
                whileTap={{ scale: 0.92 }}
                onClick={() => toggleTable(num)}
                style={{
                  width: 44, height: 44, borderRadius: 12, border: '1.5px solid',
                  borderColor: selectedTables.has(num) ? '#E8532B' : '#ddd',
                  background: selectedTables.has(num) ? 'rgba(232,83,43,0.08)' : '#fff',
                  color: selectedTables.has(num) ? '#E8532B' : '#888',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all .15s'
                }}
              >
                {num}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* QR Codes Grid */}
        <div ref={printRef} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 20
        }}>
          {Array.from(selectedTables).sort((a, b) => a - b).map((num, idx) => (
            <motion.div
              key={num}
              data-table={num}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03, duration: 0.3 }}
              style={{
                background: '#fff', borderRadius: 16, padding: '28px 20px',
                border: '1px solid #eee', textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                cursor: 'pointer', transition: 'all .2s'
              }}
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
              onClick={() => {
                const url = `${BASE_URL}/qr-menu/${num}`;
                navigator.clipboard?.writeText(url);
              }}
            >
              <QRCodeSVG
                value={`${BASE_URL}/qr-menu/${num}`}
                size={140}
                bgColor="#ffffff"
                fgColor="#120D0A"
                level="H"
                style={{ marginBottom: 14 }}
                imageSettings={{
                  src: '',
                  height: 0,
                  width: 0,
                  excavate: false,
                }}
              />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
                Table {num}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                {cafeName}
              </div>
              <div style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>
                Scan to order
              </div>
            </motion.div>
          ))}
        </div>

        {selectedTables.size === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>📱</p>
            <p style={{ fontSize: 16, fontStyle: 'italic' }}>Select tables above to generate QR codes</p>
          </div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 40, padding: '20px 24px', borderRadius: 12,
            background: 'rgba(232,83,43,0.04)', border: '1px solid rgba(232,83,43,0.1)',
            fontSize: 13, color: '#666', lineHeight: 1.7
          }}
        >
          <strong style={{ color: '#333' }}>How it works:</strong> Print these QR codes and place them on each table.
          When customers scan with their phone camera, they'll open the immersive menu for their table.
          No app download needed — works in any browser.
        </motion.div>
      </div>
    </div>
  );
}
