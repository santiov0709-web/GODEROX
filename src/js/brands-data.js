/* GODEROX DYNAMIC BRAND LOGO REGISTRY & ADMIN MANAGER */

import { audio } from './audio.js';

export const INITIAL_BRANDS = [
  {
    id: 'clemont',
    name: 'Clemont',
    subtext: 'CLEMONT ATELIER',
    logoUrl: '', // Default to SVG/Placeholder if empty
    placeholder: 'CLM',
    isOfficial: true,
    svgPath: `<svg class="brand-logo-svg" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="100" y="38" text-anchor="middle" font-family="'Cinzel', serif" font-size="22" font-weight="700" letter-spacing="4" fill="#E5C378">CLEMONT</text>
      <line x1="40" y1="46" x2="160" y2="46" stroke="#C8A55B" stroke-width="1.5" opacity="0.8"/>
    </svg>`
  },
  {
    id: 'labeur',
    name: 'Labeur',
    subtext: 'LABEUR',
    logoUrl: '',
    placeholder: 'LBR',
    isOfficial: true,
    svgPath: `<svg class="brand-logo-svg" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="100" y="38" text-anchor="middle" font-family="'Syne', sans-serif" font-size="24" font-weight="800" letter-spacing="6" fill="#FFFFFF">LABEUR</text>
      <circle cx="174" cy="24" r="3" fill="#C8A55B"/>
    </svg>`
  },
  {
    id: 'aurum',
    name: 'Aurum',
    subtext: 'AURUM 24K',
    logoUrl: '',
    placeholder: 'ARM',
    isOfficial: true,
    svgPath: `<svg class="brand-logo-svg" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 8L108 24H92L100 8Z" fill="#C8A55B"/>
      <text x="100" y="46" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-size="26" font-weight="700" letter-spacing="5" fill="#E5C378">AURUM</text>
    </svg>`
  },
  {
    id: 'yout',
    name: 'Y/OUT',
    subtext: 'Y / OUT STREETWEAR',
    logoUrl: '',
    placeholder: 'Y/OUT',
    isOfficial: true,
    svgPath: `<svg class="brand-logo-svg" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="100" y="38" text-anchor="middle" font-family="'Inter', sans-serif" font-size="24" font-weight="900" letter-spacing="3" fill="#FFFFFF">Y / OUT</text>
      <line x1="88" y1="12" x2="112" y2="44" stroke="#C8A55B" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'antes-real',
    name: 'Antes Real Ropa',
    subtext: 'ANTES REAL ROPA',
    logoUrl: '',
    placeholder: 'ARR',
    isOfficial: true,
    svgPath: `<svg class="brand-logo-svg" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M92 14L100 6L108 14L114 10L100 22L86 10L92 14Z" fill="#C8A55B"/>
      <text x="100" y="44" text-anchor="middle" font-family="'Cinzel', serif" font-size="15" font-weight="700" letter-spacing="2" fill="#FFFFFF">ANTES REAL ROPA</text>
    </svg>`
  }
];

class BrandRegistry {
  constructor() {
    this.brands = this.loadBrands();
    this.listeners = [];
  }

  loadBrands() {
    try {
      const stored = localStorage.getItem('goderox_brands_registry');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Error loading brands from storage", e);
    }
    return INITIAL_BRANDS;
  }

  saveBrands() {
    try {
      localStorage.setItem('goderox_brands_registry', JSON.stringify(this.brands));
    } catch (e) {
      console.warn("Error saving brands to storage", e);
    }
    this.notify();
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.brands));
  }

  updateBrandLogo(brandId, newLogoUrl) {
    const brand = this.brands.find(b => b.id === brandId);
    if (brand) {
      brand.logoUrl = newLogoUrl.trim();
      audio.playChime();
      this.saveBrands();
    }
  }

  resetBrandLogo(brandId) {
    const brand = this.brands.find(b => b.id === brandId);
    if (brand) {
      brand.logoUrl = '';
      audio.playWhoosh();
      this.saveBrands();
    }
  }
}

export const brandRegistry = new BrandRegistry();
