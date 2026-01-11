
import React, { useState, useEffect, useRef } from 'react';
import { PRODUCTS } from '../constants';
import { Product } from '../types';

interface LandingViewProps {
  onProductClick: (product: Product) => void;
}

interface Sticker {
  id: number;
  src: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const STICKER_POSITIONS = [
  { file: 'hero (1).png', x: 24, y: 22, rot: -15, scale: 0.6 },
  { file: 'hero (2).png', x: 36, y: 26, rot: 10, scale: 0.55 },
  { file: 'hero (3).png', x: 63, y: 23, rot: -5, scale: 0.65 },
  { file: 'hero (4).png', x: 90, y: 21, rot: 15, scale: 0.5 },
  { file: 'hero (5).png', x: 17, y: 48, rot: -10, scale: 0.7 },
  { file: 'hero (6).png', x: 80, y: 48, rot: 20, scale: 0.65 },
  { file: 'hero (7).png', x: 13, y: 82, rot: -5, scale: 0.55 },
  { file: 'hero (14).png', x: 26, y: 73, rot: -15, scale: 0.45 },
  { file: 'hero (9).png', x: 33, y: 86, rot: 10, scale: 0.5 },
  { file: 'hero (8).png', x: 36, y: 80, rot: -10, scale: 0.5 },
  { file: 'hero (10).png', x: 57, y: 81, rot: 5, scale: 0.5 },
  { file: 'hero (11).png', x: 74, y: 74, rot: 15, scale: 0.6 },
  { file: 'hero (12).png', x: 66, y: 87, rot: -8, scale: 0.55 },
  { file: 'hero (13).png', x: 92, y: 76, rot: 25, scale: 0.6 }
];

export const LandingView: React.FC<LandingViewProps> = ({ onProductClick }) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial state: all at center
    const initialStickers = STICKER_POSITIONS.map((pos, i) => ({
      id: i,
      src: `/assets/${pos.file}`,
      x: 50,
      y: 50,
      rotation: 0,
      scale: 0
    }));
    setStickers(initialStickers);

    // Trigger animation to final positions
    const timer = setTimeout(() => {
      const isMobile = window.innerWidth < 768;

      setStickers(STICKER_POSITIONS.map((pos, i) => ({
        id: i,
        src: `/assets/${pos.file}`,
        x: isMobile ? 50 + (pos.x - 50) * 0.45 : pos.x,
        y: isMobile ? 33 + (pos.y - 33) * 0.2 : pos.y,
        rotation: pos.rot,
        scale: isMobile ? pos.scale * 0.8 : pos.scale
      })));
      setIsMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Track velocity
  const lastPosPerSticker = useRef<{ [key: number]: { x: number, y: number, time: number } }>({});

  const handleDrag = (id: number, e: React.MouseEvent | React.TouchEvent) => {
    setDraggingId(id);
    const isTouch = 'touches' in e;
    const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    const startX = clientX;
    const startY = clientY;

    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;

    const initialX = sticker.x;
    const initialY = sticker.y;

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const moveX = 'touches' in moveEvent ? (moveEvent as TouchEvent).touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const moveY = 'touches' in moveEvent ? (moveEvent as TouchEvent).touches[0].clientY : (moveEvent as MouseEvent).clientY;

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      const deltaX = ((moveX - startX) / rect.width) * 100;
      const deltaY = ((moveY - startY) / rect.height) * 100;

      // Track velocity
      lastPosPerSticker.current[id] = { x: initialX + deltaX, y: initialY + deltaY, time: Date.now() };

      setStickers(prev => prev.map(s =>
        s.id === id ? { ...s, x: initialX + deltaX, y: initialY + deltaY } : s
      ));
    };

    const onEnd = () => {
      setDraggingId(null);

      // Momentum logic
      const lastData = lastPosPerSticker.current[id];
      if (lastData) {
        // We could add advanced momentum here, but sticking to smooth CSS transitions for now
        // to keep it within safe React state boundaries.
      }

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const handleExploreClick = () => {
    const target = document.getElementById('collection');
    if (!target) return;

    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 80;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;

      // Easing function: easeInOutQuart
      const ease = (t: number) => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;

      const run = ease(Math.min(timeElapsed / 1200, 1)) * distance + startPosition;
      window.scrollTo(0, run);

      if (timeElapsed < 1200) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  };

  return (
    <div className="landing-container">
      <section ref={containerRef} className="hero-section">
        <div className="monitor-container">
          <img src="/monitor.png" alt="monitor" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <div className="monitor-content">
            <h2 className="monitor-title">Physical <br /> Fragments</h2>
            <p className="monitor-subtitle">of a digital soul</p>
          </div>
        </div>

        {stickers.map((s) => (
          <div
            key={s.id}
            className="sticker-item"
            onMouseDown={(e) => handleDrag(s.id, e)}
            onTouchStart={(e) => handleDrag(s.id, e)}
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
              zIndex: draggingId === s.id ? 100 : 60 + s.id,
              transition: draggingId === s.id
                ? 'none'
                : 'all 2.4s cubic-bezier(0.16, 1, 0.3, 1)', // Longer, smoother ease-out
              cursor: draggingId === s.id ? 'grabbing' : 'grab',
              opacity: isMounted ? 1 : 0
            }}
          >
            <img src={s.src} alt="sticker" className="sticker-img" style={{ pointerEvents: 'none' }} />
          </div>
        ))}

        <div className="hero-cta-wrapper" style={{ position: 'absolute', bottom: '2rem', zIndex: 110 }}>
          <button
            className="btn-liquid"
            onClick={handleExploreClick}
          >
            Explore Archives ↓
          </button>
        </div>
      </section>

      <section id="collection" style={{ background: 'var(--bg-secondary)', padding: '12rem 0' }}>
        <div className="container">
          <header style={{ marginBottom: '8rem' }}>
            <span className="font-pixel" style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700, letterSpacing: '0.2em' }}>
              Artifact Library v1.5
            </span>
            <h3 className="font-serif" style={{ fontSize: 'clamp(3.5rem, 10vw, 6rem)', lineHeight: 0.95, marginTop: '2rem' }}>
              Curated Fragments <br /> For Your <span style={{ opacity: 0.35, fontStyle: 'italic' }}>Moodboard.</span>
            </h3>
          </header>

          <div className="collection-grid">
            {PRODUCTS.map((p, idx) => {
              const tilt = (idx % 3 - 1) * 2;
              return (
                <div
                  key={p.id}
                  className="product-card"
                  style={{ transform: `rotate(${tilt}deg)` }}
                  onClick={() => onProductClick(p)}
                >
                  <div style={{ aspectRatio: '4/5', borderRadius: '1.25rem', overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ marginTop: '2rem' }}>
                    <span className="font-pixel" style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent-blue)', opacity: 0.6, textTransform: 'uppercase' }}>
                      {p.type === 'photostrip' ? 'Studio Module' : 'Visual Good'}
                    </span>
                    <h4 className="font-primary" style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>{p.name}</h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <span className="font-primary" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Rp {p.price.toLocaleString()}</span>
                      <button className="btn-liquid" style={{ fontSize: '10px', padding: '0.6rem 1.25rem' }}>
                        {p.id === 'ps-main' ? 'SELECT_SERIES' : 'VIEW_DETAILS'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="marquee-accent">
        <div className="marquee-content font-serif" style={{ fontSize: '5rem', textTransform: 'uppercase' }}>
          <span>Visual Archives</span> <span>✦</span> <span>Analog Syndicate</span> <span>✦</span>
          <span>Digital Soul</span> <span>✦</span> <span>Moodboard Goods</span> <span>✦</span>
          <span>Visual Archives</span> <span>✦</span> <span>Analog Syndicate</span> <span>✦</span>
          <span>Digital Soul</span> <span>✦</span> <span>Moodboard Goods</span> <span>✦</span>
        </div>
      </div>
    </div>
  );
};
