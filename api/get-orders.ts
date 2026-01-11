import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*),
                uploads (*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(orders);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
