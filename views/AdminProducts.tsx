import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// @ts-ignore
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Shared Icon Component
const Icon = ({ name, size = 16 }: { name: string, size?: number }) => {
    const icons: any = {
        plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />,
        edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />,
        trash: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />,
        image: <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />,
        close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />,
        upload: <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
    };
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            {icons[name] || <circle cx="12" cy="12" r="10" />}
        </svg>
    );
};

export const AdminProducts: React.FC = () => {
    const [productList, setProductList] = useState<any[]>([]);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setProductList(data || []);
        } catch (err: any) {
            console.error('Error fetching products:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this artifact? This action cannot be undone.')) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            setProductList(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            alert('Delete failed: ' + err.message);
        }
    };

    const handleSaveProduct = async () => {
        if (!editingProduct.name || !editingProduct.image) {
            alert('Artifact Name and Visual are required.');
            return;
        }

        try {
            if (editingProduct.id) {
                // Update
                const { error } = await supabase.from('products').update({
                    name: editingProduct.name,
                    price: editingProduct.price,
                    image: editingProduct.image,
                    type: editingProduct.type,
                    category: editingProduct.category,
                    is_active: editingProduct.is_active
                }).eq('id', editingProduct.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase.from('products').insert([{
                    name: editingProduct.name,
                    price: editingProduct.price,
                    image: editingProduct.image,
                    type: editingProduct.type,
                    category: editingProduct.category,
                    is_active: editingProduct.is_active
                }]);
                if (error) throw error;
            }
            setEditingProduct(null);
            fetchProducts();
        } catch (err: any) {
            alert('Operation failed: ' + err.message);
        }
    };

    return (
        <div className="animate-fade-in w-full">
            {/* --- Toolbar --- */}
            <div className="orders-filter-bar mb-8 flex justify-end">
                <button
                    onClick={() => setEditingProduct({ name: '', price: 0, image: '', type: 'merch', is_active: true })}
                    className="btn-primary-action"
                    style={{ flex: 'none', width: 'auto' }}
                >
                    <Icon name="plus" size={16} />
                    <span className="font-bold tracking-wide text-[10px] hide-mobile ml-2">ADD_ARTIFACT</span>
                </button>
            </div>

            {/* --- Grid --- */}
            <div className="order-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
                {productList.length === 0 && !loading && (
                    <div className="text-center py-24 opacity-20 font-pixel col-span-full text-white">
                        NO_ARTIFACTS_FOUND
                    </div>
                )}

                {productList.map(p => (
                    <div key={p.id} className="admin-card group" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative' }}>
                            <img
                                src={p.image}
                                alt={p.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                className="group-hover:scale-110"
                            />

                            {/* Badges */}
                            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                                <span className={`px-2 py-1 rounded-md text-[9px] font-bold tracking-widest backdrop-blur-md ${p.is_active ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                                    {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>

                            {/* Actions Overlay */}
                            <div className="card-actions-overlay">
                                <button
                                    onClick={() => setEditingProduct(p)}
                                    className="action-btn-circle edit"
                                    title="Edit Artifact"
                                >
                                    <Icon name="edit" size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="action-btn-circle delete"
                                    title="Delete Artifact"
                                >
                                    <Icon name="trash" size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="font-pixel text-[9px] opacity-50 uppercase tracking-widest text-[#888]">{p.type}</div>
                            <h4 className="font-primary font-bold text-lg leading-snug truncate text-white">{p.name}</h4>
                            <div className="font-mono text-accent font-bold mt-auto text-[1.1rem]">Rp {p.price.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- Modal --- */}
            {editingProduct && (
                <div className="modal-fixed-overlay" onClick={() => setEditingProduct(null)}>
                    <div className="modal-card animate-scale-in" style={{ maxWidth: '700px', height: 'auto', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="modal-header">
                            <div>
                                <h2 className="font-serif text-3xl mb-1 text-white">{editingProduct.id ? 'Edit Artifact' : 'New Artifact'}</h2>
                                <p className="font-pixel text-[10px] opacity-40 uppercase tracking-widest text-white">System Database Management</p>
                            </div>
                            <button onClick={() => setEditingProduct(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-white">
                                <Icon name="close" size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body custom-scrollbar" style={{ padding: '2rem', overflowY: 'auto' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Visual Upload */}
                                <div>
                                    <label className="input-label">Artifact Visual</label>
                                    <div className="relative group">
                                        <div className="drop-zone">
                                            {editingProduct.image ? (
                                                <img src={editingProduct.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center p-6 text-white/40">
                                                    <div className="mb-3 flex justify-center"><Icon name="image" size={32} /></div>
                                                    <span className="font-pixel text-[9px]">CLICK_TO_UPLOAD</span>
                                                </div>
                                            )}

                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
                                                    try {
                                                        const { error } = await supabase.storage.from('products').upload(fileName, file);
                                                        if (error) throw error;
                                                        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
                                                        setEditingProduct({ ...editingProduct, image: publicUrl });
                                                    } catch (err: any) {
                                                        alert('Upload Failed: ' + err.message);
                                                    }
                                                }}
                                            />

                                            {editingProduct.image && (
                                                <div className="drop-zone-overlay">
                                                    <span className="font-pixel text-xs text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">CHANGE</span>
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            value={editingProduct.image}
                                            onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                                            placeholder="or paste URL..."
                                            className="input-glass mt-3 text-[10px]"
                                        />
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="input-label">Artifact Name</label>
                                        <input
                                            type="text"
                                            value={editingProduct.name}
                                            onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                            className="input-glass text-lg font-bold"
                                            placeholder="e.g. Obsidian Key"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="input-label">Price</label>
                                            <input
                                                type="number"
                                                value={editingProduct.price}
                                                onChange={e => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                                                className="input-glass font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="input-label">Type</label>
                                            <select
                                                value={editingProduct.type}
                                                onChange={e => setEditingProduct({ ...editingProduct, type: e.target.value })}
                                                className="input-glass"
                                            >
                                                <option value="merch">MERCH</option>
                                                <option value="keychain">KEYCHAIN</option>
                                                <option value="sticker">STICKER</option>
                                                <option value="photostrip">PHOTOSTRIP</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="input-label">Sub-Collection</label>
                                        <input
                                            type="text"
                                            value={editingProduct.category || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                            className="input-glass"
                                            placeholder="e.g. Basic Series"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <div className="input-glass flex items-center justify-between cursor-pointer hover:bg-white/5" onClick={() => setEditingProduct({ ...editingProduct, is_active: !editingProduct.is_active })}>
                                            <div>
                                                <div className="text-sm font-bold">Visibility</div>
                                                <div className="font-pixel text-[9px] opacity-50">IS_PUBLIC</div>
                                            </div>
                                            <div className={`toggle-switch ${editingProduct.is_active ? 'active' : ''}`}>
                                                <div className="toggle-knob" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer" style={{ padding: '2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifySelf: 'flex-end', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setEditingProduct(null)} className="px-6 py-3 rounded-xl font-bold text-xs hover:bg-white/5 transition-colors text-gray-400">
                                CANCEL
                            </button>
                            <button onClick={handleSaveProduct} className="px-8 py-3 rounded-xl font-bold text-xs bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 transition-all">
                                {editingProduct.id ? 'SAVE_CHANGES' : 'CREATE_ARTIFACT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
