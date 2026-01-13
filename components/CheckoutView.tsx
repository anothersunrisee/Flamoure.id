
import React, { useState } from 'react';
import { Product } from '../types';
import html2canvas from 'html2canvas';
import { LANGUAGES } from '../translations';

interface CheckoutViewProps {
    cart: Product[];
    totalPrice: number;
    onSuccess: (orderCode: string) => void;
    onBack: () => void;
    language?: 'ID' | 'EN';
}

type Step = 'review' | 'data' | 'sync' | 'success';

export const CheckoutView: React.FC<CheckoutViewProps> = ({ cart, totalPrice, onSuccess, onBack, language = 'EN' }) => {
    const t = LANGUAGES[language];
    const [currentStep, setCurrentStep] = useState<Step>('review');
    const [customerData, setCustomerData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [orderInfo, setOrderInfo] = useState<{ id: string, code: string } | null>(null);
    const [finalPrice, setFinalPrice] = useState(totalPrice); // Lock the price for invoice
    const [finalCart, setFinalCart] = useState<Product[]>([]); // Lock cart for invoice

    const steps: Step[] = ['review', 'data', 'sync', 'success'];

    const handleCheckoutProcess = async () => {
        setIsSubmitting(true);
        try {
            // 1. Create Order
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...customerData,
                    total_price: totalPrice,
                    items: cart.map(item => ({
                        ...item,
                        metadata: { ...item.metadata, files: undefined } // Don't send raw files in JSON
                    }))
                })
            });
            const data = await response.json();

            if (!data.success) throw new Error(data.error || 'Failed to create order');

            setFinalPrice(totalPrice); // Ensure we have the current total
            setFinalCart(cart); // Lock the cart items for the invoice
            setOrderInfo({ id: data.order_id, code: data.order_code });

            // CACHE: Save for "Last Order" recovery
            localStorage.setItem('last_order', JSON.stringify({
                orderInfo: { id: data.order_id, code: data.order_code },
                finalCart: cart,
                finalPrice: totalPrice,
                customerData,
                timestamp: Date.now()
            }));

            setCurrentStep('sync');

            // 2. Upload Files Automatically (Parallelized for Speed)
            const itemsWithFiles = cart.filter(item => item.metadata?.files && item.metadata.files.length > 0);

            if (itemsWithFiles.length > 0) {
                let completed = 0;
                const uploadPromises = itemsWithFiles.map(async (item, i) => {
                    const formData = new FormData();
                    formData.append('order_id', data.order_id);
                    formData.append('prefix', `${i + 1}_${item.name}_`);

                    item.metadata!.files!.forEach(file => {
                        formData.append('files', file);
                    });

                    const upRes = await fetch('/api/upload-file', {
                        method: 'POST',
                        body: formData
                    });

                    if (upRes.ok) {
                        completed++;
                        setSyncProgress(Math.round((completed / itemsWithFiles.length) * 100));
                    }
                });

                await Promise.all(uploadPromises);
            }

            setCurrentStep('success');
            onSuccess(data.order_code);
        } catch (err: any) {
            console.error('Checkout Error:', err);
            alert('Error: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadInvoice = async () => {
        const element = document.getElementById('invoice-capture');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#111',
                scale: 2
            });
            const link = document.createElement('a');
            link.download = `INVOICE_${orderInfo?.code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Invoice generation failed', err);
        }
    };

    const generateWhatsAppLink = () => {
        const phone = "62895363898438";
        const text = encodeURIComponent(
            `Halo Flamoure! Saya sudah melakukan checkout.\n\n` +
            `*Order Code:* ${orderInfo?.code}\n` +
            `*Nama:* ${customerData.customer_name}\n` +
            `*Total:* Rp ${totalPrice.toLocaleString()}\n\n` +
            `Mohon instruksi pembayarannya.`
        );
        return `https://wa.me/${phone}?text=${text}`;
    };

    return (
        <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
            <div className="checkout-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                {currentStep === 'review' && (
                    <div className="flex flex-col gap-6">
                        <div style={{ marginBottom: '1rem' }}>
                            <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '10px' }}>{t.CHECKOUT_STEP_01}</span>
                            <h2 className="font-serif" style={{ fontSize: '3rem' }}>{t.CHECKOUT_FINAL_REVIEW}</h2>
                        </div>

                        <div className="cart-list" style={{ padding: 0 }}>
                            {cart.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-4 border-b border-color">
                                    <div className="flex items-center gap-4">
                                        <div style={{ width: '40px', height: '40px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div>
                                            <h4 className="font-primary" style={{ fontSize: '1rem', fontWeight: 700 }}>{item.name}</h4>
                                            <span className="font-pixel" style={{ fontSize: '9px', opacity: 0.5 }}>{t.CHECKOUT_QTY}: {item.quantity || 1}</span>
                                        </div>
                                    </div>
                                    <span className="font-pixel">Rp {(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <div className="flex justify-between items-center">
                                <span className="font-pixel" style={{ opacity: 0.6 }}>{t.CHECKOUT_TOTAL_PAY}</span>
                                <span className="font-primary" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)' }}>Rp {totalPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <button onClick={() => setCurrentStep('data')} className="btn-liquid" style={{ marginTop: '1rem', background: 'var(--accent-blue)', color: '#fff', fontWeight: 800 }}>
                            {t.CHECKOUT_CONFIRM}
                        </button>
                    </div>
                )}

                {currentStep === 'data' && (
                    <div className="flex flex-col gap-6">
                        <div style={{ marginBottom: '1rem' }}>
                            <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '10px' }}>{t.CHECKOUT_STEP_02}</span>
                            <h2 className="font-serif" style={{ fontSize: '3rem' }}>{t.CHECKOUT_IDENTITY}</h2>
                        </div>

                        <div className="modal-form-body" style={{ padding: 0 }}>
                            <div className="input-field-group">
                                <label>{t.CHECKOUT_FULL_NAME}</label>
                                <input
                                    type="text"
                                    value={customerData.customer_name}
                                    onChange={e => setCustomerData({ ...customerData, customer_name: e.target.value })}
                                    placeholder="Operator Name"
                                />
                            </div>
                            <div className="input-field-group">
                                <label>{t.CHECKOUT_WHATSAPP}</label>
                                <input
                                    type="tel"
                                    value={customerData.customer_phone}
                                    onChange={e => setCustomerData({ ...customerData, customer_phone: e.target.value })}
                                    placeholder="08..."
                                />
                            </div>
                            <div className="input-field-group">
                                <label>{t.CHECKOUT_EMAIL}</label>
                                <input
                                    type="email"
                                    value={customerData.customer_email}
                                    onChange={e => setCustomerData({ ...customerData, customer_email: e.target.value })}
                                    placeholder="user@flamoure.id"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleCheckoutProcess}
                            disabled={isSubmitting || !customerData.customer_name || !customerData.customer_phone}
                            className="btn-liquid"
                            style={{
                                marginTop: '1rem',
                                background: 'var(--accent-blue)',
                                color: '#fff',
                                fontWeight: 900
                            }}
                        >
                            {isSubmitting ? t.CHECKOUT_PROCESSING : t.CHECKOUT_COMMIT}
                        </button>
                    </div>
                )}

                {currentStep === 'sync' && (
                    <div className="flex flex-col items-center justify-center gap-6" style={{ padding: '4rem 0' }}>
                        <div className="loader-container">
                            <div className="font-pixel" style={{ fontSize: '2rem', color: 'var(--accent-blue)' }}>{syncProgress}%</div>
                        </div>
                        <h2 className="font-serif" style={{ fontSize: '2.5rem' }}>{t.CHECKOUT_SYNCING}</h2>
                        <p className="font-pixel" style={{ opacity: 0.5, fontSize: '11px', letterSpacing: '0.2em' }}>{t.CHECKOUT_DONT_CLOSE}</p>
                    </div>
                )}

                {currentStep === 'success' && (
                    <div className="flex flex-col gap-8 text-center">
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="success-badge" style={{ width: '80px', height: '80px', fontSize: '2rem', background: 'var(--accent-blue)', color: '#fff' }}>✓</div>
                        </div>

                        <div>
                            <h2 className="font-serif" style={{ fontSize: '3.5rem' }}>{t.CHECKOUT_SECURED}</h2>
                            <p className="font-primary" style={{ opacity: 0.6, marginTop: '0.5rem' }}>
                                {t.CHECKOUT_ORDER_CODE} <strong style={{ color: 'var(--accent-blue)' }}>{orderInfo?.code}</strong>
                            </p>
                        </div>

                        {/* Invoice Preview */}
                        <div style={{ position: 'absolute', left: '-9999px' }}>
                            <div id="invoice-capture" style={{
                                width: '380px',
                                padding: '40px',
                                background: '#0a0a0a',
                                color: '#fff',
                                fontFamily: 'var(--font-primary)',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1px solid #222'
                            }}>
                                {/* Watermark */}
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
                                            <strong style={{ fontSize: '14px', color: 'var(--accent-blue)' }}>#{orderInfo?.code}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '30px', fontSize: '11px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <span style={{ opacity: 0.4, display: 'block', marginBottom: '4px' }} className="font-pixel">ISSUED_TO</span>
                                            <strong style={{ fontSize: '12px' }}>{customerData.customer_name}</strong>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ opacity: 0.4, display: 'block', marginBottom: '4px' }} className="font-pixel">DATE_STAMP</span>
                                            <strong style={{ fontSize: '12px' }}>{new Date().toLocaleDateString('id-ID')}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <span style={{ opacity: 0.4, display: 'block', marginBottom: '15px' }} className="font-pixel">MANIFEST_DETAILS</span>
                                    {finalCart.length > 0 ? finalCart.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700 }}>{item.name}</div>
                                                <div style={{ fontSize: '9px', opacity: 0.5 }}>{item.quantity || 1} UNIT(S)</div>
                                            </div>
                                            <span style={{ fontWeight: 800 }}>Rp {(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                        </div>
                                    )) : (
                                        <div style={{ fontSize: '12px', opacity: 0.5, fontStyle: 'italic' }}>Recovering order manifest...</div>
                                    )}
                                </div>

                                <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', opacity: 0.6 }}>SETTLEMENT_TOTAL</span>
                                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)' }}>Rp {finalPrice.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                                    <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', opacity: 0.3, letterSpacing: '0.4em' }}>VERIFIED_BY_FLAMOURE_ARCHIVES</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4" style={{ marginTop: '1rem' }}>
                            <button onClick={downloadInvoice} className="btn-liquid" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-color)' }}>
                                {t.CHECKOUT_DOWNLOAD_PNG}
                            </button>
                            <a
                                href={generateWhatsAppLink()}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-liquid"
                                style={{
                                    width: '100%',
                                    textDecoration: 'none',
                                    background: '#25D366',
                                    color: 'white',
                                    borderColor: '#25D366',
                                    fontWeight: 900
                                }}
                            >
                                {t.CHECKOUT_CONFIRM_WA}
                            </a>
                        </div>

                        <button onClick={() => window.location.href = '/'} className="cart-continue-btn" style={{ margin: '1rem auto 0' }}>
                            {t.CHECKOUT_RETURN}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
