/* GODEROX CART & CHECKOUT CONTROLLER */

import { PRODUCTS, CURRENCIES } from './data.js';
import { audio } from './audio.js';

class CartManager {
  constructor() {
    this.cart = this.loadCart();
    this.currentCurrency = 'COP';
    this.promoApplied = false;
    this.discountRate = 0;
    this.includeGiftBox = true;
    this.listeners = [];
  }

  loadCart() {
    try {
      const saved = localStorage.getItem('goderox_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('goderox_cart', JSON.stringify(this.cart));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.cart));
  }

  addItem(productOrId, size = 'M', monogram = '') {
    let product = typeof productOrId === 'object' && productOrId !== null ? productOrId : null;
    if (!product) {
      if (typeof window.getGlobalProduct === 'function') {
        product = window.getGlobalProduct(productOrId);
      }
    }
    if (!product) {
      product = PRODUCTS.find(p => p.id === productOrId || String(p.id) === String(productOrId));
    }
    if (!product) return;

    const productId = product.id;
    const chosenSize = size || (product.sizes ? product.sizes[0] : 'M');

    const existingIndex = this.cart.findIndex(
      item => item.id === productId && item.size === chosenSize && item.monogram === monogram
    );

    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += 1;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        priceUSD: product.priceUSD || product.price || 190000,
        image: product.images && product.images.length > 0 ? product.images[0] : '/images/goderox_official_logo.jpeg',
        size: chosenSize,
        monogram: monogram,
        quantity: 1,
        numbered: product.numbered || '001 / 100'
      });
    }

    if (typeof audio !== 'undefined' && audio.playChime) audio.playChime();
    this.saveCart();
  }

  removeItem(index) {
    audio.playWhoosh();
    this.cart.splice(index, 1);
    this.saveCart();
  }

  updateQuantity(index, delta) {
    audio.playTick(500);
    if (this.cart[index]) {
      this.cart[index].quantity += delta;
      if (this.cart[index].quantity <= 0) {
        this.cart.splice(index, 1);
      }
      this.saveCart();
    }
  }

  setCurrency(currCode) {
    if (CURRENCIES[currCode]) {
      this.currentCurrency = currCode;
      audio.playTick(600);
      this.notify();
    }
  }

  formatPrice(priceVal) {
    if (priceVal === null || priceVal === undefined || isNaN(priceVal)) return '';
    const num = Number(priceVal);
    const copAmount = num < 1000 ? Math.round(num * 1000) : Math.round(num);
    return `$ ${copAmount.toLocaleString('es-CO')} COP`;
  }

  getTotals() {
    const subtotalUSD = this.cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
    const discountUSD = subtotalUSD * this.discountRate;
    const totalUSD = Math.max(0, subtotalUSD - discountUSD);
    const totalCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotalFormatted: this.formatPrice(subtotalUSD),
      discountFormatted: this.formatPrice(discountUSD),
      totalFormatted: this.formatPrice(totalUSD),
      subtotalUSD,
      totalUSD,
      totalCount
    };
  }

  applyPromo(code) {
    const clean = code.trim().toUpperCase();
    if (clean === 'GODEROXVIP' || clean === 'LUXURY10') {
      this.promoApplied = true;
      this.discountRate = 0.15; // 15% VIP discount
      audio.playChime();
      this.notify();
      return { success: true, message: '15% DE DESCUENTO VIP APLICADO' };
    }
    return { success: false, message: 'CÓDIGO DE ACCESO NO VÁLIDO' };
  }
}

export const cart = new CartManager();
