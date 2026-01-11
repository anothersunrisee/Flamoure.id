# FLAMOURE - Visual Archive & Studio

Flamoure is a high-end visual exploration platform and digital studio dedicated to "those who feel the weight of digital nostalgia." This application serves as a gateway to curated analog artifacts and a specialized studio for creating custom photostrips.

## 🚀 Core Engine & Logic

### 1. Photostrip Studio Module
The heart of the application, featuring a custom-built editor (`PhotostripView.tsx`):
- **3-Frame Precision Layout**: Optimized for 190x640px digital strips with pixel-perfect alignment for decorative frames.
- **Manipulation Engine**: Real-time image scaling, custom 15° incremental rotation, and per-slot panning.
- **Undo/Redo Architecture**: State-based history management.

### 2. Smart Pricing Logic
The shopping cart (`App.tsx`) implements dynamic pricing models:
- **Photostripe Promo**: Standard price is **Rp 3.000** per strip, but the system automatically triggers a **"4 for Rp 10.000"** bundle.
- **Automatic Discount Detection**: The "Bag" page proactively calculates the best price.

### 3. Integrated Shopping Experience
- **Checkout Flow**: Full multistep UX (Review -> Data -> Upload -> WhatsApp).
- **Vercel API Integration**: Serverless functions handling secure order creation and Google Drive uploads.
- **Supabase Backend**: Metadata storage in `orders`, `order_items`, and `uploads`.

## ⚙️ Setup & Deployment (Vercel & Supabase)

### 1. Supabase Preparation
Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  total_price BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  drive_folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price BIGINT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. Vercel Environment Variables (Environment Variables)
Di Vercel, Anda wajib memasukkan key berikut di **Project Settings > Environment Variables**:

| Variable Name | Description | Source |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL Project Supabase | Supabase Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Anon/Public Key (sb_publishable...) | Supabase Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret Key** (Service Role) | Supabase Settings > API |
| `GOOGLE_SERVICE_ACCOUNT` | Isi file JSON Google Service Account | File JSON Anda (dijadikan 1 baris) |
| `GDRIVE_PARENT_FOLDER_ID` | ID Folder Drive Utama | URL Folder Google Drive |
| `ADMIN_SECRET` | Password untuk masuk ke panel /admin | Bebas (Buat sendiri) |

> **Catatan Penting**:
> - Di **Frontend (React)**: Gunakan `import.meta.env.VARIABLE_NAME`.
> - Di **Backend (Vercel API)**: Gunakan `process.env.VARIABLE_NAME`.
> - Awalan `VITE_` wajib ada agar variabel bisa diakses oleh React/Vite di sisi client.

### 3. Google Drive Access
1. Enable **Google Drive API** di Google Cloud Console.
2. Buat **Service Account** dan download JSON Key.
3. **PENTING**: Buka folder Google Drive Anda, klik **Share**, lalu tambahkan email service account (misal: `account@project.iam.gserviceaccount.com`) sebagai **Editor**.

---
© 2026 Visual Syndicate. Crafting the weight of digital nostalgia.
