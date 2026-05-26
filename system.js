'use strict';

/* ───── 18b. BACK BUTTON / HISTORY ───── */
const HistoryManager = {
  // Stack of close-actions for currently open overlays/pages
  stack: [],

  push(closeFn, name = 'view') {
    this.stack.push({ closeFn, name });
    try {
      history.pushState({ kapgir: true, idx: this.stack.length, name }, '');
    } catch (e) {}
  },

  pop() {
    const item = this.stack.pop();
    if (item && typeof item.closeFn === 'function') {
      try { item.closeFn(); } catch (e) { console.warn(e); }
    }
  },

  // Browser/system back button pressed
  onPopState() {
    if (this.stack.length > 0) {
      const item = this.stack.pop();
      if (item && typeof item.closeFn === 'function') {
        try { item.closeFn(); } catch (e) { console.warn(e); }
      }
      return;
    }
    // No overlay open => if current page is not 'home', go home
    if (State.currentPage && State.currentPage !== 'home') {
      Navigation.goTo('home', true);
      // Push a state so user can press back again to exit
      try { history.pushState({ kapgir: true, root: true }, ''); } catch (e) {}
      return;
    }
    // Else: confirm exit
    this.confirmExit();
  },

  confirmExit() {
    // Re-push state so the page doesn't actually leave
    try { history.pushState({ kapgir: true, root: true }, ''); } catch (e) {}
    const now = Date.now();
    if (this._exitAt && now - this._exitAt < 2000) {
      // Second tap within 2s — actually try to exit
      try { window.close(); } catch (e) {}
      // PWA / browser: history.back may exit
      try { history.back(); } catch (e) {}
      return;
    }
    this._exitAt = now;
    toast('Chiqish uchun yana bir marta bosing');
  },

  init() {
    // Initial state so first back press is captured
    try { history.pushState({ kapgir: true, root: true }, ''); } catch (e) {}
    window.addEventListener('popstate', () => this.onPopState());
  },
};

/* ───── 19. PWA ───── */
let deferredPrompt;
const PWA = {
  init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (Storage.get('install_dismissed')) return;
      setTimeout(() => $('#installPrompt').classList.remove('hidden'), 5000);
    });
    $('#installBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      $('#installPrompt').classList.add('hidden');
      if (outcome === 'accepted') toast('Ilova o\'rnatildi! 🎉');
    });
    $('#installClose').addEventListener('click', () => {
      $('#installPrompt').classList.add('hidden');
      Storage.set('install_dismissed', true);
    });
    if ('serviceWorker' in navigator) {
      const swCode = `
        const CACHE = 'kapgir-v2';
        self.addEventListener('install', e => self.skipWaiting());
        self.addEventListener('activate', e => self.clients.claim());
        self.addEventListener('fetch', e => {
          if (e.request.method !== 'GET') return;
          e.respondWith(
            caches.open(CACHE).then(cache =>
              cache.match(e.request).then(cached => {
                const fetchP = fetch(e.request).then(res => {
                  if (res && res.status === 200) cache.put(e.request, res.clone());
                  return res;
                }).catch(() => cached);
                return cached || fetchP;
              })
            )
          );
        });
      `;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      navigator.serviceWorker.register(url).catch(err => console.warn('SW failed', err));
    }
  },
};

/* ───── 20. PULL TO REFRESH (kam sezgir) ───── */
const PullToRefresh = {
  init() {
    let startY = 0;
    let startX = 0;
    let pulling = false;
    let refreshing = false;
    const indicator = $('#pullRefresh');
    // Refresh masofa va sezgirlik chegaralari (oshirilgan)
    const SHOW_AT = 120;       // indikator ko'rinadi (oldin 60 edi)
    const TRIGGER_AT = 200;    // refresh ishga tushadi (oldin 100 edi)
    const HORIZ_TOLERANCE = 30; // gorizontal harakat ko'p bo'lsa bekor qilamiz

    const isInsideScrollable = (el) => {
      while (el && el !== document.body) {
        if (el.classList && (
            el.classList.contains('carousel-scroll') ||
            el.classList.contains('gallery-thumbs') ||
            el.classList.contains('stories-scroll') ||
            el.classList.contains('bottom-sheet') ||
            el.classList.contains('sheet-content') ||
            el.classList.contains('search-filters') ||
            el.classList.contains('story-viewer') ||
            el.classList.contains('video-player') ||
            el.classList.contains('image-viewer')
          )) return true;
        el = el.parentElement;
      }
      return false;
    };

    document.addEventListener('touchstart', (e) => {
      if (refreshing) return;
      // Faqat sahifaning eng tepasidaligida ishlasin
      if (window.scrollY > 2) return;
      // Modal/sheet/story ochiq bo'lsa — ishlamasin
      const anyModalOpen = document.querySelector('.bottom-sheet:not(.hidden), .story-viewer:not(.hidden), .video-player:not(.hidden), .image-viewer:not(.hidden), .modal-overlay:not(.hidden)');
      if (anyModalOpen) return;
      // Skrollanadigan elementning ichida bo'lsa — ishlamasin
      if (isInsideScrollable(e.target)) return;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      pulling = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!pulling || refreshing) return;
      const diffY = e.touches[0].clientY - startY;
      const diffX = Math.abs(e.touches[0].clientX - startX);
      // Gorizontal swipe — bekor qilamiz
      if (diffX > HORIZ_TOLERANCE) { pulling = false; indicator.classList.remove('visible'); return; }
      if (diffY > SHOW_AT) indicator.classList.add('visible');
      else indicator.classList.remove('visible');
    }, { passive: true });

    document.addEventListener('touchend', async (e) => {
      if (!pulling || refreshing) return;
      pulling = false;
      const diff = (e.changedTouches[0]?.clientY || 0) - startY;
      if (diff > TRIGGER_AT) {
        refreshing = true;
        indicator.classList.add('refreshing');
        try { await App.refresh(); } catch (err) {}
        indicator.classList.remove('refreshing', 'visible');
        refreshing = false;
      } else {
        indicator.classList.remove('visible');
      }
    }, { passive: true });
  },
};