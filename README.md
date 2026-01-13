# FLAMOURE - Visual Archive & Studio

Flamoure is a high-end visual platform designed for the Weight of Digital Nostalgia.

## 💎 UI/UX Overhaul & Features (v2.6)

### 1. Product Management System (NEW)
- **Dedicated Admin Module**: A fully integrated product management dashboard within the Admin Panel (`#sysadminpanel`).
- **Visual Editing Suite**:
  - **Drag-and-Drop Uploads**: Seamlessly upload or replace artifact visuals directly to Supabase Storage.
  - **Live Preview**: Real-time visual feedback for image changes.
  - **Smart Metadata**: Manage Name, Price, Category (Merch/Photostrip/Keychain), and Sub-collections with a refined UI.
- **Inventory Control**:
  - **Visibility Toggle**: Instantly show/hide products from the public storefront with a sleek toggle switch.
  - **Status Badges**: Clear `ACTIVE` / `INACTIVE` indicators on product cards.

### 2. Admin Panel Redesign (Terminal Aesthetic)
- **Refactored Architecture**: Split complex views into modular components (`AdminView`, `AdminProducts`) for better performance and maintainability.
- **Unified Design System**: Migrated all admin styles to `admin.css`, utilizing global CSS variables for consistent theming.
- **Glassmorphism UI**: Implemented `btn-glass`, `btn-liquid`, and frosted glass card effects for a premium feel.
- **Improved Modal & Interaction**:
  - Horizontal **Artifact Slider** for better image browsing.
  - **Status Pills** with color-coded active states (Pending, Paid, Shipped, Done).

### 3. Homepage & Shop Experience
- **Language Switching**: Global English (EN) and Indonesian (ID) language toggle.
- **Dynamic Recommendations**: "Recommended Artifacts" section in the Cart/Bag view to encourage cross-selling.
- **Redesigned Footer**: Minimal, centered layout featuring the new "Visual Syndicate" branding.

---

## 🛠 Tech Stack Update (Supabase Migration)

System fully migrated to **Supabase** for Database and Storage stability.

### 1. Supabase Storage Setup (CRITICAL)
1. Open Supabase Dashboard > **Storage**.
2. **Bucket 1: `orders`** (Public) - For user uploads.
3. **Bucket 2: `products`** (Public) - For product catalog images. **(NEW)**
   - *Ensure "Public Bucket" is checked for both.*

### 2. Database Schema (Partial)
Ensure the `products` table exists:

```sql
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL,
    type TEXT NOT NULL, -- 'photostrip', 'merch', 'keychain', 'sticker'
    category TEXT,
    description TEXT,
    stock INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. Deployment & Environment
- **Vercel Enabled**: Project structure optimized for Vercel deployment.
- **Environment Variables**:
  - `VITE_SUPABASE_URL`: Supabase Project URL.
  - `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key.
  - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (for RLS bypass).

---

## 🔐 Admin Access
Admin panel route: **`#sysadminpanel`** (trigger via footer text or manual URL).
Credentials required.

## 📲 Contact
Official WhatsApp: **0895363898438**

---
© 2026 Visual Syndicate. Crafting the weight of digital nostalgia.
