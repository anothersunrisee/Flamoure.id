import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            customer_name,
            customer_email,
            customer_phone,
            customer_address,
            total_price,
            items
        } = req.body;

        const order_code = `FLAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // 1. Create Order in Supabase
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([
                {
                    order_code,
                    customer_name,
                    customer_email,
                    customer_phone,
                    customer_address,
                    total_price,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Order Items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.id || item.product_id,
            product_name: item.name || item.product_name,
            price: item.price,
            metadata: item.metadata || {}
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        return res.status(200).json({
            success: true,
            order_id: order.id,
            order_code
        });
    } catch (error: any) {
        console.error('FULL_ERROR_LOG:', error);
        return res.status(500).json({ error: error.message, details: error });
    }
}
