import { VercelRequest, VercelResponse } from '@vercel/node';
import { drive } from './lib/drive';
import { supabase } from './lib/supabase';
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
        const folder_id = fields.folder_id?.[0];
        const uploadFiles = files.files; // This could be an array if multiple files sent

        if (!order_id || !folder_id || !uploadFiles) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        const fileList = Array.isArray(uploadFiles) ? uploadFiles : [uploadFiles];
        const results = [];

        for (const file of fileList) {
            const driveFile = await drive.files.create({
                requestBody: {
                    name: file.originalFilename || `upload-${Date.now()}`,
                    parents: [folder_id],
                },
                media: {
                    mimeType: file.mimetype,
                    body: fs.createReadStream(file.filepath),
                },
                fields: 'id',
            });

            // Track asset in Supabase
            if (driveFile.data.id) {
                await supabase.from('uploads').insert([
                    {
                        order_id,
                        file_name: file.originalFilename,
                        drive_file_id: driveFile.data.id
                    }
                ]);
                results.push(driveFile.data.id);
            }
        }

        return res.status(200).json({ success: true, file_ids: results });
    } catch (error: any) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: error.message });
    }
}
