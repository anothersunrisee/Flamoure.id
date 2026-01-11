
import React, { useState } from 'react';
import { Product, OrderData } from '../types';
import { ADMIN_WHATSAPP_NUMBER } from '../constants';

interface CheckoutModalProps {
  product: Product;
  templateName?: string;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ product, templateName, onClose }) => {
  const [formData, setFormData] = useState<OrderData>({
    customerName: '',
    customerWhatsApp: '',
    productName: product.name,
    templateName: templateName,
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerWhatsApp) {
      alert("Missing required identification.");
      return;
    }
    const message = `Halo FLAMOURE! %0A%0ASaya mau pesan: *${formData.productName}*%0A${formData.templateName ? `Template: *${formData.templateName}*%0A` : ""}%0A*Detail Pembeli:*%0ANama: ${formData.customerName}%0AWA: ${formData.customerWhatsApp}%0ACatatan: ${formData.notes || "-"}%0A%0ASetelah ini saya kirim file foto ya admin. Thank u! 🔥`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="absolute-bg-overlay" onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>

      <div className="modal-content-wrapper">
        <div className="modal-header-accent">
          <div className="flex items-center gap-2">
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }}></div>
            <span className="font-pixel" style={{ fontSize: '10px', letterSpacing: '0.2rem' }}>TRANSMIT_ORDER_V.01</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-body">
          <div style={{ textAlign: 'center' }}>
            <span className="font-script" style={{ fontSize: '2.5rem', color: 'var(--accent-blue)', opacity: 0.5, display: 'block' }}>reservation</span>
            <h4 className="font-pixel" style={{ fontSize: '1.5rem', textTransform: 'uppercase' }}>Confirm Manifest</h4>
          </div>

          <div className="input-field-group">
            <label>Identity_Name</label>
            <input
              name="customerName"
              type="text"
              required
              placeholder="INPUT NAME"
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field-group">
            <label>WhatsApp_Contact</label>
            <input
              name="customerWhatsApp"
              type="tel"
              required
              placeholder="+62"
              onChange={handleInputChange}
            />
          </div>

          <div className="input-field-group">
            <label>Special_Req</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="ANYTHING ELSE?"
              onChange={handleInputChange}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="modal-btn-finalize">
              FINALIZE & SEND
            </button>
            <p className="font-pixel" style={{ textAlign: 'center', fontSize: '9px', opacity: 0.4, marginTop: '1.5rem', letterSpacing: '0.1rem' }}>
              YOU WILL BE REDIRECTED TO WHATSAPP
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
