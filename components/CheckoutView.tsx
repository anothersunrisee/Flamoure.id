import React, { useState } from 'react';
import { Product } from '../types';
import html2canvas from 'html2canvas';

interface CheckoutViewProps {
    cart: Product[];
    totalPrice: number;
    onSuccess: (orderCode: string) => void;
    onBack: () => void;
}

type Step = 'review' | 'data' | 'sync' | 'success';

export const CheckoutView: React.FC<CheckoutViewProps> = ({ cart, totalPrice, onSuccess, onBack }) => {
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

            setOrderInfo({ id: data.order_id, code: data.order_code });
            setCurrentStep('sync');

            // 2. Upload Files Automatically
            const itemsWithFiles = cart.filter(item => item.metadata?.files && item.metadata.files.length > 0);

            if (itemsWithFiles.length > 0) {
                let completed = 0;
                for (let i = 0; i < itemsWithFiles.length; i++) {
                    const item = itemsWithFiles[i];
                    const formData = new FormData();
                    formData.append('order_id', data.order_id);
                    // Use item name and index as prefix
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
                }
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
        <div className="container" style={{ padding: '6rem 0' }}>
            <div className="checkout-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                {currentStep === 'review' && (
                    <div className="flex flex-col gap-6">
                        <div style={{ marginBottom: '1rem' }}>
                            <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '10px' }}>STEP_01</span>
                            <h2 className="font-serif" style={{ fontSize: '3rem' }}>Final Review</h2>
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
                                            <span className="font-pixel" style={{ fontSize: '9px', opacity: 0.5 }}>QTY: {item.quantity || 1}</span>
                                        </div>
                                    </div>
                                    <span className="font-pixel">Rp {(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <div className="flex justify-between items-center">
                                <span className="font-pixel" style={{ opacity: 0.6 }}>TOTAL_TO_PAY</span>
                                <span className="font-primary" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00d4ff' }}>Rp {totalPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <button onClick={() => setCurrentStep('data')} className="btn-liquid" style={{ marginTop: '1rem' }}>
                            CONFIRM_FRAGMENTS ➔
                        </button>
                    </div>
                )}

                {currentStep === 'data' && (
                    <div className="flex flex-col gap-6">
                        <div style={{ marginBottom: '1rem' }}>
                            <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '10px' }}>STEP_02</span>
                            <h2 className="font-serif" style={{ fontSize: '3rem' }}>Identity</h2>
                        </div>

                        <div className="modal-form-body" style={{ padding: 0 }}>
                            <div className="input-field-group">
                                <label>FULL_NAME</label>
                                <input
                                    type="text"
                                    value={customerData.customer_name}
                                    onChange={e => setCustomerData({ ...customerData, customer_name: e.target.value })}
                                    placeholder="Operator Name"
                                />
                            </div>
                            <div className="input-field-group">
                                <label>WHATSAPP_NUMBER</label>
                                <input
                                    type="tel"
                                    value={customerData.customer_phone}
                                    onChange={e => setCustomerData({ ...customerData, customer_phone: e.target.value })}
                                    placeholder="08..."
                                />
                            </div>
                            <div className="input-field-group">
                                <label>EMAIL</label>
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
                                background: '#00d4ff',
                                color: '#000',
                                fontWeight: 900
                            }}
                        >
                            {isSubmitting ? 'PROCESSING...' : 'COMMIT_ORDER'}
                        </button>
                    </div>
                )}

                {currentStep === 'sync' && (
                    <div className="flex flex-col items-center justify-center gap-6" style={{ padding: '4rem 0' }}>
                        <div className="loader-container">
                            <div className="font-pixel" style={{ fontSize: '2rem', color: 'var(--accent-blue)' }}>{syncProgress}%</div>
                        </div>
                        <h2 className="font-serif" style={{ fontSize: '2.5rem' }}>Syncing Artifacts</h2>
                        <p className="font-pixel" style={{ opacity: 0.5, fontSize: '11px', letterSpacing: '0.2em' }}>DON'T_CLOSE_THIS_WINDOW</p>
                    </div>
                )}

                {currentStep === 'success' && (
                    <div className="flex flex-col gap-8 text-center">
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="success-badge" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>✓</div>
                        </div>

                        <div>
                            <h2 className="font-serif" style={{ fontSize: '3.5rem' }}>Transaction Secured</h2>
                            <p className="font-primary" style={{ opacity: 0.6, marginTop: '0.5rem' }}>
                                Order Code: <strong style={{ color: 'var(--accent-blue)' }}>{orderInfo?.code}</strong>
                            </p>
                        </div>

                        {/* Invoice Preview (Hidden but capturable) */}
                        <div style={{ position: 'absolute', left: '-9999px' }}>
                            <div id="invoice-capture" style={{
                                width: '350px',
                                padding: '30px',
                                background: '#111',
                                color: '#fff',
                                fontFamily: 'var(--font-primary)',
                                border: '1px solid #333'
                            }}>
                                <div style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
                                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0 }}>FLAMOURE</h3>
                                    <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', opacity: 0.5 }}>OFFICIAL_INVOICE</span>
                                </div>

                                <div style={{ marginBottom: '20px', fontSize: '12px' }}>
                                    <div className="flex justify-between">
                                        <span style={{ opacity: 0.5 }}>ORDER_ID</span>
                                        <strong>{orderInfo?.code}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ opacity: 0.5 }}>DATE</span>
                                        <strong>{new Date().toLocaleDateString()}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ opacity: 0.5 }}>CUSTOMER</span>
                                        <strong>{customerData.customer_name}</strong>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    {cart.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                                            <span>{item.quantity || 1}x {item.name}</span>
                                            <span>Rp {(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ borderTop: '2px dashed #333', paddingTop: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px' }}>TOTAL_AMOUNT</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00d4ff' }}>Rp {totalPrice.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                                    <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', opacity: 0.3 }}>THANK_YOU_FOR_CRAFTING_WITH_US</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button onClick={downloadInvoice} className="btn-liquid" style={{ width: '100%', background: 'transparent' }}>
                                DOWNLOAD_INVOICE_PNG
                            </button>
                            <a
                                href={generateWhatsAppLink()}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-liquid"
                                style={{ width: '100%', textDecoration: 'none', background: '#25D366', color: 'white', borderColor: '#25D366' }}
                            >
                                CONFIRM_VIA_WHATSAPP
                            </a>
                        </div>

                        <button onClick={() => window.location.href = '/'} className="cart-continue-btn" style={{ margin: '1rem auto 0' }}>
                            ← Return to Archives
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
