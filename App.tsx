
// Build trigger: checkout flow refinement v1.0.1
import React, { useState, useEffect } from 'react';
import { LandingView } from './views/LandingView';
import { PhotostripView } from './views/PhotostripView';
import { CheckoutView } from './components/CheckoutView';
const AdminView = React.lazy(() => import('./views/AdminView').then(module => ({ default: module.AdminView })));


import { CheckoutModal } from './components/CheckoutModal';
import { Product, PhotostripTemplate } from './types';
import html2canvas from 'html2canvas'; // Import html2canvas
import { TEMPLATES, PHOTOSTRIP_SERIES, KEYCHAIN_PRODUCTS, STICKER_PRODUCTS } from './constants';
import { LANGUAGES } from './translations';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'builder' | 'cart' | 'series' | 'shop' | 'checkout' | 'admin'>('home');
  const [cart, setCart] = useState<Product[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<PhotostripTemplate>(TEMPLATES[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [shopCategory, setShopCategory] = useState<'all' | 'keychain' | 'sticker'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");
  const [lastOrder, setLastOrder] = useState<any | null>(null); // State for Last Order
  const [language, setLanguage] = useState<'ID' | 'EN'>('EN'); // Language State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [shouldScrollToCollection, setShouldScrollToCollection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Translation Helper
  const t = LANGUAGES[language];

  // Preload Critical Assets
  useEffect(() => {
    // Load Last Order from Cache
    const savedOrder = localStorage.getItem('last_order');
    if (savedOrder) {
      try {
        setLastOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Failed to parse last order", e);
      }
    }

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
    // Reset scroll target if leaving home, so next visit to home doesn't auto-scroll unless requested
    if (currentView !== 'home') {
      setShouldScrollToCollection(false);
    }
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

  const generateLastOrderInvoice = async () => {
    const element = document.getElementById('last-order-invoice-capture');
    if (!element || !lastOrder) return;

    try {
      const canvas = await html2canvas(element, { backgroundColor: '#111', scale: 2 });
      const link = document.createElement('a');
      link.download = `INVOICE_${lastOrder.orderInfo.code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Invoice generation failed', err);
    }
  };

  const generateLastOrderWhatsApp = () => {
    if (!lastOrder) return '#';
    const phone = "62895363898438";
    const text = encodeURIComponent(
      `Halo Flamoure! Saya ingin konfirmasi pesanan saya sebelumnya.\n\n` +
      `*Order Code:* ${lastOrder.orderInfo.code}\n` +
      `*Nama:* ${lastOrder.customerData.customer_name}\n` +
      `*Total:* Rp ${lastOrder.finalPrice.toLocaleString()}\n\n` +
      `Mohon bantuannya ya.`
    );
    return `https://wa.me/${phone}?text=${text}`;
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
              {t.NAV_ARCHIVES}
            </button>
            <button
              onClick={() => setCurrentView('cart')}
              className={`nav-btn ${currentView === 'cart' ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              {t.NAV_BAG}
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
              {t.NAV_STUDIO}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'EN' ? 'ID' : 'EN')}
              className="theme-toggle"
              style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-pixel)', borderRadius: '1rem', width: 'auto', padding: '0 10px' }}
              title="Switch Language"
            >
              {language}
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="theme-toggle"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ color: isDarkMode ? '#f5f5f5' : '#1a1a1a' }}
            >
              {isDarkMode ? '☼' : '◑'}
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'home' && <LandingView onProductClick={handleLandingProductClick} scrollToCollection={shouldScrollToCollection} language={language} />}

        {currentView === 'series' && (
          <div className="container" style={{ paddingTop: '8rem', paddingBottom: '8rem' }}>
            <button onClick={() => setCurrentView('home')} style={{ marginBottom: '2rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-pixel)' }}>
              {t.CHECKOUT_RETURN}
            </button>
            <h2 className="font-serif" style={{ fontSize: '3rem', marginBottom: '4rem' }}>Photostrip Series</h2>
            <div className="collection-grid">
              {PHOTOSTRIP_SERIES.map((p, idx) => (
                <div key={p.id} className="product-card" onClick={() => handleSeriesSelect(p)}>
                  <div style={{ aspectRatio: '4/5', borderRadius: '1.25rem', overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <span className="font-pixel" style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent-blue)', opacity: 0.6 }}>SERIES_MODULE</span>
                    <h4 className="font-primary" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>{p.name}</h4>
                    <p className="font-primary" style={{ marginTop: '0.5rem', fontWeight: 800 }}>Rp {p.price.toLocaleString()}</p>
                    <button className="btn-liquid" style={{ width: '100%', marginTop: '1rem', fontSize: '10px', padding: '0.75rem' }}>
                      {t.LANDING_SELECT_SERIES}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'shop' && (
          <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className="flex justify-between items-end mb-8">
              <h2 className="font-serif" style={{ fontSize: '3rem' }}>
                {shopCategory === 'keychain' ? 'Artifact Keychains' : 'Underground Stickers'}
              </h2>
              <button onClick={() => setCurrentView('home')} className="font-pixel" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                {t.CHECKOUT_RETURN}
              </button>
            </div>

            <div className="collection-grid">
              {(shopCategory === 'keychain' ? KEYCHAIN_PRODUCTS : STICKER_PRODUCTS).map((p) => (
                <div key={p.id} className="product-card">
                  <div style={{ aspectRatio: '4/5', borderRadius: '1.25rem', overflow: 'hidden', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <span className="font-pixel" style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent-blue)', opacity: 0.6 }}>VISUAL_GOODS</span>
                    <h4 className="font-primary" style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>{p.name}</h4>
                    <p className="font-primary" style={{ marginTop: '0.5rem', fontWeight: 800 }}>Rp {p.price.toLocaleString()}</p>
                    <button onClick={() => addToCart(p)} className="btn-liquid" style={{ width: '100%', marginTop: '1.25rem', fontSize: '10px' }}>
                      {t.CART_ADD_1}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {currentView === 'cart' && (
          <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center' }}>
            <h2 className="font-serif" style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)', marginBottom: '3rem' }}>{t.CART_TITLE}</h2>

            {/* --- Last Order Recovery Section --- */}
            {lastOrder && (
              <div className="animate-fade-in" style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--accent-blue)',
                padding: '2rem',
                borderRadius: '1.5rem',
                marginBottom: '4rem',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-blue)' }}></div>
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '10px', letterSpacing: '0.1em' }}>{t.LAST_ORDER_RECOVERY}</span>
                    <h3 className="font-primary" style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '0.5rem' }}>#{lastOrder.orderInfo.code}</h3>
                    <p className="font-pixel" style={{ opacity: 0.5, fontSize: '10px', marginTop: '0.25rem' }}>
                      {new Date(lastOrder.timestamp).toLocaleDateString()} • {new Date(lastOrder.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="font-pixel" style={{ opacity: 0.5, fontSize: '10px' }}>{t.LAST_ORDER_TOTAL_VALUE}</span>
                    <div className="font-primary" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Rp {lastOrder.finalPrice.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button onClick={generateLastOrderInvoice} className="btn-liquid" style={{ flex: 1, fontSize: '10px', padding: '1rem', background: 'transparent', border: '1px solid var(--border-color)' }}>
                    {t.LAST_ORDER_DOWNLOAD}
                  </button>
                  <a href={generateLastOrderWhatsApp()} target="_blank" rel="noreferrer" className="btn-liquid" style={{ flex: 1, fontSize: '10px', padding: '1rem', background: 'var(--accent-blue)', color: 'white', textDecoration: 'none', textAlign: 'center', borderColor: 'var(--accent-blue)' }}>
                    {t.LAST_ORDER_WHATSAPP}
                  </a>
                </div>

                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                  <div id="last-order-invoice-capture" style={{
                    width: '380px',
                    padding: '40px',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontFamily: 'var(--font-primary)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid #222'
                  }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', fontSize: '5rem', opacity: 0.03, fontFamily: 'var(--font-serif)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                      FLAMOURE
                    </div>
                    <div style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', margin: 0, lineHeight: 0.8 }}>FLAMOURE</h3>
                          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', opacity: 0.5, letterSpacing: '0.2em' }}>OFFICIAL_ARTIFACT_INVOICE</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', display: 'block' }}>ORD_CODE</span>
                          <strong style={{ fontSize: '14px', color: 'var(--accent-blue)' }}>#{lastOrder.orderInfo.code}</strong>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '30px', fontSize: '11px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <span style={{ opacity: 0.4, display: 'block', marginBottom: '4px' }} className="font-pixel">ISSUED_TO</span>
                          <strong style={{ fontSize: '12px' }}>{lastOrder.customerData.customer_name}</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ opacity: 0.4, display: 'block', marginBottom: '4px' }} className="font-pixel">DATE_STAMP</span>
                          <strong style={{ fontSize: '12px' }}>{new Date(lastOrder.timestamp).toLocaleDateString('id-ID')}</strong>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                      <span style={{ opacity: 0.4, display: 'block', marginBottom: '15px' }} className="font-pixel">MANIFEST_DETAILS</span>
                      {lastOrder.finalCart.map((item: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{item.name}</div>
                            <div style={{ fontSize: '9px', opacity: 0.5 }}>{item.quantity || 1} UNIT(S)</div>
                          </div>
                          <span style={{ fontWeight: 800 }}>Rp {(item.price * (item.quantity || 1)).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', opacity: 0.6 }}>SETTLEMENT_TOTAL</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)' }}>Rp {lastOrder.finalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {cart.length === 0 ? (
              <div style={{ padding: '4rem 0' }}>
                <p className="font-pixel" style={{ opacity: 0.5, fontSize: '1.2rem' }}>{t.CART_EMPTY}</p>
                <button onClick={() => { setShouldScrollToCollection(true); setCurrentView('home'); }} className="cart-continue-btn" style={{ margin: '3rem auto 0' }}>
                  {t.CART_EXPLORE}
                </button>
              </div>
            ) : (
              <div className="cart-list" style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <span className="font-pixel" style={{ opacity: 0.5 }}>{t.CART_ITEM_LIST} ({cart.length})</span>
                  <div style={{ textAlign: 'right' }}>
                    <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '10px', display: 'block' }}>{t.CART_ESTIMATED_TOTAL}</span>
                    <span className="font-primary" style={{ fontSize: '1.5rem', fontWeight: 900 }}>Rp {calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                {cart.map((item, idx) => (
                  <div key={idx} className="cart-item" style={{ alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '1.25rem' }}>
                    <div className="thumb-box" style={{ width: '80px', height: '80px', borderRadius: '1rem' }}>
                      <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ flex: 1, marginLeft: '1.5rem' }}>
                      <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '9px', letterSpacing: '0.1em' }}>{item.type.toUpperCase()}</span>
                      <h4 className="font-primary" style={{ fontSize: '1.1rem', fontWeight: 800, margin: '2px 0' }}>{item.name}</h4>
                      <p className="font-pixel" style={{ opacity: 0.5, fontSize: '10px' }}>{t.CART_UNIT_PRICE}: Rp {item.price.toLocaleString()}</p>

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
                          {t.CART_EDIT_ARTIFACT}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="font-primary" style={{ fontWeight: 800, fontSize: '1.2rem' }}>Rp {((item.quantity || 1) * item.price).toLocaleString()}</div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2" style={{ background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <button
                            onClick={() => updateQuantity(idx, -1)}
                            style={{
                              width: '28px', height: '28px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--bg-secondary)', border: 'none',
                              color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '1.2rem'
                            }}
                          >
                            -
                          </button>
                          <span className="font-pixel" style={{ width: '20px', textAlign: 'center', fontSize: '12px' }}>{item.quantity || 1}</span>
                          <button
                            onClick={() => updateQuantity(idx, 1)}
                            style={{
                              width: '28px', height: '28px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--bg-secondary)', border: 'none',
                              color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '1.2rem'
                            }}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(idx)}
                          style={{
                            height: '38px',
                            padding: '0 1rem',
                            border: '1px solid #ff4d4d',
                            background: 'rgba(255, 77, 77, 0.1)',
                            color: '#ff4d4d',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-pixel)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            letterSpacing: '0.1em'
                          }}
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* --- Recommendations Section --- */}
                <div style={{ marginTop: '4rem', paddingTop: '4rem', borderTop: '1px solid var(--border-color)' }}>
                  <h4 className="font-pixel" style={{ fontSize: '12px', color: 'var(--accent-blue)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t.CART_RECOMMENDED}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {[...KEYCHAIN_PRODUCTS.slice(0, 2), ...STICKER_PRODUCTS.slice(0, 2)].map(p => (
                      <div key={'rec-' + p.id} className="product-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ aspectRatio: '4/5', background: 'var(--bg-primary)', borderRadius: '0.75rem', marginBottom: '1rem', overflow: 'hidden' }}>
                          <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h5 className="font-primary" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{p.name}</h5>
                        <p className="font-primary" style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '1rem' }}>Rp {p.price.toLocaleString()}</p>
                        <button onClick={() => addToCart(p)} className="btn-liquid" style={{ width: '100%', padding: '0.5rem', fontSize: '9px' }}>
                          {t.CART_ADD_1}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '500px',
                    background: 'var(--bg-secondary)',
                    padding: '1.5rem 2rem',
                    borderRadius: '1.5rem',
                    /* ... */
                  }}>
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span className="font-pixel" style={{ fontSize: '10px', opacity: 0.6 }}>{t.CART_TOTAL_SUBTOTAL}</span>
                      </div>
                      <span className="font-primary" style={{ fontSize: '2rem', fontWeight: 900, display: 'block' }}>Rp {calculateTotal().toLocaleString()}</span>

                      {cart.some(i => (i.type === 'photostrip' && (i.quantity || 1) >= 4) || (cart.filter(item => item.type === 'photostrip').reduce((acc, curr) => acc + (curr.quantity || 1), 0) >= 4)) && (
                        <div style={{ color: '#ccff00', fontSize: '10px', marginTop: '0.5rem', fontWeight: 700 }} className="font-pixel">
                          {t.CART_BULK_DISCOUNT}
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
                        width: '100%',
                        marginTop: '1.5rem'
                      }}
                    >
                      {t.CART_PROCEED}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => { setShouldScrollToCollection(true); setCurrentView('home'); }} className="cart-continue-btn" style={{ margin: 0 }}>
                    {t.CART_ADD_MORE}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'builder' && <PhotostripView key={activeTemplate.id} initialTemplate={activeTemplate} lockStyle={isEditing} onCheckout={handleCheckoutFromBuilder} language={language} />}

        {currentView === 'checkout' && (
          <CheckoutView
            cart={cart}
            totalPrice={calculateTotal()}
            onSuccess={(orderCode) => {
              setCart([]);
              // Update lastOrder state immediately so it appears if user navigates to cart later
              const saved = localStorage.getItem('last_order');
              if (saved) {
                setLastOrder(JSON.parse(saved));
              }
              // Do NOT switch view here. Let CheckoutView show the success screen.
            }}
            onBack={() => setCurrentView('cart')}
            language={language}
          />
        )}

        {currentView === 'admin' && (
          <React.Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-black text-white font-pixel" style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="text-center opacity-50">
                <div style={{ marginBottom: '1rem' }}>SYSTEM_MOUNTING</div>
                <div style={{ fontSize: '9px' }}>LOADING_ADMIN_MODULE...</div>
              </div>
            </div>
          }>
            <AdminView />
          </React.Suspense>
        )}

        {currentView !== 'admin' && (
          <footer className="container" style={{ padding: '12rem 2rem 6rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-10">
              {/* Logo */}
              <img src="/logo/favicon-01.png" alt="Star" style={{ width: '60px', opacity: 0.8 }} />

              {/* Quote */}
              <h3 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', lineHeight: '1.3', maxWidth: '800px', margin: '1rem auto' }}>
                "Archiving moments, crafting artifacts—for those who feel the weight of digital nostalgia."
              </h3>

              {/* Bottom Info */}
              <div className="flex gap-12 mt-12" style={{ opacity: 0.4 }}>
                <span className="font-pixel" style={{ fontSize: '10px', letterSpacing: '0.25em' }}>JKT / ID</span>
                <span className="font-pixel" style={{ fontSize: '10px', letterSpacing: '0.25em' }}>© 2026 VISUAL SYNDICATE</span>
              </div>
            </div>
          </footer>
        )}
      </main>

      <nav className="mobile-nav">
        <button onClick={() => setCurrentView('home')} className={`m-nav-btn ${currentView === 'home' ? 'active' : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>✦</span>
          <span style={{ fontSize: '9px', fontWeight: 700 }}>{t.NAV_ARCHIVES}</span>
        </button>
        <button onClick={() => setCurrentView('cart')} className={`m-nav-btn ${currentView === 'cart' ? 'active' : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>🛒</span>
          <span style={{ fontSize: '9px', fontWeight: 700 }}>{t.NAV_BAG}</span>
        </button>
        <button onClick={() => {
          if (!selectedProduct) setSelectedProduct(PHOTOSTRIP_SERIES[0]);
          setCurrentView('builder');
        }} className={`m-nav-btn ${currentView === 'builder' ? 'active' : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>⌬</span>
          <span style={{ fontSize: '9px', fontWeight: 700 }}>{t.NAV_STUDIO}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
