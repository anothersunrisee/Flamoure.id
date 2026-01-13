
import { Product, PhotostripTemplate } from './types';

export const ADMIN_WHATSAPP_NUMBER = "6281234567890"; // Ganti dengan nomor WA kamu

export const PRODUCTS: Product[] = [
  {
    id: 'ps-main',
    name: 'FLAMOURE PHOTOSTRIPES',
    price: 3000,
    image: '/product/Flamoure Photostripes.png',
    type: 'photostrip'
  },
  {
    id: 'kc-main',
    name: 'FLAMOURE KEYCHAINS',
    price: 14900,
    image: '/product/Flamoure Keychains.png',
    type: 'merch'
  },
  {
    id: 'st-main',
    name: 'UNDERGROUND STICKERS',
    price: 7900,
    image: '/product/Flamoure Stickers.png',
    type: 'merch'
  }
];

export const PHOTOSTRIP_SERIES: Product[] = [
  // Basic Series
  { id: 'bp-01', name: 'BASIC SERIES_01', price: 3000, image: '/product/photostripes/Basic Series/basic  (1).png', type: 'photostrip' },
  { id: 'bp-02', name: 'BASIC SERIES_02', price: 3000, image: '/product/photostripes/Basic Series/basic  (2).png', type: 'photostrip' },
  { id: 'bp-03', name: 'BASIC SERIES_03', price: 3000, image: '/product/photostripes/Basic Series/basic  (3).png', type: 'photostrip' },
  { id: 'bp-04', name: 'BASIC SERIES_04', price: 3000, image: '/product/photostripes/Basic Series/basic  (4).png', type: 'photostrip' },
  { id: 'bp-05', name: 'BASIC SERIES_05', price: 3000, image: '/product/photostripes/Basic Series/basic  (5).png', type: 'photostrip' },

  // Cupid series
  { id: 'cp-01', name: 'CUPID SERIES_01', price: 3000, image: '/product/photostripes/Cupid series/cupid (1).png', type: 'photostrip' },
  { id: 'cp-02', name: 'CUPID SERIES_02', price: 3000, image: '/product/photostripes/Cupid series/cupid (2).png', type: 'photostrip' },
  { id: 'cp-03', name: 'CUPID SERIES_03', price: 3000, image: '/product/photostripes/Cupid series/cupid (3).png', type: 'photostrip' },

  // Kpop Series
  { id: 'kp-01', name: 'KPOP SERIES_01', price: 3000, image: '/product/photostripes/Kpop Series/01.png', type: 'photostrip' },
  { id: 'kp-03', name: 'KPOP SERIES_03', price: 3000, image: '/product/photostripes/Kpop Series/03.png', type: 'photostrip' },
  { id: 'kp-04', name: 'KPOP SERIES_04', price: 3000, image: '/product/photostripes/Kpop Series/04.png', type: 'photostrip' },
  { id: 'kp-05', name: 'KPOP SERIES_05', price: 3000, image: '/product/photostripes/Kpop Series/05.png', type: 'photostrip' }
];

export const KEYCHAIN_PRODUCTS: Product[] = [
  { id: 'kc-schrodinger', name: 'Schrödinger‘s Cat', price: 14900, image: '/product/keychain/keychain - Schrödinger‘s cat.webp', type: 'merch' },
  { id: 'kc-disk', name: 'Disk', price: 14900, image: '/product/keychain/keychain - disk.webp', type: 'merch' },
  { id: 'kc-eightball', name: 'Eightball', price: 14900, image: '/product/keychain/keychain - eightball.webp', type: 'merch' },
  { id: 'kc-lighter', name: 'Lighter', price: 14900, image: '/product/keychain/keychain - lighter.webp', type: 'merch' },
];

export const STICKER_PRODUCTS: Product[] = [
  { id: 'st-flamoure-set', name: 'Flamoure Set', price: 7900, image: '/product/sticker/stickers - flamoure set.webp', type: 'merch' },
];

export const TEMPLATES: PhotostripTemplate[] = [
  ...Array.from({ length: 9 }).map((_, i) => ({
    id: `basic-0${i + 1}`,
    name: `BASIC_0${i + 1}`,
    bgColor: i % 2 === 0 ? '#ffffff' : '#111111',
    textColor: i % 2 === 0 ? '#000000' : '#ffffff',
    borderColor: 'transparent',
    backgroundImage: `/product/photostripes/Basic Series/basic  (${i + 1}).png`
  })),
  ...Array.from({ length: 3 }).map((_, i) => ({
    id: `cupid-0${i + 1}`,
    name: `CUPID_0${i + 1}`,
    bgColor: '#ffffff',
    textColor: '#ff4d4d',
    borderColor: 'transparent',
    backgroundImage: `/product/photostripes/Cupid series/cupid (${i + 1}).png`
  })),
  {
    id: 'kpop-01', name: 'KPOP_01', bgColor: '#000000', textColor: '#ccff00', borderColor: 'transparent',
    backgroundImage: '/product/photostripes/Kpop Series/01.png'
  },
  {
    id: 'kpop-03', name: 'KPOP_03', bgColor: '#ffffff', textColor: '#000000', borderColor: 'transparent',
    backgroundImage: '/product/photostripes/Kpop Series/03.png'
  },
  {
    id: 'kpop-04', name: 'KPOP_04', bgColor: '#111111', textColor: '#ffffff', borderColor: 'transparent',
    backgroundImage: '/product/photostripes/Kpop Series/04.png'
  },
  {
    id: 'kpop-05', name: 'KPOP_05', bgColor: '#ccff00', textColor: '#000000', borderColor: 'transparent',
    backgroundImage: '/product/photostripes/Kpop Series/05.png'
  }
];
