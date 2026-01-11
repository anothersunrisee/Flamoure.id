import React, { useState, useEffect } from 'react';

export const AdminView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [secret, setSecret] = useState('');
    const [isAuthed, setIsAuthed] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/get-orders', {
                headers: { 'Authorization': `Bearer ${secret}` }
            });
            const data = await res.json();
            if (res.ok) {
                setOrders(data);
                setIsAuthed(true);
            } else {
                alert('Unauthorized or error');
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
        fetchOrders();
    };

    if (!isAuthed) {
        return (
            <div className="container" style={{ padding: '10rem 0', maxWidth: '400px' }}>
                <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Admin Access</h2>
                <div className="input-field-group">
                    <label>SECRET_KEY</label>
                    <input
                        type="password"
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchOrders()}
                    />
                </div>
                <button className="btn-liquid" style={{ marginTop: '2rem' }} onClick={fetchOrders}>LOGIN</button>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '6rem 0' }}>
            <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="font-serif" style={{ fontSize: '3rem' }}>Command Center</h2>
                <span className="font-pixel" style={{ opacity: 0.5 }}>SYSTEM_OPERATIONAL</span>
            </div>

            <div className="cart-list">
                {orders.map(order => (
                    <div key={order.id} className="cart-item" style={{ display: 'block', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <span className="font-pixel" style={{ color: 'var(--accent-blue)' }}>{order.order_code}</span>
                                <h4 className="font-primary" style={{ fontSize: '1.25rem', fontWeight: 800 }}>{order.customer_name}</h4>
                                <p className="font-primary" style={{ fontSize: '0.9rem', opacity: 0.6 }}>{order.customer_email} | {order.customer_phone}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <select
                                    value={order.status}
                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.5rem' }}
                                >
                                    <option value="pending">PENDING</option>
                                    <option value="paid">PAID</option>
                                    <option value="processing">PROCESSING</option>
                                    <option value="shipped">SHIPPED</option>
                                    <option value="completed">COMPLETED</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                            <span className="font-pixel" style={{ fontSize: '10px', opacity: 0.5 }}>ITEMS</span>
                            {order.order_items.map((item: any) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span>{item.product_name}</span>
                                    <span>Rp {item.price.toLocaleString()}</span>
                                </div>
                            ))}
                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                                <span>TOTAL</span>
                                <span>Rp {order.total_price.toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <a
                                href={`https://drive.google.com/drive/folders/${order.drive_folder_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-liquid"
                                style={{ fontSize: '10px', padding: '0.6rem 1.2rem', textDecoration: 'none' }}
                            >
                                OPEN_DRIVE_FOLDER
                            </a>
                            <a
                                href={`mailto:${order.customer_email}`}
                                className="btn-liquid"
                                style={{ fontSize: '10px', padding: '0.6rem 1.2rem', textDecoration: 'none', background: 'transparent' }}
                            >
                                CONTACT_EMAIL
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
