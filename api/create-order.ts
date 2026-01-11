import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase';
import { drive } from './lib/drive';
import { v4 as uuidv4 } from 'uuid';

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

        // 1. Create Folder in Google Drive
        const folder = await drive.files.create({
            requestBody: {
                name: order_code,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [process.env.GDRIVE_PARENT_FOLDER_ID!],
            },
            fields: 'id',
        });

        const drive_folder_id = folder.data.id;

        // 2. Create Order in Supabase
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
                    drive_folder_id,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (orderError) throw orderError;

        // 3. Create Order Items
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
            order_code,
            drive_folder_id
        });
    } catch (error: any) {
        console.error('Create Order Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
