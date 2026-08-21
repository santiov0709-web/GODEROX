/* GODEROX WISHLIST & FAVORITES MANAGER */

import { audio } from './audio.js';

class WishlistManager {
  constructor() {
    this.items = this.load();
    this.listeners = [];
  }

  load() {
    try {
      const saved = localStorage.getItem('goderox_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem('goderox_wishlist', JSON.stringify(this.items));
    } catch (e) {
      console.warn("Wishlist save error:", e);
    }
    this.notify();
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.items));
  }

  toggle(productId) {
    const idx = this.items.indexOf(productId);
    if (idx > -1) {
      this.items.splice(idx, 1);
      audio.playWhoosh();
    } else {
      this.items.push(productId);
      audio.playChime();
    }
    this.save();
  }

  has(productId) {
    return this.items.includes(productId);
  }

  getCount() {
    return this.items.length;
  }
}

export const wishlist = new WishlistManager();
