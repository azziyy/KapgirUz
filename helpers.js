'use strict';

/* ───── 5. HELPERS ───── */
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

const escapeHTML = (str) => {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

const findProduct = (id) => State.products.find(p => p.id === String(id).trim());
const formatSize = (val) => val ? `${val} sm` : '—';

const fixImageUrl = (url) => {
  if (!url) return CONFIG.PLACEHOLDER_IMG;
  const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch) return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w800`;
  return url;
};

// Inline onerror callback — atribut ichiga PLACEHOLDER_IMG ni to'g'ridan-to'g'ri
// yopishtirish HTMLni buzadi (SVG ichidagi qo'shtirnoqlar tufayli),
// shuning uchun rasm yuklanmasa shu funksiya chaqiriladi.
window.imgFallback = function (el) {
  el.onerror = null;
  el.src = CONFIG.PLACEHOLDER_IMG;
};

const toast = (msg) => {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 300);
  }, 2200);
};

const lazyImg = (src, alt = '') => {
  const safeSrc = fixImageUrl(src);
  const safeAlt = escapeHTML(alt);
  return `<img class="product-img" data-src="${escapeHTML(safeSrc)}" alt="${safeAlt}" loading="lazy" />
          <div class="product-img-skeleton"></div>`;
};

const imgObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      const src = img.dataset.src;
      if (src) {
        const tmp = new Image();
        tmp.onload = () => {
          img.src = src;
          img.classList.add('loaded');
          const skel = img.parentNode.querySelector('.product-img-skeleton');
          if (skel) skel.style.display = 'none';
        };
        tmp.onerror = () => {
          img.src = CONFIG.PLACEHOLDER_IMG;
          img.classList.add('loaded');
          const skel = img.parentNode.querySelector('.product-img-skeleton');
          if (skel) skel.style.display = 'none';
        };
        tmp.src = src;
      }
      imgObserver.unobserve(img);
    }
  });
}, { rootMargin: '100px' });

const observeImages = (root = document) => {
  root.querySelectorAll('img.product-img[data-src]:not([src])').forEach(img => imgObserver.observe(img));
};

const addRipple = (e, el) => {
  const rect = el.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  r.style.width = r.style.height = size + 'px';
  r.style.left = (e.clientX - rect.left - size/2) + 'px';
  r.style.top = (e.clientY - rect.top - size/2) + 'px';
  el.appendChild(r);
  setTimeout(() => r.remove(), 600);
};

// Get current qty in cart for a product
const cartQty = (id) => {
  const item = State.cart.find(i => i.id === id);
  return item ? item.qty : 0;
};