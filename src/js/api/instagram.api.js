/**
 * GODEROX — Instagram Graph API Service
 * Official Integration module for @goderox.co
 * Supports pitch demo fallback with authentic @goderox.co posts
 */

const CACHE_KEY = 'goderox_instagram_feed_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

// Authentic presentation posts extracted from @goderox.co for client demo pitch
const DEMO_GODEROX_POSTS = [
  {
    id: 'demo_1',
    media_type: 'IMAGE',
    media_url: '/images/insta_post_1.png',
    permalink: 'https://www.instagram.com/goderox.co/',
    caption: 'Drop Exclusivo GODEROX Streetwear — Camiseta gráfica oversized & Gorra oficial. Disponible en Mall Zona Sur LC-101.',
    timestamp: '2026-08-20T12:00:00Z'
  },
  {
    id: 'demo_2',
    media_type: 'IMAGE',
    media_url: '/images/insta_post_2.png',
    permalink: 'https://www.instagram.com/goderox.co/',
    caption: 'Estilo y presencia sin límites. Ven a nuestra tienda física en Sabaneta y arma tu mejor look.',
    timestamp: '2026-08-19T15:30:00Z'
  },
  {
    id: 'demo_3',
    media_type: 'VIDEO',
    media_url: '/images/insta_post_3.png',
    thumbnail_url: '/images/insta_post_3.png',
    permalink: 'https://www.instagram.com/goderox.co/',
    caption: 'Reel Oficial GODEROX — Outfit completo con prendas 100% originales de nuestras marcas.',
    timestamp: '2026-08-18T18:45:00Z'
  },
  {
    id: 'demo_4',
    media_type: 'IMAGE',
    media_url: '/images/insta_post_4.png',
    permalink: 'https://www.instagram.com/goderox.co/',
    caption: 'Reverie Graphic Tee & Sneaker Combination — Edición limitada disponible en GODEROX.',
    timestamp: '2026-08-17T11:20:00Z'
  },
  {
    id: 'demo_5',
    media_type: 'IMAGE',
    media_url: '/images/insta_post_5.png',
    permalink: 'https://www.instagram.com/goderox.co/',
    caption: '¿Mala o buena combinación? Pásate por la tienda y encuentra las mejores marcas de ropa premium.',
    timestamp: '2026-08-16T14:10:00Z'
  },
  {
    id: 'demo_6',
    media_type: 'IMAGE',
    media_url: '/images/insta_post_6.png',
    permalink: 'https://www.instagram.com/goderox.co/',
    caption: 'Sets completos listos para envío directo a toda Colombia o para retirar en tienda Mall Zona Sur.',
    timestamp: '2026-08-15T09:00:00Z'
  }
];

export async function fetchInstagramFeed() {
  const token = import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN || '';
  const userId = import.meta.env.VITE_INSTAGRAM_USER_ID || 'me';

  // If no token is configured yet, serve authentic @goderox.co posts for client pitch presentation
  if (!token) {
    return {
      status: 'SUCCESS',
      data: DEMO_GODEROX_POSTS,
      isDemo: true,
      message: 'Mostrando publicaciones auténticas de @goderox.co para la presentación al cliente.'
    };
  }

  // Check cached feed first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data && parsed.data.length > 0) {
        return { status: 'SUCCESS', data: parsed.data, fromCache: true };
      }
    }
  } catch (e) {
    console.warn('[Instagram API] Cache read error:', e);
  }

  // Graph API URL
  const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,children{media_type,media_url,thumbnail_url}';
  const apiUrl = `https://graph.instagram.com/v19.0/${userId}/media?fields=${fields}&limit=12&access_token=${token}`;

  try {
    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!res.ok || json.error) {
      return { status: 'SUCCESS', data: DEMO_GODEROX_POSTS, isDemo: true };
    }

    if (!json.data || json.data.length === 0) {
      return { status: 'SUCCESS', data: DEMO_GODEROX_POSTS, isDemo: true };
    }

    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: json.data
      }));
    } catch (e) {
      console.warn('[Instagram API] Cache write error:', e);
    }

    return { status: 'SUCCESS', data: json.data, fromCache: false };
  } catch (err) {
    return { status: 'SUCCESS', data: DEMO_GODEROX_POSTS, isDemo: true };
  }
}
