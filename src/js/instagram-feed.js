/**
 * GODEROX — Dynamic Instagram Feed UI Component
 * Renders real posts from @goderox.co Meta Graph API
 */

import { fetchInstagramFeed } from './api/instagram.api.js';

export async function initInstagramFeedUI() {
  const container = document.getElementById('instagram-feed-container');
  if (!container) return;

  // Render Skeleton Loading State
  renderSkeletonState(container);

  // Fetch real data from API / Cache
  const result = await fetchInstagramFeed();

  if (result.status === 'SUCCESS' && result.data.length > 0) {
    renderRealFeed(container, result.data);
  } else {
    renderStatusState(container, result);
  }
}

/**
 * Render 4 skeleton placeholder cards while loading
 */
function renderSkeletonState(container) {
  container.innerHTML = `
    <div class="insta-feed-grid">
      ${[1, 2, 3, 4].map(() => `
        <div class="insta-card-skeleton">
          <div class="insta-skeleton-box"></div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render real posts from Meta Graph API
 */
function renderRealFeed(container, posts) {
  // Show 4 initial posts on desktop, up to 8 available for scrolling
  const displayPosts = posts.slice(0, 8);

  container.innerHTML = `
    <div class="insta-feed-grid" id="insta-feed-scroll">
      ${displayPosts.map((post, idx) => renderPostCard(post, idx)).join('')}
    </div>
  `;

  // Attach hover video autoplay handlers for Reels/Videos
  setupVideoHoverHandlers(container);
}

/**
 * Render individual post card
 */
function renderPostCard(post, idx) {
  const isVideo = post.media_type === 'VIDEO';
  const isCarousel = post.media_type === 'CAROUSEL_ALBUM';
  const mediaUrl = isVideo ? (post.thumbnail_url || post.media_url) : post.media_url;
  const permalink = post.permalink || 'https://www.instagram.com/goderox.co/';
  const caption = post.caption ? escapeHtml(post.caption.slice(0, 100)) + '...' : 'Publicación oficial @goderox.co';

  return `
    <a href="${permalink}" target="_blank" rel="noopener noreferrer" class="insta-feed-card" data-media-type="${post.media_type}">
      <div class="insta-media-wrapper">
        ${isVideo && post.media_url ? `
          <video 
            class="insta-video-player" 
            src="${post.media_url}" 
            poster="${post.thumbnail_url || ''}" 
            muted 
            loop 
            playsinline 
            preload="metadata">
          </video>
          <div class="insta-type-badge video-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        ` : `
          <img src="${mediaUrl}" alt="${caption}" class="insta-feed-img" loading="lazy" />
          ${isCarousel ? `
            <div class="insta-type-badge carousel-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="16" height="16" rx="2"/><path d="M7 22h13a2 2 0 0 0 2-2V7"/></svg>
            </div>
          ` : ''}
        `}

        <div class="insta-feed-hover-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
          <span>${isVideo ? 'Ver Reel en Instagram' : 'Ver en Instagram'}</span>
        </div>
      </div>
    </a>
  `;
}

/**
 * Setup hover autoplay for video elements if present
 */
function setupVideoHoverHandlers(container) {
  const cards = container.querySelectorAll('.insta-feed-card[data-media-type="VIDEO"]');
  cards.forEach(card => {
    const video = card.querySelector('video.insta-video-player');
    if (!video) return;

    card.addEventListener('mouseenter', () => {
      video.play().catch(err => {
        // Autoplay policy or media restriction fallback
        console.log('[Instagram UI] Video play prevented:', err);
      });
    });

    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });
}

/**
 * Render Error or Unconfigured Status State
 */
function renderStatusState(container, result) {
  const isMissingToken = result.status === 'MISSING_TOKEN' || result.status === 'TOKEN_EXPIRED';

  container.innerHTML = `
    <div class="insta-status-card">
      <div class="insta-status-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
      </div>

      <h3>${isMissingToken ? 'Conexión con Instagram @goderox.co Lista' : 'Instagram @goderox.co'}</h3>

      <p class="insta-status-msg">
        ${isMissingToken 
          ? 'La arquitectura oficial de Meta Graph API está 100% programada. Configura la credencial <code>VITE_INSTAGRAM_ACCESS_TOKEN</code> en el archivo <code>.env</code> para sincronizar automáticamente en vivo.'
          : result.message || 'Visita nuestra cuenta oficial en Instagram para ver las últimas colecciones y lanzamientos.'}
      </p>

      <a href="https://www.instagram.com/goderox.co/" target="_blank" rel="noopener noreferrer" class="btn-primary insta-status-btn">
        <span>VER PERFIL REAL @GODEROX.CO EN INSTAGRAM</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>
    </div>
  `;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[match]));
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInstagramFeedUI);
} else {
  initInstagramFeedUI();
}
