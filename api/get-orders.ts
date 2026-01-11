import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const authHeader = req.headers.authorization;
    const adminUser = req.headers['x-admin-user'] as string;

    const expectedUser = (process.env.ADMIN_USERNAME || '').trim();
    const expectedSecret = (process.env.ADMIN_SECRET || '').trim();

    // Debugging (Vercel Logs Only)
    if (!expectedUser || !expectedSecret) {
        console.error('CRITICAL: ADMIN_USERNAME or ADMIN_SECRET env vars are MISSING in Vercel settings.');
    }

    if (
        !authHeader ||
        authHeader !== `Bearer ${expectedSecret}` ||
        adminUser?.trim() !== expectedUser
    ) {
        return res.status(401).json({
            error: 'Unauthorized',
            debug: process.env.NODE_ENV === 'development' ? 'Check your .env' : 'Check Vercel Env Vars'
        });
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
