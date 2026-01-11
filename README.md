# FLAMOURE - Visual Archive & Studio

Flamoure is a high-end visual exploration platform and digital studio dedicated to "those who feel the weight of digital nostalgia." This application serves as a gateway to curated analog artifacts and a specialized studio for creating custom photostrips.

## 🚀 Core Engine & Logic

### 1. Photostrip Studio Module
The heart of the application, featuring a custom-built editor (`PhotostripView.tsx`):
- **3-Frame Precision Layout**: Optimized for 190x640px digital strips with pixel-perfect alignment for decorative frames (star, clouds, and logo overlays).
- **Manipulation Engine**: Real-time image scaling, custom 15° incremental rotation, and per-slot panning.
- **D-Pad Positional System**: A dedicated "Position Precision" control suite for granular image adjustments.
- **Undo/Redo Architecture**: State-based history management allowing users to revert or re-apply changes across all configurations.
- **Transparency Overlay**: Uses high-performance `<img>` overlays to handle complex PNG frames with alpha channels.

### 2. Smart Pricing Logic
The shopping cart (`App.tsx`) implements dynamic pricing models:
- **Photostripe Promo**: Standard price is **Rp 3.000** per strip, but the system automatically triggers a **"4 for Rp 10.000"** bundle (applied in multiples: 4, 8, 12, etc.).
- **Automatic Discount Detection**: The "Bag" page proactively calculates the best price for the user, displaying a `BULK_DISCOUNT_APPLIED` status when the promo threshold is met.
- **Merchandise Store**:
  - **Keychains**: Fixed at Rp 14.900.
  - **Stickers**: Fixed at Rp 7.900 per pack.

### 3. Integrated Shopping Experience
- **Category-Based Navigation**: Dynamic routing between 'Archives' (Home), 'Series' (Photostrip selection), 'Shop' (Merch selection), and the 'Studio'.
- **Persistence & State**: Managed using local React state with cross-view continuity, allowing users to "Inject Data" back into the studio from their cart for quick edits.
- **Mobile-First Layout**: Fully responsive D-pad controls, adaptive container padding, and a fixed mobile navigation taskbar.

## 🎨 Design Ethics

- **Visual Identity**: Monochromatic palette with electric blue accents (#2563eb).
- **Typography**: 
  - `DM Sans` for functional UI data.
  - `Instrument Serif` for storytelling and high-impact headings.
  - `VT323` (Pixel) for navigational keywords and status indicators.
- **Premium UX**: Glassmorphism headers, micro-animations on hover, and smooth state transitions.

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **Styling**: Pure CSS3 with CSS Variables for global theming (Monochrome/Dark support).
- **Build Tool**: Vite

## 📦 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Dev Environment**:
   ```bash
   npm run dev
   ```
3. **Build for Production**:
   ```bash
   npm run build
   ```

---
© 2026 Visual Syndicate. Crafting the weight of digital nostalgia.
