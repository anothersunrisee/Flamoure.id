import React, { useState } from 'react';

export const AdminView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState({ user: '', pass: '' });
    const [isAuthed, setIsAuthed] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            // We use ADMIN_SECRET as a simplified password check for MVP
            // but the UX now requires both username and password
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
            <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '11px' }}>MANAGEMENT_INTERFACE</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>Command Center</h2>
                </div>
                <button onClick={() => setIsAuthed(false)} className="nav-btn" style={{ fontSize: '10px' }}>DISCONNECT</button>
            </div>

            <div className="cart-list">
                {orders.length === 0 && <p className="font-pixel" style={{ opacity: 0.5, textAlign: 'center', padding: '4rem' }}>NO_ORDERS_FOUND</p>}
                {orders.map(order => (
                    <div key={order.id} className="cart-item" style={{ display: 'block', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div>
                                <span className="font-pixel" style={{ color: 'var(--accent-blue)', fontSize: '10px' }}>{order.order_code}</span>
                                <h4 className="font-primary" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{order.customer_name}</h4>
                                <p className="font-primary" style={{ fontSize: '0.9rem', opacity: 0.6 }}>{order.customer_email} | {order.customer_phone}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className="font-pixel" style={{ fontSize: '9px', display: 'block', marginBottom: '0.5rem', opacity: 0.5 }}>ORDER_STATUS</span>
                                <select
                                    value={order.status}
                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    <option value="pending">PENDING</option>
                                    <option value="paid">PAID</option>
                                    <option value="processing">PROCESSING</option>
                                    <option value="shipped">SHIPPED</option>
                                    <option value="completed">COMPLETED</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                            <span className="font-pixel" style={{ fontSize: '10px', opacity: 0.5, display: 'block', marginBottom: '1rem' }}>ORDER_DETAILS</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {order.order_items.map((item: any) => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span className="font-primary">{item.product_name}</span>
                                        <span className="font-pixel">Rp {item.price.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                <span className="font-pixel" style={{ fontSize: '11px' }}>TOTAL_REVENUE</span>
                                <span className="font-primary" style={{ fontSize: '1.25rem', fontWeight: 900 }}>Rp {order.total_price.toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <span className="font-pixel" style={{ fontSize: '10px', opacity: 0.5, display: 'block', marginBottom: '1rem' }}>UPLOADED_ARTIFACTS</span>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {order.uploads && order.uploads.length > 0 ? (
                                    order.uploads.map((u: any) => (
                                        <a key={u.id} href={u.drive_file_id} target="_blank" rel="noreferrer" className="artifact-thumb">
                                            <img src={u.drive_file_id} alt="artifact" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                                        </a>
                                    ))
                                ) : (
                                    <p className="font-pixel" style={{ fontSize: '10px', opacity: 0.3 }}>NO_ARTIFACTS_UPLOADED</p>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <a
                                href={`mailto:${order.customer_email}`}
                                className="btn-liquid"
                                style={{ fontSize: '10px', padding: '0.6rem 1.2rem', textDecoration: 'none', background: 'transparent' }}
                            >
                                CONTACT_CUSTOMER
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
