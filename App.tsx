
// Build trigger: checkout flow refinement v1.0.1
import React, { useState, useEffect } from 'react';
import { LandingView } from './views/LandingView';
import { PhotostripView } from './views/PhotostripView';
import { CheckoutView } from './components/CheckoutView';
import { AdminView } from './views/AdminView';
import { CheckoutModal } from './components/CheckoutModal';
import { Product, PhotostripTemplate } from './types';
import { TEMPLATES, PHOTOSTRIP_SERIES, KEYCHAIN_PRODUCTS, STICKER_PRODUCTS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'builder' | 'cart' | 'series' | 'shop' | 'checkout' | 'admin'>('home');
  const [shopCategory, setShopCategory] = useState<'keychain' | 'sticker'>('keychain');
  const [cart, setCart] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<PhotostripTemplate>(TEMPLATES[0]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const handleLandingProductClick = (product: Product) => {
    if (product.id === 'ps-main') {
      setCurrentView('series');
    } else if (product.id === 'kc-main') {
      setShopCategory('keychain');
      setCurrentView('shop');
    } else if (product.id === 'st-main') {
      setShopCategory('sticker');
      setCurrentView('shop');
    }
  };

  const handleSeriesSelect = (series: Product) => {
    setCart(prev => [...prev, series]);
    setCurrentView('cart');
  };

  const handleEditPhotostrip = (product: Product) => {
    // Find matching template by name or ID
    const template = TEMPLATES.find(t => t.backgroundImage === product.image) || TEMPLATES[0];
    setActiveTemplate(template);
    setSelectedProduct(product);
    setCurrentView('builder');
  };
  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const calculateTotal = () => {
    const photostrips = cart.filter(item => item.type === 'photostrip');
    const merch = cart.filter(item => item.type !== 'photostrip');

    // Photostrip pricing: 3000 each, but 4 for 10000
    const psCount = photostrips.length;
    const psBundles = Math.floor(psCount / 4);
    const psRemainder = psCount % 4;
    const psTotal = (psBundles * 10000) + (psRemainder * 3000);

    const merchTotal = merch.reduce((sum, item) => sum + item.price, 0);

    return psTotal + merchTotal;
  };

  const handleCheckoutFromBuilder = (templateName: string) => {
    setSelectedTemplateName(templateName);
    setCurrentView('checkout');
  };

  const handleCheckoutFromCart = () => {
    setCurrentView('checkout');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <nav className="nav-header">
        <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('home')}>
          <img src="/logo/favicon-01.png" alt="Logo" className="nav-logo-img" />
        </div>

        <div className="flex items-center gap-8">
          <div className="nav-links">
            <button
              onClick={() => setCurrentView('home')}
              className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
            >
              Archives
            </button>
            <button
              onClick={() => setCurrentView('cart')}
              className={`nav-btn ${currentView === 'cart' ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              Bag
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute', top: '-5px', right: '-10px',
                  background: 'var(--accent-blue)', color: 'white',
                  fontSize: '9px', padding: '2px 5px', borderRadius: '50%'
                }}>
                  {cart.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView('builder')}
              className={`nav-btn ${currentView === 'builder' ? 'active' : ''}`}
            >
              Studio
            </button>
          </div>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="theme-toggle">
            {isDarkMode ? '☼' : '◑'}
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'home' && <LandingView onProductClick={handleLandingProductClick} />}

        {currentView === 'series' && (
          <div className="container" style={{ padding: '8rem 0' }}>
            <div style={{ marginBottom: '6rem' }}>
              <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '11px', fontWeight: 700 }}>SELECT_YOUR_SERIES</span>
              <h2 className="font-serif" style={{ fontSize: '4.5rem', marginTop: '1rem' }}>Photostrip Series</h2>
            </div>
            <div className="collection-grid">
              {PHOTOSTRIP_SERIES.map((p, idx) => (
                <div
                  key={p.id}
                  className="product-card"
                  onClick={() => handleSeriesSelect(p)}
                >
                  <div style={{ aspectRatio: '4/5', borderRadius: '1.25rem', overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 className="font-primary" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{p.name}</h4>
                    <p className="font-primary" style={{ opacity: 0.6 }}>Rp {p.price.toLocaleString()}</p>
                    <button className="btn-liquid" style={{ width: '100%', marginTop: '1.5rem', fontSize: '10px' }}>
                      ADD_TO_BAG
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setCurrentView('home')} className="cart-continue-btn">
              ← Return to Archives
            </button>
          </div>
        )}

        {currentView === 'shop' && (
          <div className="container" style={{ padding: '6rem 0' }}>
            <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '11px', fontWeight: 700 }}>EXPLORE_COLLECTION</span>
                <h2 className="font-serif" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginTop: '0.5rem' }}>
                  {shopCategory === 'keychain' ? 'Flamoure Keychains' : 'Underground Stickers'}
                </h2>
              </div>
              <div className="tab-nav" style={{ width: 'auto' }}>
                <button
                  onClick={() => setShopCategory('keychain')}
                  className={`tab-btn ${shopCategory === 'keychain' ? 'active' : ''}`}
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  KEYCHAINS
                </button>
                <button
                  onClick={() => setShopCategory('sticker')}
                  className={`tab-btn ${shopCategory === 'sticker' ? 'active' : ''}`}
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  STICKERS
                </button>
              </div>
            </div>

            <div className="collection-grid">
              {(shopCategory === 'keychain' ? KEYCHAIN_PRODUCTS : STICKER_PRODUCTS).map((p) => (
                <div key={p.id} className="product-card">
                  <div style={{ aspectRatio: '1/1', borderRadius: '1.25rem', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                    <h4 className="font-primary" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{p.name}</h4>
                    <p className="font-primary" style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.2rem' }}>Rp {p.price.toLocaleString()}</p>
                    <button onClick={() => addToCart(p)} className="btn-liquid" style={{ width: '100%', marginTop: '1.25rem', fontSize: '10px' }}>
                      ADD_TO_BAG
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setCurrentView('home')} className="cart-continue-btn" style={{ marginTop: '4rem' }}>
              ← Return Home
            </button>
          </div>
        )}

        {currentView === 'cart' && (
          <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
            <h2 className="font-serif" style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)', marginBottom: '3rem' }}>Your Bag</h2>
            {cart.length === 0 ? (
              <div style={{ padding: '4rem 0' }}>
                <p className="font-pixel" style={{ opacity: 0.5, fontSize: '1.2rem' }}>Your bag is empty_</p>
                <button onClick={() => setCurrentView('home')} className="cart-continue-btn" style={{ margin: '3rem auto 0' }}>
                  ← EXPLORE_ARCHIVES
                </button>
              </div>
            ) : (
              <div className="cart-list" style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <span className="font-pixel" style={{ opacity: 0.5 }}>ITEM_LIST ({cart.length})</span>
                  <div style={{ textAlign: 'right' }}>
                    <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '10px', display: 'block' }}>ESTIMATED_TOTAL</span>
                    <span className="font-primary" style={{ fontSize: '1.5rem', fontWeight: 900 }}>Rp {calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                {cart.map((item, idx) => (
                  <div key={idx} className="cart-item">
                    <img src={item.image} alt={item.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '1rem' }} />
                    <div style={{ flex: 1 }}>
                      <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '10px' }}>TYPE: {item.type.toUpperCase()}</span>
                      <h4 className="font-primary" style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>{item.name}</h4>
                      <p className="font-primary" style={{ opacity: 0.6, fontSize: '0.9rem' }}>Rp {item.price.toLocaleString()}</p>
                    </div>
                    <div className="cart-item-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {item.type === 'photostrip' && (
                        <button onClick={() => handleEditPhotostrip(item)} className="btn-liquid" style={{ fontSize: '10px', padding: '0.6rem 1rem' }}>
                          INJECT_DATA
                        </button>
                      )}
                      <button onClick={handleCheckoutFromCart} className="btn-liquid" style={{ fontSize: '10px', padding: '0.6rem 1rem' }}>
                        CHECKOUT
                      </button>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="nav-btn"
                        style={{ padding: '0.5rem', color: '#ff4d4d', background: 'transparent', border: 'none' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="font-pixel" style={{ fontSize: '10px', opacity: 0.6 }}>SUBTOTAL</span>
                      <span className="font-primary" style={{ fontWeight: 700 }}>Rp {calculateTotal().toLocaleString()}</span>
                    </div>
                    {cart.filter(i => i.type === 'photostrip').length >= 4 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccff00', fontSize: '10px' }} className="font-pixel">
                        <span>BULK_DISCOUNT_APPLIED</span>
                        <span>SAVED_BY_FLAM_PROMO</span>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setCurrentView('home')} className="cart-continue-btn" style={{ margin: 0 }}>
                    ← ADD_MORE_FRAGMENTS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'builder' && <PhotostripView key={activeTemplate.id} initialTemplate={activeTemplate} onCheckout={handleCheckoutFromBuilder} />}

        {currentView === 'checkout' && (
          <CheckoutView
            cart={cart}
            totalPrice={calculateTotal()}
            onSuccess={() => {
              setCart([]);
            }}
            onBack={() => setCurrentView('cart')}
          />
        )}

        {currentView === 'admin' && <AdminView />}
      </main>

      <nav className="mobile-nav">
        <button onClick={() => setCurrentView('home')} className={`m-nav-btn ${currentView === 'home' ? 'active' : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>✦</span>
          <span style={{ fontSize: '9px', fontWeight: 700 }}>ARCHIVES</span>
        </button>
        <button onClick={() => setCurrentView('cart')} className={`m-nav-btn ${currentView === 'cart' ? 'active' : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>🛒</span>
          <span style={{ fontSize: '9px', fontWeight: 700 }}>BAG</span>
        </button>
        <button onClick={() => setCurrentView('builder')} className={`m-nav-btn ${currentView === 'builder' ? 'active' : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>⌬</span>
          <span style={{ fontSize: '9px', fontWeight: 700 }}>STUDIO</span>
        </button>
      </nav>

      <footer className="footer-visual">
        <img src="/logo/favicon-01.png" alt="Logo" className="nav-logo-img" style={{ marginBottom: '3rem', opacity: 0.5 }} />
        <p className="footer-quote">
          "Archiving moments, crafting artifacts—for those who feel the weight of digital nostalgia."
        </p>
        <div className="footer-meta">
          <span onClick={() => setCurrentView('admin')} style={{ cursor: 'default' }}>JKT / ID</span>
          <span>&copy; {new Date().getFullYear()} Visual Syndicate</span>
        </div>
      </footer>

      {isCheckoutOpen && selectedProduct && (
        <CheckoutModal
          product={selectedProduct}
          templateName={selectedTemplateName}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
