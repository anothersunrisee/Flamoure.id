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

        // Generate Custom Order Code
        const date = new Date();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const firstLetter = customer_name ? customer_name.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase() || 'X' : 'X';

        // Get total count for increment
        const { count, error: countError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.warn('Failed to fetch order count, defaulting to random fallback');
            // Fallback to random if count fails, to prevent order blocking
        }

        const increment = (count || 0) + 1;
        // Format: FLAM-[FirstLetter][MMDD][Increment]
        // Example: FLAM-F01130001
        const order_code = `FLAM-${firstLetter}${mm}${dd}${String(increment).padStart(4, '0')}`;

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

        // 2. Create Order Items (Flattened based on quantity)
        const orderItems: any[] = [];
        items.forEach((item: any) => {
            const qty = item.quantity || 1;
            for (let i = 0; i < qty; i++) {
                orderItems.push({
                    order_id: order.id,
                    product_id: item.id || item.product_id,
                    product_name: item.name || item.product_name,
                    price: item.price,
                    metadata: item.metadata || {}
                });
            }
        });

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
