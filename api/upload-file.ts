import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './lib/supabase.js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const form = formidable({});

    try {
        const [fields, files]: [any, any] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const order_id = fields.order_id?.[0];
        const prefix = fields.prefix?.[0] || '';
        const uploadFiles = files.files;

        if (!order_id || !uploadFiles) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        const fileList = Array.isArray(uploadFiles) ? uploadFiles : [uploadFiles];
        const results = [];

        for (const file of fileList) {
            // Path structure: /order_id/prefix-filename
            const safePrefix = prefix ? `${prefix.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-` : '';
            const fileName = `${order_id}/${safePrefix}${Date.now()}-${file.originalFilename.replace(/[^a-z0-9.]/gi, '_')}`;
            const fileBuffer = fs.readFileSync(file.filepath);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('orders')
                .upload(fileName, fileBuffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            if (uploadData) {
                const { data: { publicUrl } } = supabase.storage
                    .from('orders')
                    .getPublicUrl(fileName);

                await supabase.from('uploads').insert([
                    {
                        order_id,
                        file_name: `${prefix}${file.originalFilename}`,
                        drive_file_id: publicUrl
                    }
                ]);
                results.push(publicUrl);
            }
        }

        return res.status(200).json({ success: true, urls: results });
    } catch (error: any) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: error.message });
    }
}
