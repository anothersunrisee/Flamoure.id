import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        status: 'ok',
        env_keys: Object.keys(process.env).filter(k =>
            k.includes('SUPABASE') ||
            k.includes('ADMIN') ||
            k.includes('VITE')
        )
    });
}
