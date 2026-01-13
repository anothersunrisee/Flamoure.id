import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { createClient } from '@supabase/supabase-js';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import html2canvas from 'html2canvas';
import '../admin.css';

// Modern SVG Icons
const Icon = ({ name, size = 18 }: { name: string, size?: number }) => {
    const icons: Record<string, any> = {
        dashboard: <path d="M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zM3 16h7v5H3v-5z" />,
        orders: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />,
        tools: <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />,
        plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />,
        download: <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />,
        loading: <path opacity="0.3" d="M12,4V2A10,10,0,0,0,2,12H4A8,8,0,0,1,12,4Z"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" /></path>,
        search: <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />,
        wa: <path d="M12.03 2.14a9.86 9.86 0 0 0-8.68 14.73L2 22l5.31-1.39A9.85 9.85 0 0 0 12.03 22a9.89 9.89 0 0 0 0-19.86zm5.11 13.91c-.22.63-1.28 1.16-1.76 1.23-.48.07-.94.09-1.44-.06-.31-.09-1.21-.44-2.58-1.04-3.41-1.48-5.61-4.96-5.78-5.18s-1.38-1.84-1.38-3.51c0-1.67.87-2.5.1-3.18-.3-.07-.48.11-.64.11a1.27 1.27 0 0 0-.91.43c-.28.32-1.07 1.05-1.07 2.56s1.1 2.98 1.25 3.19c.15.21 2.17 3.32 5.27 4.66.74.32 1.31.51 1.76.65.74.24 1.41.2 1.94.12.59-.09 1.76-.72 2.01-1.41z" />,
        close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />,
        external: <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
    };
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
            {icons[name] || <circle cx="12" cy="12" r="10" />}
        </svg>
    );
};

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// @ts-ignore
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type AdminTab = 'OVERVIEW' | 'ORDERS' | 'TOOLS';
type TimeFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

export const AdminView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState({ user: '', pass: '' });
    const [isAuthed, setIsAuthed] = useState(false);
    const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    const generateInvoice = async () => {
        const element = document.getElementById('admin-invoice-capture');
        if (!element || !selectedOrder) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#111',
                scale: 2
            });
            const link = document.createElement('a');
            link.download = `INVOICE_${selectedOrder.order_code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Invoice generation failed', err);
            alert('Failed to generate invoice');
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        try {
            if (credentials.user === 'flamoure.id' && credentials.pass === 'fajarahnf77677') {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, order_items(*), uploads(*)')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
                setIsAuthed(true);
            } else {
                alert('Invalid Credentials');
            }
        } catch (err: any) {
            alert('Connection Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };



    // --- Data Processing ---
    const filteredOrders = useMemo(() => {
        let result = orders;
        const now = new Date();

        if (timeFilter !== 'ALL') {
            result = result.filter(o => {
                const date = new Date(o.created_at);
                if (timeFilter === 'TODAY') return date.toDateString() === now.toDateString();
                if (timeFilter === 'WEEK') {
                    const diff = now.getTime() - date.getTime();
                    return diff <= 7 * 24 * 60 * 60 * 1000;
                }
                if (timeFilter === 'MONTH') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                if (timeFilter === 'YEAR') return date.getFullYear() === now.getFullYear();
                return true;
            });
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(o =>
                o.customer_name.toLowerCase().includes(q) ||
                o.order_code.toLowerCase().includes(q) ||
                o.customer_email.toLowerCase().includes(q)
            );
        }

        return result;
    }, [orders, timeFilter, searchQuery]);

    const stats = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        const productsCount: Record<string, number> = {};
        const revenueByDay: Record<string, number> = {};

        filteredOrders.forEach(o => {
            const day = new Date(o.created_at).toLocaleDateString('en-US', { weekday: 'short' });
            revenueByDay[day] = (revenueByDay[day] || 0) + o.total_price;
            o.order_items?.forEach((item: any) => {
                productsCount[item.product_name] = (productsCount[item.product_name] || 0) + 1;
            });
        });

        const chartData = Object.entries(revenueByDay).map(([name, value]) => ({ name, value }));
        const productData = Object.entries(productsCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { totalRevenue, totalOrders: filteredOrders.length, chartData, productData };
    }, [filteredOrders]);

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase.from('orders').update({ status }).eq('id', id);
            if (error) throw error;
            handleLogin();
            if (selectedOrder?.id === id) {
                setSelectedOrder({ ...selectedOrder, status });
            }
        } catch (err) { alert('Update failed'); }
    };

    const downloadZip = async (order: any) => {
        if (!order.uploads || order.uploads.length === 0) return;
        setIsDownloading(order.id);
        try {
            const zip = new JSZip();
            const folder = zip.folder(`${order.order_code}`);
            for (const upload of order.uploads) {
                const response = await fetch(upload.drive_file_id);
                const blob = await response.blob();
                folder?.file(upload.file_name || `${Date.now()}.jpg`, blob);
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `FLAM_${order.order_code}.zip`;
            link.click();
        } catch (err) { alert('ZIP Error'); }
        finally { setIsDownloading(null); }
    };

    const downloadSingle = async (url: string, name: string) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name || `FLAM_ARTIFACT_${Date.now()}.jpg`;
        a.click();
    };

    const deleteOrder = async (id: string) => {
        if (!window.confirm('WARNING: This will permanently delete this order and all associated data from Supabase. Are you sure?')) return;

        try {
            const { error } = await supabase.from('orders').delete().eq('id', id);
            if (error) throw error;

            setOrders(prev => prev.filter(o => o.id !== id));
            if (selectedOrder?.id === id) setSelectedOrder(null);

            // Optional: Re-fetch to ensure sync
            // handleLogin(); 
        } catch (err: any) {
            alert('Failed to delete order: ' + err.message);
        }
    };

    const exportData = (format: 'CSV' | 'JSON') => {
        let content = '';
        let ext = format.toLowerCase();
        if (format === 'CSV') {
            const headers = ['Code', 'Customer', 'Total', 'Status', 'Date'];
            content = [headers, ...filteredOrders.map(o => [o.order_code, o.customer_name, o.total_price, o.status, o.created_at])].map(r => r.join(',')).join('\\n');
        } else {
            content = JSON.stringify(filteredOrders, null, 2);
        }
        const blob = new Blob([content], { type: format === 'CSV' ? 'text/csv' : 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `FLAM_DATA_${Date.now()}.${ext}`;
        a.click();
    };

    if (!isAuthed) {
        return (
            <div className="admin-login-wrapper">
                <div className="admin-login-overlay" />
                <div className="admin-login-aura" />

                <div className="login-card-v2 animate-fade-in">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 className="font-serif" style={{ fontSize: '2.5rem', letterSpacing: '-0.02em' }}>Terminal Access</h2>
                        <p className="font-pixel" style={{ fontSize: '9px', opacity: 0.4, marginTop: '1rem', letterSpacing: '0.3em' }}>AUTH_REQUIRED_V2.5</p>
                    </div>

                    <div className="input-field-group">
                        <label className="font-pixel" style={{ fontSize: '9px', color: 'var(--accent-blue)' }}>OPERATOR_AUTH</label>
                        <input
                            type="text"
                            value={credentials.user}
                            onChange={e => setCredentials({ ...credentials, user: e.target.value })}
                            placeholder="v2.x_username"
                            style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.2rem', marginTop: '0.5rem', color: 'white', border: '1px solid rgba(255,255,255,0.05)' }}
                        />
                    </div>

                    <div className="input-field-group" style={{ marginTop: '1.5rem' }}>
                        <label className="font-pixel" style={{ fontSize: '9px', color: 'var(--accent-blue)' }}>KEY_SECRET</label>
                        <input
                            type="password"
                            value={credentials.pass}
                            onChange={e => setCredentials({ ...credentials, pass: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            placeholder="••••••••"
                            style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.2rem', marginTop: '0.5rem', color: 'white', border: '1px solid rgba(255,255,255,0.05)' }}
                        />
                    </div>

                    <button className="btn-liquid" style={{ marginTop: '3rem', width: '100%', padding: '1.25rem', borderRadius: '1.5rem' }} onClick={handleLogin} disabled={loading}>
                        {loading ? 'CONNECTING...' : 'ESTABLISH_AUTH'}
                    </button>

                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <p className="font-pixel" style={{ fontSize: '8px', opacity: 0.2 }}>FLA_SECURE_KERNEL_ACTIVE // ENCRYPTED_TUNNEL</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="admin-container">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '2rem' }}>
                    <div className="flex gap-4 p-2 rounded-2xl" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                        {(['OVERVIEW', 'ORDERS', 'TOOLS'] as AdminTab[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`tab-btn flex items-center gap-2 ${activeTab === t ? 'active' : ''}`}
                                style={{ padding: '0.8rem 1.8rem', fontSize: '10px', fontWeight: 800, fontFamily: 'var(--font-pixel)', transition: 'all 0.2s', borderRadius: '12px', background: activeTab === t ? 'var(--accent-blue)' : 'transparent', color: activeTab === t ? 'white' : 'var(--text-secondary)' }}
                            >
                                <Icon name={t.toLowerCase()} size={14} /> {t}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => { setIsAuthed(false); setOrders([]); }} className="nav-btn" style={{ fontSize: '10px', color: '#ff4d4d', padding: '0.8rem 1.2rem', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>TERMINATE_SESSION</button>
                </header>

                {/* --- Overview Tab --- */}
                {activeTab === 'OVERVIEW' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', gridAutoRows: 'minmax(200px, auto)' }}>
                        <div className="admin-card" style={{ gridColumn: 'span 1', padding: '2rem' }}>
                            <div>
                                <span className="font-pixel text-accent" style={{ fontSize: '10px' }}>ESTIMATED_REVENUE_NET</span>
                                <h3 className="font-primary" style={{ fontSize: '3rem', fontWeight: 900, marginTop: '1rem', color: 'var(--text-primary)' }}>Rp {(stats.totalRevenue / 1000).toFixed(0)}k</h3>
                            </div>
                            <div className="font-pixel" style={{ fontSize: '10px', opacity: 0.4, marginTop: 'auto', color: 'var(--text-secondary)' }}>Sync with {timeFilter} range</div>
                        </div>

                        <div className="admin-card" style={{ gridColumn: 'span 1', padding: '2rem' }}>
                            <div>
                                <span className="font-pixel text-accent" style={{ fontSize: '10px' }}>COMMITTED_ORDERS</span>
                                <h3 className="font-primary" style={{ fontSize: '4rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{stats.totalOrders}</h3>
                            </div>
                            <div className="flex gap-2 mt-auto">
                                {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as TimeFilter[]).map(f => (
                                    <button key={f} onClick={() => setTimeFilter(f)} className={`font-pixel ${timeFilter === f ? 'text-accent' : 'opacity-30'}`} style={{ fontSize: '8px', border: '1px solid var(--border-color)', background: 'transparent', padding: '4px 8px', borderRadius: '6px', color: timeFilter === f ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{f}</button>
                                ))}
                            </div>
                        </div>

                        <div className="admin-card" style={{ gridColumn: 'span 2', gridRow: 'span 2', padding: '2rem' }}>
                            <h4 className="font-serif mb-8" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Income Growth Spectrum</h4>
                            <div style={{ width: '100%', height: '360px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.chartData}>
                                        <defs>
                                            <linearGradient id="colRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} fontFamily="var(--font-pixel)" axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }} itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: 'var(--text-secondary)' }} />
                                        <Area type="monotone" dataKey="value" stroke="var(--accent-blue)" strokeWidth={3} fill="url(#colRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="admin-card" style={{ gridColumn: 'span 2', padding: '2rem' }}>
                            <h4 className="font-serif mb-6" style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>Popular Artifacts</h4>
                            <div className="flex flex-col gap-3">
                                {stats.productData.map((p, i) => (
                                    <div key={p.name} className="flex justify-between items-center bg-secondary p-4 rounded-xl border border-white/5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                                        <div className="flex items-center gap-4">
                                            <span className="font-pixel opacity-20 text-xs" style={{ color: 'var(--text-primary)' }}>0{i + 1}</span>
                                            <div className="font-primary font-bold text-sm truncate" style={{ maxWidth: '200px', color: 'var(--text-primary)' }}>{p.name}</div>
                                        </div>
                                        <div className="font-pixel text-xs text-accent">{p.value} UNIT</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Orders Tab --- */}
                {activeTab === 'ORDERS' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.5rem', marginBottom: '3rem', alignItems: 'center' }}>
                            <div className="flex p-1.5 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as TimeFilter[]).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setTimeFilter(f)}
                                        className={`tab-btn`}
                                        style={{ padding: '0.6rem 1.2rem', fontSize: '9px', background: timeFilter === f ? 'var(--bg-primary)' : 'transparent', color: timeFilter === f ? 'var(--accent-blue)' : 'var(--text-secondary)', borderRadius: '10px', fontWeight: 'bold' }}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search by Code, Name, or Artifact..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '1.2rem 1.25rem 1.2rem 3.5rem', background: 'var(--bg-secondary)', borderRadius: '1.2rem', fontSize: '14px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                                />
                                <div style={{ position: 'absolute', left: '1.4rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3, color: 'var(--text-primary)' }}>
                                    <Icon name="search" size={18} />
                                </div>
                            </div>
                            <button onClick={() => window.open('/', '_blank')} className="btn-primary-action" style={{ padding: '0 2rem', height: '100%', flex: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="plus" size={14} /> <span className="hide-mobile">CREATE_ORDER</span>
                            </button>
                        </div>

                        <div className="order-grid">
                            {filteredOrders.length === 0 && <div className="text-center py-24 opacity-20 font-pixel col-span-full" style={{ color: 'var(--text-primary)' }}>ZERO_RESULTS_RETURNED</div>}
                            {filteredOrders.map(order => (
                                <div key={order.id} className="admin-card">
                                    {/* Header: Code & Status */}
                                    <div className="card-header">
                                        <div className="order-code-badge">
                                            {order.order_code}
                                        </div>
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className={`status-pill-minimal ${order.status}`}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <option style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} value="pending">PENDING</option>
                                            <option style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} value="paid">PAID</option>
                                            <option style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} value="shipped">SHIPPED</option>
                                            <option style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} value="completed">DONE</option>
                                        </select>
                                    </div>

                                    {/* Titles */}
                                    <div className="card-title-group">
                                        <h4 className="customer-name">{order.customer_name}</h4>
                                        <div className="timestamp">
                                            {new Date(order.created_at).toLocaleDateString()}, {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    {/* Artifacts */}
                                    <div className="artifact-strip">
                                        {order.uploads && order.uploads.length > 0 ? (
                                            order.uploads.map((up: any) => (
                                                <div key={up.id} className="artifact-thumb group">
                                                    <img src={up.drive_file_id} alt="Artifact" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="font-pixel text-[9px] opacity-30 py-4" style={{ color: 'var(--text-primary)' }}>NO_DIRECT_UPLOADS</div>
                                        )}
                                    </div>

                                    {/* Info Box */}
                                    <div className="info-box">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="font-pixel text-[9px] tracking-wider" style={{ color: 'var(--text-secondary)' }}>MANIFEST_SUMMARY</span>
                                            <span className="font-primary text-sm font-bold" style={{ color: 'var(--accent-blue)' }}>Rp {order.total_price.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {order.order_items?.slice(0, 2).map((item: any) => (
                                                <div key={item.id} className="text-[11px] font-bold flex justify-between" style={{ color: 'var(--text-primary)' }}>
                                                    <span>{item.product_name}</span>
                                                    <span className="opacity-40">x{item.quantity || 1}</span>
                                                </div>
                                            ))}
                                            {order.order_items?.length > 2 && <div className="text-[10px] opacity-30 italic" style={{ color: 'var(--text-primary)' }}>+{order.order_items.length - 2} more items...</div>}
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="action-row">
                                        <button onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }} className="btn-glass" style={{ width: '40px', height: '40px', padding: 0, color: '#ff4d4d', borderColor: 'rgba(255, 77, 77, 0.3)' }} title="Delete Order">
                                            <Icon name="close" size={16} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); downloadZip(order); }} disabled={isDownloading === order.id} className="btn-glass" style={{ width: '40px', height: '40px', padding: 0 }}>
                                            <Icon name={isDownloading === order.id ? 'loading' : 'download'} size={18} />
                                        </button>
                                        <a href={`https://wa.me/${order.customer_phone}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="btn-glass" style={{ width: '40px', height: '40px', padding: 0 }}>
                                            <Icon name="wa" size={20} />
                                        </a>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }} className="btn-primary-action">
                                            <span>MANAGE_ARTIFACT</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Tools Tab --- */}
                {activeTab === 'TOOLS' && (
                    <div className="tools-grid animate-fade-in">
                        <div className="admin-card">
                            <div style={{ marginBottom: '3rem' }}>
                                <h3 className="font-serif text-3xl mb-4" style={{ color: 'var(--text-primary)' }}>Archive Export</h3>
                                <p className="font-pixel text-xs opacity-40 leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>Compile entire filtered production logs into standardized CSV or operational JSON formats for accounting.</p>
                            </div>
                            <div className="flex gap-4 mt-auto">
                                <button onClick={() => exportData('CSV')} className="flex-1 py-4 rounded-xl text-[10px] font-bold border transition-colors font-pixel" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>EXPORT_RAW_CSV</button>
                                <button onClick={() => exportData('JSON')} className="flex-1 py-4 rounded-xl text-[10px] font-bold border transition-colors font-pixel" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>EXPORT_CORE_JSON</button>
                            </div>
                        </div>
                        <div className="admin-card" style={{ background: 'var(--liquid-glass-bg)' }}>
                            <div style={{ marginBottom: '3rem' }}>
                                <h3 className="font-serif text-3xl mb-4" style={{ color: 'var(--text-primary)' }}>Data Migration</h3>
                                <p className="font-pixel text-xs opacity-40 leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>Synchronize and inject legacy invoice manifest files from previous environments into active Supabase production cluster.</p>
                            </div>
                            <label className="w-full py-4 mt-auto rounded-xl text-[10px] font-bold flex items-center justify-center cursor-pointer shadow-lg transition-all font-pixel" style={{ background: 'var(--accent-blue)', color: 'white' }}>
                                INIT_MANIFEST_INJECTION
                                <input type="file" accept=".json" style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Manage Order Modal (Rendered Outside Container) --- */}
            {/* --- Manage Order Modal --- */}
            {selectedOrder && (
                <div className="modal-fixed-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="modal-header">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="px-2 py-1 border rounded text-[9px] font-pixel" style={{ background: 'rgba(37,99,235,0.1)', borderColor: 'rgba(37,99,235,0.2)', color: 'var(--accent-blue)' }}>ORDER #{selectedOrder.order_code}</div>
                                    <span className="font-pixel opacity-30 text-[9px] tracking-wider" style={{ color: 'var(--text-secondary)' }}>SECURE_VIEW</span>
                                </div>
                                <h2 className="font-primary text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{selectedOrder.customer_name}</h2>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                                <Icon name="close" size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Left: Content */}
                            <div className="modal-content-left">
                                <h4 className="modal-section-title">Artifacts & Assets</h4>
                                <div className="artifact-slider-modal">
                                    {selectedOrder.uploads?.map((up: any) => (
                                        <div key={up.id} className="artifact-item-modal group">
                                            <img src={up.drive_file_id} className="w-full h-full object-cover" />
                                            <div className="artifact-actions-overlay">
                                                <button onClick={() => downloadSingle(up.drive_file_id, up.file_name)} className="btn-glass">
                                                    <Icon name="download" size={14} /> SAVE
                                                </button>
                                                <a href={up.drive_file_id} target="_blank" rel="noreferrer" className="text-[9px] font-pixel hover:text-white underline decoration-dotted" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                                    VIEW_ORIGINAL
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedOrder.uploads || selectedOrder.uploads.length === 0) && (
                                        <div className="w-full py-20 rounded-3xl flex items-center justify-center opacity-20 font-pixel text-xs border border-dashed" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                            NO_ARTIFACTS_ON_RECORD
                                        </div>
                                    )}
                                </div>

                                <h4 className="modal-section-title mt-10">Cart Manifest</h4>
                                <div className="space-y-2">
                                    {selectedOrder.order_items?.map((item: any, idx: number) => (
                                        <div key={idx} className="manifest-item">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold font-pixel" style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', color: 'var(--accent-blue)' }}>{item.quantity}x</div>
                                                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.product_name}</span>
                                            </div>
                                            <div className="font-pixel opacity-30 text-[10px]" style={{ color: 'var(--text-secondary)' }}>ID_{item.product_id?.slice(0, 6) || 'N/A'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Sidebar */}
                            <div className="modal-sidebar-right">
                                <div>
                                    <h4 className="modal-section-title">Metadata</h4>
                                    <div className="space-y-4">
                                        <div className="metadata-box">
                                            <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Total Value</label>
                                            <div className="text-xl font-mono font-bold" style={{ color: 'var(--text-primary)' }}>Rp {selectedOrder.total_price.toLocaleString()}</div>
                                        </div>
                                        <div className="metadata-box">
                                            <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Customer</label>
                                            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{selectedOrder.customer_name}</div>
                                            <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>{selectedOrder.customer_email}</div>
                                        </div>
                                        <div className="metadata-box">
                                            <label className="text-[10px] block mb-1 font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Contact</label>
                                            <div className="text-sm font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>{selectedOrder.customer_phone}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sidebar-action-group">
                                    <div className="status-tabs">
                                        {(['pending', 'paid', 'shipped', 'completed']).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => updateStatus(selectedOrder.id, s)}
                                                className={`status-tab-btn ${selectedOrder.status === s ? `active-${s}` : ''}`}
                                            >
                                                {s === 'completed' ? 'DONE' : s}
                                            </button>
                                        ))}
                                    </div>

                                    <a
                                        href={`https://wa.me/${selectedOrder.customer_phone}?text=${encodeURIComponent(
                                            `Halo ${selectedOrder.customer_name}, terima kasih telah memesan di Flamoure.co! 🖤\n\nIni konfirmasi untuk pesananmu:\n*Kode Pesanan:* ${selectedOrder.order_code}\n*Total:* Rp ${selectedOrder.total_price.toLocaleString()}\n\nMohon konfirmasi pembayaran atau kirim bukti transfer agar pesanan bisa segera kami proses ya. Terima kasih!`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-sidebar-action btn-whatsapp"
                                    >
                                        <Icon name="wa" size={18} /> INITIATE WHATSAPP
                                    </a>
                                    <button onClick={() => downloadZip(selectedOrder)} className="btn-sidebar-action btn-download-all">
                                        <Icon name="download" size={18} /> BATCH DOWNLOAD ZIP
                                    </button>
                                    <button onClick={generateInvoice} className="btn-invoice-regen">
                                        RE-GENERATE_INVOICE_PDF
                                    </button>

                                    <button onClick={() => deleteOrder(selectedOrder.id)} className="btn-invoice-regen" style={{ marginTop: '0', borderColor: 'rgba(255, 77, 77, 0.3)', color: '#ff4d4d' }}>
                                        DELETE_ORDER_PERMANENTLY
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Hidden Invoice Template for Admin Capture */}
            {selectedOrder && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <div id="admin-invoice-capture" style={{
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
                                    <strong style={{ fontSize: '14px', color: 'var(--accent-blue)' }}>#{selectedOrder.order_code}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px', fontSize: '11px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <span style={{ opacity: 0.4, display: 'block', marginBottom: '4px' }} className="font-pixel">ISSUED_TO</span>
                                    <strong style={{ fontSize: '12px' }}>{selectedOrder.customer_name}</strong>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ opacity: 0.4, display: 'block', marginBottom: '4px' }} className="font-pixel">DATE_STAMP</span>
                                    <strong style={{ fontSize: '12px' }}>{new Date(selectedOrder.created_at || Date.now()).toLocaleDateString('id-ID')}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <span style={{ opacity: 0.4, display: 'block', marginBottom: '15px' }} className="font-pixel">MANIFEST_DETAILS</span>
                            {selectedOrder.order_items?.length > 0 ? selectedOrder.order_items.map((item: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                                        <div style={{ fontSize: '9px', opacity: 0.5 }}>{item.quantity || 1} UNIT(S)</div>
                                    </div>
                                    <span style={{ fontWeight: 800 }}>Rp {item.price.toLocaleString()}</span>
                                </div>
                            )) : (
                                <div style={{ fontSize: '12px', opacity: 0.5, fontStyle: 'italic' }}>Recovering order manifest...</div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', opacity: 0.6 }}>SETTLEMENT_TOTAL</span>
                                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)' }}>Rp {selectedOrder.total_price.toLocaleString()}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px', textAlign: 'center' }}>
                            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', opacity: 0.3, letterSpacing: '0.4em' }}>VERIFIED_BY_FLAMOURE_ARCHIVES</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

