-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL,
    type TEXT NOT NULL, -- 'photostrip', 'merch', 'keychain', 'sticker'
    category TEXT, -- Optional sub-category
    description TEXT,
    stock INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow public read access to active products
CREATE POLICY "Public products are viewable by everyone" 
ON products FOR SELECT 
USING (true);

-- Allow authenticated (admin) users to do everything
-- Note: In your current setup, you might be using anon key for everything with client-side auth. 
-- If so, you might need a policy that allows everything OR rely on Service Role key for admin ops.
-- For simplicity with your current "Terminal Access" implementation which allows write:
CREATE POLICY "Enable all access for all users" 
ON products FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert initial data from your constants (Optional Migration)
INSERT INTO products (name, price, image, type, category) VALUES
('FLAMOURE KEYCHAIN_01', 14900, '/product/keychain/keychain (1).png', 'keychain', 'merch'),
('FLAMOURE KEYCHAIN_02', 14900, '/product/keychain/keychain (2).png', 'keychain', 'merch'),
('Schrödinger‘s Cat', 14900, '/product/keychain/keychain - Schrödinger‘s cat.webp', 'keychain', 'merch'),
('Disk', 14900, '/product/keychain/keychain - disk.webp', 'keychain', 'merch'),
('Eightball', 14900, '/product/keychain/keychain - eightball.webp', 'keychain', 'merch'),
('Lighter', 14900, '/product/keychain/keychain - lighter.webp', 'keychain', 'merch'),
('Flamoure Set', 7900, '/product/sticker/stickers - flamoure set.webp', 'sticker', 'merch'),
-- Photostrip Series
('BASIC SERIES_01', 3000, '/product/photostripes/Basic Series/basic  (1).png', 'photostrip', 'Basic Series'),
('BASIC SERIES_02', 3000, '/product/photostripes/Basic Series/basic  (2).png', 'photostrip', 'Basic Series'),
('BASIC SERIES_03', 3000, '/product/photostripes/Basic Series/basic  (3).png', 'photostrip', 'Basic Series'),
('BASIC SERIES_04', 3000, '/product/photostripes/Basic Series/basic  (4).png', 'photostrip', 'Basic Series'),
('BASIC SERIES_05', 3000, '/product/photostripes/Basic Series/basic  (5).png', 'photostrip', 'Basic Series'),
('CUPID SERIES_01', 3000, '/product/photostripes/Cupid series/cupid (1).png', 'photostrip', 'Cupid Series'),
('CUPID SERIES_02', 3000, '/product/photostripes/Cupid series/cupid (2).png', 'photostrip', 'Cupid Series'),
('CUPID SERIES_03', 3000, '/product/photostripes/Cupid series/cupid (3).png', 'photostrip', 'Cupid Series'),
('KPOP SERIES_01', 3000, '/product/photostripes/Kpop Series/01.png', 'photostrip', 'Kpop Series'),
('KPOP SERIES_03', 3000, '/product/photostripes/Kpop Series/03.png', 'photostrip', 'Kpop Series'),
('KPOP SERIES_04', 3000, '/product/photostripes/Kpop Series/04.png', 'photostrip', 'Kpop Series'),
('KPOP SERIES_05', 3000, '/product/photostripes/Kpop Series/05.png', 'photostrip', 'Kpop Series');
