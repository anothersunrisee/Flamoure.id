import React, { useState } from 'react';
import JSZip from 'jszip';

export const AdminView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState({ user: '', pass: '' });
    const [isAuthed, setIsAuthed] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/get-orders', {
                headers: {
                    'Authorization': `Bearer ${credentials.pass}`,
                    'X-Admin-User': credentials.user
                }
            });
            const data = await res.json();
            if (res.ok) {
                setOrders(data);
                setIsAuthed(true);
            } else {
                alert('Invalid Credentials');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        await fetch('/api/update-order', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        handleLogin(); // Refresh
    };

    const downloadZip = async (order: any) => {
        if (order.uploads.length === 0) return;
        setIsDownloading(order.id);

        try {
            const zip = new JSZip();
            const folder = zip.folder(`${order.order_code}_${order.customer_name}`);

            for (const upload of order.uploads) {
                const response = await fetch(upload.drive_file_id);
                const blob = await response.blob();
                folder?.file(upload.file_name || `${Date.now()}.jpg`, blob);
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `FLAM_ORDER_${order.order_code}.zip`;
            link.click();
        } catch (err) {
            console.error('ZIP Error:', err);
            alert('Gagal mendownload ZIP. Cek koneksi atau izin CORS Supabase.');
        } finally {
            setIsDownloading(null);
        }
    };

    if (!isAuthed) {
        return (
            <div className="container" style={{ padding: '10rem 0', maxWidth: '400px' }}>
                <h2 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: '2.5rem', textAlign: 'center' }}>Terminal Access</h2>
                <div className="modal-form-body" style={{ padding: 0 }}>
                    <div className="input-field-group">
                        <label>OPERATOR_ID</label>
                        <input
                            type="text"
                            value={credentials.user}
                            onChange={e => setCredentials({ ...credentials, user: e.target.value })}
                            placeholder="username"
                        />
                    </div>
                    <div className="input-field-group">
                        <label>ACCESS_CODE</label>
                        <input
                            type="password"
                            value={credentials.pass}
                            onChange={e => setCredentials({ ...credentials, pass: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <button
                    className="btn-liquid"
                    style={{ marginTop: '2rem', width: '100%' }}
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? 'AUTHENTICATING...' : 'ESTABLISH_CONNECTION'}
                </button>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '6rem 0' }}>
            <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '11px' }}>MANAGEMENT_INTERFACE</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>Command Center</h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleLogin} className="nav-btn" style={{ fontSize: '10px' }}>REFRESH</button>
                    <button onClick={() => setIsAuthed(false)} className="nav-btn" style={{ fontSize: '10px' }}>DISCONNECT</button>
                </div>
            </div>

            <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                {orders.length === 0 && <p className="font-pixel" style={{ opacity: 0.5, textAlign: 'center', padding: '4rem' }}>NO_ORDERS_FOUND</p>}
                {orders.map(order => (
                    <div key={order.id} className="cart-item" style={{
                        display: 'block',
                        padding: '2.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '2rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div>
                                <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '11px', letterSpacing: '0.1em' }}>{order.order_code}</span>
                                <h4 className="font-primary" style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.5rem 0' }}>{order.customer_name}</h4>
                                <div className="font-pixel" style={{ fontSize: '12px', opacity: 0.5 }}>
                                    {order.customer_phone} • {order.customer_email}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className="font-pixel" style={{ fontSize: '9px', display: 'block', marginBottom: '0.75rem', opacity: 0.5 }}>LIFECYCLE_STATUS</span>
                                <select
                                    value={order.status}
                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '0.75rem',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 700
                                    }}
                                >
                                    <option value="pending">PENDING</option>
                                    <option value="paid">PAID</option>
                                    <option value="processing">PROCESSING</option>
                                    <option value="shipped">SHIPPED</option>
                                    <option value="completed">COMPLETED</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                            {/* Items List */}
                            <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)' }}>
                                <span className="font-pixel" style={{ fontSize: '10px', opacity: 0.5, display: 'block', marginBottom: '1rem' }}>CART_MANIFEST</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {order.order_items.map((item: any) => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <div className="font-primary" style={{ fontWeight: 700 }}>{item.product_name}</div>
                                                {item.metadata?.templateName && (
                                                    <div className="font-pixel" style={{ fontSize: '9px', color: 'var(--accent-blue)' }}>TEMPLATE: {item.metadata.templateName}</div>
                                                )}
                                            </div>
                                            <span className="font-pixel">Rp {item.price.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="font-pixel" style={{ fontSize: '11px', color: 'var(--accent-blue)' }}>FINAL_REVENUE</span>
                                    <span className="font-primary" style={{ fontSize: '1.5rem', fontWeight: 900 }}>Rp {order.total_price.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Artifacts Preview */}
                            <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span className="font-pixel" style={{ fontSize: '10px', opacity: 0.5 }}>ARTIFACTS_COLLECTION</span>
                                    <button
                                        onClick={() => downloadZip(order)}
                                        disabled={order.uploads?.length === 0 || isDownloading === order.id}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}
                                        className="font-pixel"
                                    >
                                        {isDownloading === order.id ? '[ ZIP_COMPILING... ]' : '[ DOWNLOAD_ALL_ZIP ]'}
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '0.5rem' }}>
                                    {order.uploads && order.uploads.length > 0 ? (
                                        order.uploads.map((u: any) => (
                                            <a key={u.id} href={u.drive_file_id} target="_blank" rel="noreferrer" title={u.file_name}>
                                                <img src={u.drive_file_id} alt="artifact" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                                            </a>
                                        ))
                                    ) : (
                                        <p className="font-pixel" style={{ fontSize: '10px', opacity: 0.3 }}>NIL_DATA</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <a
                                href={`https://wa.me/${order.customer_phone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="nav-btn"
                                style={{ fontSize: '10px', padding: '0.75rem 1.5rem', textDecoration: 'none' }}
                            >
                                WHATSAPP_CONTACT
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
