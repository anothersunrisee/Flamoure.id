
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  // Preload Critical Assets
  useEffect(() => {
    const assets = [
      '/logo/favicon-01.png',
      ...PHOTOSTRIP_SERIES.map(p => p.image),
      ...KEYCHAIN_PRODUCTS.map(p => p.image),
      ...STICKER_PRODUCTS.map(p => p.image).slice(0, 5), // Only first 5 stickers to save time
    ];

    let loadedCount = 0;
    const total = assets.length;

    const loadAsset = (src: string) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          loadedCount++;
          setLoadProgress(Math.round((loadedCount / total) * 100));
          resolve(src);
        };
        img.onerror = () => {
          loadedCount++; // Count even if error to avoid stuck loading
          setLoadProgress(Math.round((loadedCount / total) * 100));
          resolve(src);
        };
      });
    };

    Promise.all(assets.map(loadAsset)).then(() => {
      // Small delay for branding visibility
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => setIsLoading(false), 800);
      }, 1500);
    });
  }, []);

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
    const checkHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#sysadminpanel') {
        setCurrentView('admin');
      }
    };

    // Run once on load
    checkHash();

    // Listen for changes
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

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
    // When selecting a series, we don't automatically add it to cart.
    // Instead, we open the builder with that series template.
    const template = TEMPLATES.find(t => t.backgroundImage === series.image) || TEMPLATES[0];
    setActiveTemplate(template);
    setSelectedProduct(series);
    setIsEditing(false);
    setCurrentView('builder');
  };

  const handleEditPhotostrip = (item: Product) => {
    const template = TEMPLATES.find(t => t.name === item.metadata?.templateName) ||
      TEMPLATES.find(t => t.backgroundImage === item.image) ||
      TEMPLATES[0];
    setActiveTemplate(template);
    setSelectedProduct(item);
    setIsEditing(true);
    setCurrentView('builder');
  };

  const addToCart = (product: Product, metadata?: any) => {
    setCart(prev => {
      // Check if product already exists
      const existingItemIndex = prev.findIndex(item => {
        if (item.id !== product.id) return false;
        if (item.type === 'photostrip' && metadata?.images) {
          // Photostrips only match if they have the EXACT same images
          return JSON.stringify(item.metadata?.images) === JSON.stringify(metadata.images);
        }
        return true;
      });

      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: (newCart[existingItemIndex].quantity || 1) + 1
        };
        return newCart;
      }

      return [...prev, { ...product, quantity: 1, metadata }];
    });
    setCurrentView('cart');
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      const newQty = (item.quantity || 1) + delta;
      if (newQty <= 0) return prev;
      newCart[index] = { ...item, quantity: newQty };
      return newCart;
    });
  };

  const calculateTotal = () => {
    // New simplified but accurate total
    let total = 0;
    let psPool: Product[] = []; // for bulk discount calculation

    cart.forEach(item => {
      if (item.type === 'photostrip') {
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) psPool.push(item);
      } else {
        total += item.price * (item.quantity || 1);
      }
    });

    // PS Logic: 3000 each, 4 for 10000
    const psBundles = Math.floor(psPool.length / 4);
    const psRemainder = psPool.length % 4;
    total += (psBundles * 10000) + (psRemainder * 3000);

    return total;
  };

  const handleCheckoutFromBuilder = (templateName: string, images: string[], files: File[]) => {
    if (selectedProduct) {
      addToCart(selectedProduct, { templateName, images, files });
    }
  };

  const handleCheckoutFromCart = () => {
    setCurrentView('checkout');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className={`preloader ${isExiting ? 'fade-exit-active' : ''}`}>
        <div className="preloader-content text-center">
          <div className="preloader-logo font-serif">FLAMOURE</div>
          <div className="preloader-status font-pixel">CRAFTING_YOUR_ARTIFACTS...</div>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <div className="preloader-bar">
              <div className="preloader-progress" style={{ width: `${loadProgress}%` }}></div>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }} className="font-pixel">
            <span style={{ fontSize: '9px', opacity: 0.4 }}>LOADING_SEQUENCE_{loadProgress}%</span>
          </div>
        </div>
      </div>
    );
  }

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
              onClick={() => {
                if (!selectedProduct) setSelectedProduct(PHOTOSTRIP_SERIES[0]);
                setCurrentView('builder');
              }}
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
                  <div key={idx} className="cart-item" style={{ alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '1.25rem' }}>
                    <div style={{ position: 'relative', width: '80px', height: '110px', background: 'var(--bg-primary)', padding: '5px', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {item.type === 'photostrip' && item.metadata?.images ? (
                        item.metadata.images.map((img: string, i: number) => (
                          <img key={i} src={img} alt="" style={{ width: '100%', height: '30px', objectFit: 'cover', borderRadius: '2px' }} />
                        ))
                      ) : (
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                      {item.type === 'photostrip' && item.metadata?.images && (
                        <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--accent-blue)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', border: '2px solid var(--bg-primary)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                          ✓
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, marginLeft: '1.5rem' }}>
                      <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '9px', letterSpacing: '0.1em' }}>{item.type.toUpperCase()}</span>
                      <h4 className="font-primary" style={{ fontSize: '1.1rem', fontWeight: 800, margin: '2px 0' }}>{item.name}</h4>
                      <p className="font-pixel" style={{ opacity: 0.5, fontSize: '10px' }}>UNIT_PRICE: Rp {item.price.toLocaleString()}</p>

                      {item.type === 'photostrip' && (
                        <button
                          onClick={() => handleEditPhotostrip(item)}
                          className="font-pixel"
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--accent-blue)',
                            fontSize: '8px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            marginTop: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          [ EDIT_ARTIFACT ]
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div className="qty-control" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '0.75rem', padding: '0.25rem', border: '1px solid var(--border-color)' }}>
                        <button onClick={() => updateQuantity(idx, -1)} className="qty-btn" style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px' }}>-</button>
                        <span className="font-pixel" style={{ width: '30px', textAlign: 'center', fontSize: '12px' }}>{item.quantity || 1}</span>
                        <button onClick={() => updateQuantity(idx, 1)} className="qty-btn" style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px' }}>+</button>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <span className="font-primary" style={{ fontWeight: 800, fontSize: '1.1rem' }}>Rp {(item.price * (item.quantity || 1)).toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => removeFromCart(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '0.5rem', fontSize: '16px', opacity: 0.5 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: 'fit-content',
                    minWidth: '400px',
                    background: 'var(--bg-secondary)',
                    padding: '1.5rem 2.5rem',
                    borderRadius: '1.5rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '4rem'
                  }}>
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span className="font-pixel" style={{ fontSize: '10px', opacity: 0.6 }}>TOTAL_SUBTOTAL</span>
                      </div>
                      <span className="font-primary" style={{ fontSize: '2rem', fontWeight: 900, display: 'block' }}>Rp {calculateTotal().toLocaleString()}</span>

                      {cart.some(i => (i.type === 'photostrip' && (i.quantity || 1) >= 4) || (cart.filter(item => item.type === 'photostrip').reduce((acc, curr) => acc + (curr.quantity || 1), 0) >= 4)) && (
                        <div style={{ color: '#ccff00', fontSize: '9px', marginTop: '0.5rem' }} className="font-pixel">
                          [ BULK_DISCOUNT_APPLIED ]
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleCheckoutFromCart}
                      className="btn-liquid"
                      style={{
                        background: 'var(--accent-blue)',
                        color: '#fff',
                        borderColor: 'var(--accent-blue)',
                        padding: '1.25rem 2.5rem',
                        fontSize: '12px',
                        fontWeight: 900,
                        boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      PROCEED_TO_CHECKOUT ➔
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => setCurrentView('home')} className="cart-continue-btn" style={{ margin: 0 }}>
                    ← ADD_MORE_FRAGMENTS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'builder' && <PhotostripView key={activeTemplate.id} initialTemplate={activeTemplate} lockStyle={isEditing} onCheckout={handleCheckoutFromBuilder} />}

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
        <button onClick={() => {
          if (!selectedProduct) setSelectedProduct(PHOTOSTRIP_SERIES[0]);
          setCurrentView('builder');
        }} className={`m-nav-btn ${currentView === 'builder' ? 'active' : ''}`}>
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
          <span>JKT / ID</span>
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
