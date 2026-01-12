import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        console.log(`[API] get-orders execution start`);

        const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
        const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

        if (!supabaseUrl || !supabaseServiceKey || !supabaseUrl.startsWith('http')) {
            console.error('❌ Missing or invalid Supabase credentials in .env');
            return res.status(500).json({
                error: 'Database credentials missing',
                details: 'Check VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = req.headers.authorization;
        const adminUser = req.headers['x-admin-user'] as string;

        // Fallback to 'admin' if username not set in .env
        const expectedUser = (process.env.ADMIN_USERNAME || 'admin').trim();
        const expectedSecret = (process.env.ADMIN_SECRET || '').trim();

        if (
            !authHeader ||
            authHeader !== `Bearer ${expectedSecret}` ||
            (adminUser && adminUser.trim() !== expectedUser)
        ) {
            return res.status(401).json({
                error: 'Unauthorized',
                debug: process.env.NODE_ENV === 'development' ? `Expected user: ${expectedUser}` : 'Check Vercel Env Vars'
            });
        }

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
        console.error('[API ERROR]:', error.message || error);
        return res.status(500).json({ error: error.message || 'Unknown server error' });
    }
}
