/* GODEROX DYNAMIC PRODUCT DATABASE & CATALOG REGISTRY */

export const CURRENCIES = {
  USD: { symbol: '$', rate: 1.0, code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.92, code: 'EUR', name: 'Euro' },
  GBP: { symbol: '£', rate: 0.78, code: 'GBP', name: 'British Pound' },
  COP: { symbol: '$', rate: 4050.0, code: 'COP', name: 'Pesos Colombianos' }
};

export const INITIAL_PRODUCTS = [];

class DatabaseManager {
  constructor() {
    this.products = this.loadProducts();
  }

  loadProducts() {
    try {
      const stored = localStorage.getItem('goderox_products_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("DB load error:", e);
    }
    return [];
  }

  saveProducts() {
    try {
      localStorage.setItem('goderox_products_db', JSON.stringify(this.products));
    } catch (e) {
      console.warn("DB save error:", e);
    }
  }

  getProducts() {
    return this.products;
  }
}

export const db = new DatabaseManager();
export const PRODUCTS = db.getProducts();

export const LOOKBOOK_LOOKS = [
  {
    id: 'look-1',
    title: 'LOOK 01 // ARCHITECTURAL OBSIDIAN',
    subtitle: 'Atelier Collection 004',
    image: '/images/hero_banner.png',
    featuredItems: ['god-h-buz-01', 'god-h-pan-01'],
    description: 'Siluetas de gran peso volumétrico entrelazadas con arquitectura brutalista y sombras doradas.'
  },
  {
    id: 'look-2',
    title: 'LOOK 02 // ATELIER CRAFTSMANSHIP',
    subtitle: 'Monochrome High Frequency',
    image: '/images/product_3.png',
    featuredItems: ['god-h-cam-01', 'god-m-blu-01'],
    description: 'La convergencia del cuero italiano de napa de becerro y la precisión del calzado minimalista.'
  },
  {
    id: 'look-3',
    title: 'LOOK 03 // SANCTUARY STRUCTURE',
    subtitle: 'Minimalist Essential Geometry',
    image: '/images/product_5.png',
    featuredItems: ['god-h-cam-01', 'god-h-pan-01'],
    description: 'Geometría limpia y peso sustancial en tonos blanco puro y negro profundo.'
  }
];
