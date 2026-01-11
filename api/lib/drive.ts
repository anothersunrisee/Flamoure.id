import { google } from 'googleapis';

export function getDriveHandler() {
    try {
        const credentialsText = process.env.GOOGLE_SERVICE_ACCOUNT;
        if (!credentialsText) {
            throw new Error('MISSING_GOOGLE_SERVICE_ACCOUNT: Variabel belum ada di Vercel Dashboard.');
        }

        const credentials = JSON.parse(credentialsText);

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        return google.drive({
            version: 'v3',
            auth,
        });
    } catch (error: any) {
        console.error('DRIVE_INIT_ERROR:', error.message);
        throw new Error(`DRIVE_CONFIG_ERROR: ${error.message}`);
    }
}
