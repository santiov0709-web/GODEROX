/* GODEROX DIGITAL VIP PASS GENERATOR */

import { audio } from './audio.js';
import { cart } from './cart.js';

export function setupVipGate() {
  const vipForm = document.getElementById('vip-form');
  const vipCardContainer = document.getElementById('vip-card-display');

  if (!vipForm || !vipCardContainer) return;

  vipForm.onsubmit = (e) => {
    e.preventDefault();
    audio.playChime();

    const nameInput = document.getElementById('vip-name-input').value.trim() || 'MEMBRE VIP';
    const emailInput = document.getElementById('vip-email-input').value.trim();

    if (!emailInput) return;

    // Generate random luxury serial number: GDX-8894-0012
    const serial = `GDX-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    vipCardContainer.innerHTML = `
      <div class="vip-card-3d" id="vip-card-interactive">
        <div class="vip-card-inner">
          <div class="vip-card-front">
            <div class="vip-card-header">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <img src="/images/goderox_official_logo.jpeg" alt="Logo" style="width:30px; height:30px; border-radius:50%; border:1px solid var(--border-gold);" />
                <span class="vip-brand-title">GODEROX</span>
              </div>
              <span class="vip-badge-tier">ATELIER BLACK TIER</span>
            </div>
            
            <div class="vip-card-chip">
              <div class="vip-chip-pattern"></div>
            </div>

            <div class="vip-card-serial">${serial}</div>

            <div class="vip-card-footer">
              <div class="vip-holder-name">
                <label>TITULAR DEL PASE</label>
                <span>${nameInput.toUpperCase()}</span>
              </div>
              <div class="vip-validity">
                <label>ACCESO PRIVADO</label>
                <span class="gold-text-shimmer">DROP 004 UNLOCKED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="vip-unlocked-message animate-fade-in">
        <h3>PASE VIP GENERADO CON ÉXITO</h3>
        <p>Tu código de acceso exclusivo de 15% de descuento en el Atelier es: <strong class="gold-text-shimmer">GODEROXVIP</strong></p>
        <button class="vip-apply-code-btn" id="vip-apply-code-btn">APLICAR CÓDIGO AL BOLSO</button>
      </div>
    `;

    // Apply promo automatically if button clicked
    const applyBtn = document.getElementById('vip-apply-code-btn');
    if (applyBtn) {
      applyBtn.onclick = () => {
        cart.applyPromo('GODEROXVIP');
        alert('¡Código VIP "GODEROXVIP" aplicado a tu bolsa con 15% de descuento!');
      };
    }

    // 3D Card tilt effect on mouse movement
    const cardEl = document.getElementById('vip-card-interactive');
    if (cardEl) {
      cardEl.onmousemove = (evt) => {
        const rect = cardEl.getBoundingClientRect();
        const x = evt.clientX - rect.left - rect.width / 2;
        const y = evt.clientY - rect.top - rect.height / 2;
        cardEl.style.transform = `perspective(1000px) rotateY(${x / 12}deg) rotateX(${-y / 12}deg) scale(1.02)`;
      };
      cardEl.onmouseleave = () => {
        cardEl.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
      };
    }
  };
}
