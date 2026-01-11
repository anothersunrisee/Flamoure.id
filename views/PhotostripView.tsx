
import React, { useState, useRef, useEffect } from 'react';
import { TEMPLATES } from '../constants';
import { PhotostripTemplate } from '../types';

interface ImageConfig {
  scale: number;
  x: number;
  y: number;
  rotation: number;
}

interface PhotostripViewProps {
  initialTemplate?: PhotostripTemplate;
  onCheckout: (templateName: string) => void;
}

type EditorTab = 'FRAMES' | 'ADJUST' | 'STYLE';

export const PhotostripView: React.FC<PhotostripViewProps> = ({ initialTemplate, onCheckout }) => {
  const [images, setImages] = useState<string[]>([]);
  const [configs, setConfigs] = useState<ImageConfig[]>([
    { scale: 1, x: 0, y: 0, rotation: 0 },
    { scale: 1, x: 0, y: 0, rotation: 0 },
    { scale: 1, x: 0, y: 0, rotation: 0 },
  ]);

  const [activeTab, setActiveTab] = useState<EditorTab>('FRAMES');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [selectedTemplate, setSelectedTemplate] = useState<PhotostripTemplate>(initialTemplate || TEMPLATES[0]);
  const [swapSourceIndex, setSwapSourceIndex] = useState<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<ImageConfig[][]>([]);
  const [future, setFuture] = useState<ImageConfig[][]>([]);

  const saveToHistory = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(configs))].slice(-20));
    setFuture([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const current = JSON.parse(JSON.stringify(configs));
    const previous = history[history.length - 1];
    setFuture(prev => [current, ...prev]);
    setConfigs(previous);
    setHistory(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (future.length === 0) return;
    const current = JSON.parse(JSON.stringify(configs));
    const next = future[0];
    setHistory(prev => [...prev, current]);
    setConfigs(next);
    setFuture(prev => prev.slice(1));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const step = e.shiftKey ? 20 : 5;
      const scaleStep = 0.05;
      const rotStep = 5;

      switch (e.key) {
        case 'ArrowUp': panStep('u', step); break;
        case 'ArrowDown': panStep('d', step); break;
        case 'ArrowLeft': panStep('l', step); break;
        case 'ArrowRight': panStep('r', step); break;
        case '+': case '=': updateConfig(activeSlot, 'scale', Math.min(configs[activeSlot].scale + scaleStep, 4)); break;
        case '-': case '_': updateConfig(activeSlot, 'scale', Math.max(configs[activeSlot].scale - scaleStep, 1)); break;
        case '[': updateConfig(activeSlot, 'rotation', configs[activeSlot].rotation - rotStep); break;
        case ']': updateConfig(activeSlot, 'rotation', configs[activeSlot].rotation + rotStep); break;
        case 'z': if (e.ctrlKey || e.metaKey) undo(); break;
        case 'y': if (e.ctrlKey || e.metaKey) redo(); break;
        case '1': case '2': case '3': case '4': setActiveSlot(parseInt(e.key) - 1); break;
        case 'Delete': case 'Backspace': if (images[activeSlot]) removeImage(activeSlot); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlot, configs, images, history, future]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = 3 - images.length;
    if (remainingSlots <= 0) return;

    setIsProcessing(true);
    saveToHistory();
    const newImages = Array.from(files).slice(0, remainingSlots).map(file => URL.createObjectURL(file as Blob));
    setImages(prev => [...prev, ...newImages]);
    setIsProcessing(false);
  };

  const removeImage = (index: number) => {
    saveToHistory();
    setImages(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setConfigs(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return [...next, { scale: 1, x: 0, y: 0, rotation: 0 }];
    });
  };

  const updateConfig = (index: number, key: keyof ImageConfig, value: number) => {
    setConfigs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSlotClick = (index: number) => {
    if (swapSourceIndex !== null) {
      if (swapSourceIndex === index) {
        setSwapSourceIndex(null);
        return;
      }
      saveToHistory();
      const newImages = [...images];
      const newConfigs = [...configs];
      [newImages[swapSourceIndex], newImages[index]] = [newImages[index], newImages[swapSourceIndex]];
      [newConfigs[swapSourceIndex], newConfigs[index]] = [newConfigs[index], newConfigs[swapSourceIndex]];
      setImages(newImages);
      setConfigs(newConfigs);
      setSwapSourceIndex(null);
      setActiveSlot(index);
    } else {
      setActiveSlot(index);
    }
  };

  const panStep = (dir: 'u' | 'd' | 'l' | 'r', step = 10) => {
    if (dir === 'u') updateConfig(activeSlot, 'y', configs[activeSlot].y - step);
    if (dir === 'd') updateConfig(activeSlot, 'y', configs[activeSlot].y + step);
    if (dir === 'l') updateConfig(activeSlot, 'x', configs[activeSlot].x - step);
    if (dir === 'r') updateConfig(activeSlot, 'x', configs[activeSlot].x + step);
  };

  // Direct Interaction Handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!images[activeSlot]) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      initialX: configs[activeSlot].x,
      initialY: configs[activeSlot].y
    };

    saveToHistory();
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;

    updateConfig(activeSlot, 'x', dragStartRef.current.initialX + dx);
    updateConfig(activeSlot, 'y', dragStartRef.current.initialY + dy);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!images[activeSlot]) return;
    e.preventDefault();
    const scaleStep = 0.02;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newScale = Math.min(Math.max(configs[activeSlot].scale + (direction * scaleStep), 1), 4);
    updateConfig(activeSlot, 'scale', newScale);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  return (
    <div className="studio-view">
      <div className="container" style={{ maxWidth: '1200px' }}> {/* Slightly wider for desktop */}

        {/* Status Bar */}
        <div className="studio-status-bar">
          <div className="flex gap-6 items-center">
            <div className="flex flex-col">
              <span className="font-pixel" style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Archive_Unit</span>
              <span className="font-pixel" style={{ fontSize: '16px' }}>A-00{selectedTemplate.id.length}</span>
            </div>
            <div className="hide-mobile" style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
            <div className="flex flex-col hide-mobile">
              <span className="font-pixel" style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</span>
              <span className="font-pixel" style={{ fontSize: '16px', color: isProcessing ? '#3b82f6' : '#ccff00' }}>
                {isProcessing ? 'SCANNING...' : 'STABLE_CORE'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4">
            <button onClick={undo} disabled={history.length === 0} className="nav-btn" style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', opacity: history.length ? 1 : 0.3, fontSize: '13px', fontWeight: 700 }}>⟲ UNDO</button>
            <button onClick={redo} disabled={future.length === 0} className="nav-btn" style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', opacity: future.length ? 1 : 0.3, fontSize: '13px', fontWeight: 700 }}>REDO ⟳</button>
          </div>
        </div>

        <div className="studio-layout">

          {/* Left Side: Preview */}
          <div className="preview-station">
            <div
              className={`photostrip-canvas ${isDragging ? 'is-manipulating' : ''}`}
              onWheel={handleWheel}
              style={{
                backgroundColor: selectedTemplate.bgColor,
                border: `1px solid ${selectedTemplate.borderColor}`,
                cursor: images[activeSlot] ? (isDragging ? 'grabbing' : 'grab') : 'default',
                width: '190px',
                height: '640px' // Taller canvas for full decoration
              }}
            >
              {/* Background/Frame Overlay */}
              {selectedTemplate.backgroundImage && (
                <img
                  src={encodeURI(selectedTemplate.backgroundImage)}
                  alt="frame"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 50,
                    pointerEvents: 'none',
                    objectFit: 'fill'
                  }}
                />
              )}
              <div className="frames-list" style={{
                position: 'relative',
                zIndex: 10,
                padding: selectedTemplate.backgroundImage ? '0' : '20px',
                gap: selectedTemplate.backgroundImage ? '28px' : '10px'
              }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`frame-slot ${activeSlot === i ? 'active' : ''}`}
                    onClick={() => handleSlotClick(i)}
                    onMouseDown={activeSlot === i ? handleDragStart : undefined}
                    onTouchStart={activeSlot === i ? handleDragStart : undefined}
                    style={{
                      border: swapSourceIndex === i ? '2px solid #ccff00' : (activeSlot === i ? '1px solid var(--accent-blue)' : 'none'),
                      boxShadow: activeSlot === i ? '0 0 20px rgba(37, 99, 235, 0.1)' : 'none',
                      background: 'transparent',
                      // Precise Pixel Placement for 3-frame vertical rectangles
                      marginTop: selectedTemplate.backgroundImage && i === 0 ? '40px' : '0',
                      marginBottom: selectedTemplate.backgroundImage && i === 2 ? '100px' : '0',
                      marginRight: selectedTemplate.backgroundImage ? '25px' : '0',
                      marginLeft: selectedTemplate.backgroundImage ? '25px' : '0',
                      borderRadius: selectedTemplate.backgroundImage ? '0' : '4px'
                    }}
                  >
                    {images[i] ? (
                      <img
                        src={images[i]}
                        alt="slot"
                        className="photostrip-image"
                        draggable={false}
                        style={{
                          transform: `scale(${configs[i].scale}) translate(${configs[i].x / configs[i].scale}px, ${configs[i].y / configs[i].scale}px) rotate(${configs[i].rotation}deg)`,
                          transition: isDragging && activeSlot === i ? 'none' : 'transform 0.4s cubic-bezier(0.2, 1, 0.2, 1)',
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          position: 'relative',
                          zIndex: 1
                        }}
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full opacity-5">
                        <span className="font-pixel" style={{ fontSize: '20px' }}>{i + 1} ❐</span>
                      </div>
                    )}
                    {swapSourceIndex === i && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(204, 255, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="font-pixel" style={{ fontSize: '8px', background: '#ccff00', color: '#000', padding: '2px 6px' }}>SOURCE</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                <span className="font-script" style={{ fontSize: '2rem', color: selectedTemplate.textColor, opacity: 0.8 }}>Flamoure</span>
                <p className="font-pixel" style={{ fontSize: '8px', color: selectedTemplate.textColor, opacity: 0.3, marginTop: '8px', letterSpacing: '0.4em' }}>Verified Artifact No. 7192</p>
              </div>
            </div>

            <div className="flex gap-4" style={{ marginTop: '2rem' }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  onClick={() => setActiveSlot(i)}
                  style={{
                    width: activeSlot === i ? '2rem' : '0.5rem',
                    height: '0.5rem',
                    borderRadius: '999px',
                    background: activeSlot === i ? 'var(--accent-blue)' : 'var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.5s ease'
                  }}
                />
              ))}
            </div>

            <p className="font-pixel hide-mobile" style={{ fontSize: '12px', marginTop: '2rem', opacity: 0.6, letterSpacing: '0.05em' }}>
              [TIP] Drag to Pan • Scroll to Zoom • Arrow Keys for Fine Tuning
            </p>
          </div>

          {/* Right Side: Controls */}
          <div className="control-station">
            <div className="tab-nav">
              {(['FRAMES', 'ADJUST', 'STYLE'] as EditorTab[]).map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ minHeight: '400px' }}>
              {activeTab === 'FRAMES' && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-primary" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Image Matrix</h3>
                      <p className="font-pixel" style={{ fontSize: '13px', opacity: 0.8, textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>Sequence Management</p>
                    </div>
                    {images.length >= 2 && (
                      <button
                        onClick={() => setSwapSourceIndex(prev => prev === null ? activeSlot : null)}
                        className="font-pixel"
                        style={{ fontSize: '11px', border: 'none', background: 'transparent', cursor: 'pointer', color: swapSourceIndex !== null ? '#ff4d4d' : 'var(--accent-blue)', textDecoration: 'underline' }}
                      >
                        {swapSourceIndex !== null ? '[ Cancel_Swap ]' : '[ Swap_Positions ]'}
                      </button>
                    )}
                  </div>

                  <div className="frames-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`thumb-box ${activeSlot === i ? 'selected' : ''}`}
                        onClick={() => handleSlotClick(i)}
                        style={{ borderRadius: '1rem', aspectRatio: '1' }}
                      >
                        {images[i] ? (
                          <img src={images[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span className="font-pixel" style={{ fontSize: '8px', opacity: 0.2 }}>0{i + 1}</span>
                        )}
                        <span className="font-pixel" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '7px', opacity: 0.3 }}>0{i + 1}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} ref={fileInputRef} style={{ display: 'none' }} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="preview-station"
                      style={{ padding: '2rem', cursor: 'pointer', width: '100%', border: '1px dashed var(--border-color)', borderRadius: '1.5rem', background: 'var(--bg-secondary)', flexDirection: 'row', gap: '1rem' }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>⧉</span>
                      <span className="font-pixel" style={{ fontSize: '15px', opacity: 1, fontWeight: 700 }}>Inject_Fragment</span>
                    </button>

                    {images[activeSlot] && (
                      <button
                        onClick={() => removeImage(activeSlot)}
                        style={{ width: '100%', marginTop: '1.5rem', background: 'transparent', border: 'none', color: '#ff4d4d', fontSize: '9px', fontFamily: 'var(--font-pixel)', cursor: 'pointer', opacity: 0.6 }}
                      >
                          // PURGE_SLOT_0{activeSlot + 1}_DATA
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'ADJUST' && (
                <div className="flex flex-col gap-6">
                  {!images[activeSlot] ? (
                    <div className="flex flex-col items-center justify-center" style={{ padding: '4rem 0', opacity: 0.15 }}>
                      <span style={{ fontSize: '3rem' }}>🔍</span>
                      <span className="font-pixel" style={{ fontSize: '11px', marginTop: '1rem' }}>EMPTY_BUFFER</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-primary" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.9 }}>Zoom Intensity</span>
                          <span className="font-pixel" style={{ fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 800 }}>x{configs[activeSlot].scale.toFixed(2)}</span>
                        </div>
                        <input
                          type="range" min="1" max="4" step="0.01" value={configs[activeSlot].scale}
                          className="range-slider"
                          onChange={(e) => updateConfig(activeSlot, 'scale', parseFloat(e.target.value))}
                        />
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="font-primary" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.9 }}>Rotation Axis</span>
                          <span className="font-pixel" style={{ fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 800 }}>{Math.round(configs[activeSlot].rotation)}°</span>
                        </div>
                        <input
                          type="range" min="-180" max="180" step="1" value={configs[activeSlot].rotation}
                          className="range-slider"
                          onChange={(e) => updateConfig(activeSlot, 'rotation', parseFloat(e.target.value))}
                        />
                        <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                          <button onClick={() => updateConfig(activeSlot, 'rotation', configs[activeSlot].rotation - 90)} className="tab-btn" style={{ padding: '0.4rem', fontSize: '9px' }}>-90°</button>
                          <button onClick={() => updateConfig(activeSlot, 'rotation', configs[activeSlot].rotation + 90)} className="tab-btn" style={{ padding: '0.4rem', fontSize: '9px' }}>+90°</button>
                          <button onClick={() => updateConfig(activeSlot, 'rotation', 0)} className="tab-btn" style={{ padding: '0.4rem', fontSize: '9px' }}>Reset</button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <span className="font-primary" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.9 }}>Position Precision</span>
                        <div className="d-pad" style={{ scale: '0.8', margin: '0 auto' }}>
                          <button onClick={() => panStep('u')} className="d-btn" style={{ gridColumn: '2', gridRow: '1' }}>▲</button>
                          <button onClick={() => panStep('d')} className="d-btn" style={{ gridColumn: '2', gridRow: '3' }}>▼</button>
                          <button onClick={() => panStep('l')} className="d-btn" style={{ gridColumn: '1', gridRow: '2' }}>◀</button>
                          <button onClick={() => panStep('r')} className="d-btn" style={{ gridColumn: '3', gridRow: '2' }}>▶</button>
                          <button
                            onClick={() => { updateConfig(activeSlot, 'x', 0); updateConfig(activeSlot, 'y', 0); }}
                            className="d-btn center"
                            style={{ gridColumn: '2', gridRow: '2', fontSize: '12px', fontWeight: 800 }}
                          >
                            RESET
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'STYLE' && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-primary" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Archive Medium</h3>
                  <div className="style-list">
                    {TEMPLATES.map(t => (
                      <div
                        key={t.id}
                        className={`style-item ${selectedTemplate.id === t.id ? 'active' : ''}`}
                        onClick={() => setSelectedTemplate(t)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '1rem',
                          background: selectedTemplate.id === t.id ? 'var(--bg-primary)' : 'transparent',
                          borderRadius: '1.25rem',
                          border: `1px solid ${selectedTemplate.id === t.id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          gap: '0.75rem',
                          alignItems: 'center',
                          textAlign: 'center'
                        }}
                      >
                        {t.backgroundImage ? (
                          <img src={encodeURI(t.backgroundImage)} alt="" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '0.75rem', objectFit: 'contain', background: 'var(--bg-secondary)', border: `1px solid var(--border-color)` }} />
                        ) : (
                          <div
                            style={{
                              width: '100%', aspectRatio: '1/1', borderRadius: '0.75rem',
                              background: t.bgColor, border: `1px solid ${t.borderColor}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1.5rem', color: t.textColor
                            }}
                            className="font-script"
                          >
                            F
                          </div>
                        )}
                        <div className="flex flex-col items-center">
                          <span className="font-pixel" style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.id.split('-')[0]}</span>
                          <span className="font-primary" style={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2 }}>{t.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                disabled={images.length < 2 || isProcessing || swapSourceIndex !== null}
                onClick={() => onCheckout(selectedTemplate.name)}
                className="btn-primary"
                style={{ width: '100%', fontSize: '0.9rem', padding: '1.25rem' }}
              >
                {images.length < 2 ? `INJECT MIN. 2 FRAGMENTS` : 'COMMIT_ARCHIVE_ORDER'}
              </button>
              <p className="font-pixel" style={{ textAlign: 'center', fontSize: '9px', opacity: 0.4, marginTop: '2rem', letterSpacing: '0.4em' }}>
                LOCAL_ENCRYPTION_ACTIVE_V.2.5
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

