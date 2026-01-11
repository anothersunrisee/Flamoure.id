# FLAMOURE - Visual Archive & Studio

Flamoure is a high-end visual platform designed for the Weight of Digital Nostalgia.

## 🛠 Tech Stack Update (Supabase Migration)

Sistem telah dimigrasikan sepenuhnya ke **Supabase** untuk Database dan Storage demi stabilitas total.

### 1. Supabase Storage Setup (PENTING)
1. Buka Dashboard Supabase > **Storage**.
2. Klik **New Bucket**.
3. Beri nama: `orders`.
4. Pilih **Public Bucket** agar gambar bisa diintip di panel admin.
5. Klik **Save**.

### 2. Database Schema (Update)
Pastikan Anda sudah memiliki tabel-tabel berikut:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  total_price BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: order_items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price BIGINT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: uploads
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  drive_file_id TEXT NOT NULL, -- Menyimpan URL Public Supabase
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. Vercel Environment Variables
Tambahkan/Update variabel berikut:

- `VITE_SUPABASE_URL`: URL Supabase Project.
- `VITE_SUPABASE_ANON_KEY`: Anon Key Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: **Service Role Key** (Wajib untuk bypass RLS).
- `ADMIN_SECRET`: Password untuk Admin Panel.
- `ADMIN_USERNAME`: Username untuk Admin Panel (Opsional, bawaan login adalah 'admin').

---

## 🔐 Admin Access
Panel admin sekarang berada di route rahasia dengan trigger teks di footer: **`#sysadminpanel`**.
Login memerlukan Username dan Password (`ADMIN_SECRET`).

## 📲 Contact Update
Nomor resmi WhatsApp Flamoure telah diperbarui menjadi: **0895363898438**.

---
© 2026 Visual Syndicate. Crafting the weight of digital nostalgia.
