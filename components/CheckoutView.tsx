import React, { useState, useMemo } from 'react';
import { Product } from '../types';

interface CheckoutViewProps {
    cart: Product[];
    totalPrice: number;
    onSuccess: (orderCode: string) => void;
    onBack: () => void;
}

type Step = 'review' | 'data' | 'upload' | 'success';

export const CheckoutView: React.FC<CheckoutViewProps> = ({ cart, totalPrice, onSuccess, onBack }) => {
    const [currentStep, setCurrentStep] = useState<Step>('review');
    const [customerData, setCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderInfo, setOrderInfo] = useState<{ id: string, code: string, folderId: string } | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    const steps: Step[] = ['review', 'data', 'upload', 'success'];

    const handleCreateOrder = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...customerData,
                    total_price: totalPrice,
                    items: cart
                })
            });
            const data = await response.json();
            if (data.success) {
                setOrderInfo({ id: data.order_id, code: data.order_code, folderId: data.drive_folder_id });
                setCurrentStep('upload');
            } else {
                console.error('API Error:', data);
                alert('Server Error: ' + (data.error || 'Check console for details'));
            }
        } catch (err) {
            console.error('Fetch Error:', err);
            alert('Connection Error: Pastikan Anda menjalankan server dengan "vercel dev" jika mengetes API secara lokal.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async () => {
        if (selectedFiles.length === 0) {
            setCurrentStep('success');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('order_id', orderInfo!.id);
        formData.append('folder_id', orderInfo!.folderId);
        selectedFiles.forEach(file => formData.append('files', file));

        try {
            const response = await fetch('/api/upload-file', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                setCurrentStep('success');
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (err) {
            alert('Error uploading files');
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateWhatsAppLink = () => {
        const phone = "6281246197368"; // Admin phone
        const text = encodeURIComponent(
            `Halo Flamoure! Saya ingin konfirmasi pesanan.\n\n` +
            `*Order Code:* ${orderInfo?.code}\n` +
            `*Nama:* ${customerData.name}\n` +
            `*Total:* Rp ${totalPrice.toLocaleString()}\n\n` +
            `Saya akan melakukan pembayaran via [Metode Pembayaran]. Mohon konfirmasinya.`
        );
        return `https://wa.me/${phone}?text=${text}`;
    };

    return (
        <div className="container" style={{ padding: '6rem 0' }}>
            <div className="step-indicator">
                {steps.map((s, idx) => (
                    <div
                        key={s}
                        className={`step-dot ${steps.indexOf(currentStep) >= idx ? 'active' : ''}`}
                    />
                ))}
            </div>

            <div className="checkout-card">
                {currentStep === 'review' && (
                    <div className="flex flex-col gap-6">
                        <h2 className="font-serif" style={{ fontSize: '2.5rem' }}>Review Fragments</h2>
                        <div className="flex flex-col gap-4">
                            {cart.map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-color" style={{ opacity: 0.8 }}>
                                    <span className="font-primary">{item.name}</span>
                                    <span className="font-pixel">Rp {item.price.toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-4">
                                <span className="font-pixel" style={{ color: 'var(--accent-blue)' }}>TOTAL_ESTIMATED</span>
                                <span className="font-primary" style={{ fontSize: '1.5rem', fontWeight: 900 }}>Rp {totalPrice.toLocaleString()}</span>
                            </div>
                        </div>
                        <button onClick={() => setCurrentStep('data')} className="btn-liquid" style={{ marginTop: '2rem' }}>
                            CONTINUE_TO_DATA
                        </button>
                        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                            ← Modify Bag
                        </button>
                    </div>
                )}

                {currentStep === 'data' && (
                    <div className="flex flex-col gap-6">
                        <h2 className="font-serif" style={{ fontSize: '2.5rem' }}>Identity Details</h2>
                        <div className="modal-form-body" style={{ padding: 0 }}>
                            <div className="input-field-group">
                                <label>FULL_NAME</label>
                                <input
                                    type="text"
                                    value={customerData.name}
                                    onChange={e => setCustomerData({ ...customerData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="input-field-group">
                                <label>EMAIL_ADDRESS</label>
                                <input
                                    type="email"
                                    value={customerData.email}
                                    onChange={e => setCustomerData({ ...customerData, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="input-field-group">
                                <label>PHONE_NUMBER</label>
                                <input
                                    type="tel"
                                    value={customerData.phone}
                                    onChange={e => setCustomerData({ ...customerData, phone: e.target.value })}
                                    placeholder="0812..."
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleCreateOrder}
                            disabled={isSubmitting || !customerData.name || !customerData.email || !customerData.phone}
                            className="btn-liquid"
                            style={{ marginTop: '2rem' }}
                        >
                            {isSubmitting ? 'GENERATING_ORDER...' : 'PREPARE_UPLOAD'}
                        </button>
                    </div>
                )}

                {currentStep === 'upload' && (
                    <div className="flex flex-col gap-6">
                        <h2 className="font-serif" style={{ fontSize: '2.5rem' }}>Upload Artifacts</h2>
                        <p className="font-primary" style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                            Order created: <strong>{orderInfo?.code}</strong>. Please upload your photos for the photostrip/keychain.
                        </p>

                        <input
                            type="file"
                            id="file-upload"
                            multiple
                            onChange={e => setSelectedFiles(Array.from(e.target.files || []))}
                            style={{ display: 'none' }}
                        />

                        <label htmlFor="file-upload" className="upload-zone">
                            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>☁️</span>
                            <span className="font-pixel">CLICK_TO_SELECT_FILES</span>
                            <span className="font-primary" style={{ display: 'block', fontSize: '10px', opacity: 0.5, marginTop: '0.5rem' }}>
                                PNG, JPG or JPEG (Max 10MB total)
                            </span>
                        </label>

                        {selectedFiles.length > 0 && (
                            <div className="file-preview-grid">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="file-preview-item">
                                        <img src={URL.createObjectURL(file)} alt="preview" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleFileUpload}
                            disabled={isSubmitting}
                            className="btn-liquid"
                            style={{ marginTop: '2rem' }}
                        >
                            {isSubmitting ? 'UPLOADING...' : `UPLOAD_${selectedFiles.length}_FILES`}
                        </button>
                        <button onClick={() => setCurrentStep('success')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px' }}>
                            SKIP_UPLOAD
                        </button>
                    </div>
                )}

                {currentStep === 'success' && (
                    <div className="flex flex-col gap-6 text-center">
                        <div className="success-badge">✓</div>
                        <h2 className="font-serif" style={{ fontSize: '3rem' }}>Artifact Secured</h2>
                        <p className="font-primary" style={{ opacity: 0.7 }}>
                            Order <strong>{orderInfo?.code}</strong> has been received. <br />
                            Finalize payment via WhatsApp to start processing your artifacts.
                        </p>

                        <a
                            href={generateWhatsAppLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-liquid"
                            style={{ marginTop: '2rem', display: 'block', textDecoration: 'none', background: '#25D366', color: 'white', borderColor: '#25D366' }}
                        >
                            PAY_VIA_WHATSAPP
                        </a>

                        <button onClick={() => window.location.href = '/'} className="cart-continue-btn" style={{ margin: '2rem auto 0' }}>
                            ← Return to Archives
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
