'use strict';

/* ═══════════════════════════════════════════════════════════════
   21. APP — bootstrap & global text-node sanitizer
   ─────────────────────────────────────────────────────────────
   "FIX": Mahsulot modali (productModal), savatcha (cartModal),
   yangiliklar (newsModal) va boshqa overlaylar ichida ba'zan
   '/>' yoki ' " ' kabi xom HTML matn nodelari ekran chetida
   ko'rinib qoldi. Yechim — modallar va viewerlardagi child
   text-nodelarni doimiy ravishda tozalab turuvchi MutationObserver.
═══════════════════════════════════════════════════════════════ */

const SHEET_IDS_FOR_SANITIZE = [
  'productModal',
  'cartModal',
  'newsModal',
  'collectionModal',
  'sectionAllModal',
  'imageViewer',
  'videoPlayer',
  'storyViewer',
];

const cleanTextNodes = (node) => {
  if (!node || !node.childNodes) return;
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE) {
      // Faqat ELEMENT ichidagi (button/h2/span/p/...) matn nodelari saqlanadi.
      // Bevosita modal / sheet-content / overlay ichidagi "yalang'och" matn nodeni o'chiramiz.
      const parent = child.parentNode;
      if (!parent) continue;
      const tag = (parent.tagName || '').toLowerCase();
      // Bu konteynerlar ichida bevosita matn bo'lishi kerak emas (faqat element child)
      const stripContainers = new Set([
        'div', 'section', 'main', 'aside', 'header', 'footer', 'nav',
        'ul', 'ol', 'form', 'fieldset', 'figure', 'picture', 'video',
      ]);
      // Lekin bu konteyner aslida matn ko'rsatuvchi class bo'lsa (text content)
      // — undagi matnga tegmaymiz.
      const cls = (parent.className || '');
      const isTextual = /title|name|text|desc|sub|label|value|model|spec|caption|count|badge|meta|price/i.test(typeof cls === 'string' ? cls : '');
      if (stripContainers.has(tag) && !isTextual) {
        // Bo'sh matn — o'chiramiz; bo'sh emas matn — barcha trim qilingan belgini
        // tekshirib, agar u faqat HTML qoldiq belgilar ('"', '/>', "'", '\\\\') bo'lsa, o'chiramiz.
        const txt = child.textContent || '';
        const trimmed = txt.trim();
        if (!trimmed) {
          parent.removeChild(child);
        } else if (/^[\s"'/<>=\\]+$/.test(trimmed)) {
          parent.removeChild(child);
        }
      }
    } else if (child.nodeType === Node.COMMENT_NODE) {
      child.parentNode && child.parentNode.removeChild(child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      cleanTextNodes(child);
    }
  }
};

const sanitizeOverlay = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  cleanTextNodes(el);
};

const sanitizeAllOverlays = () => {
  SHEET_IDS_FOR_SANITIZE.forEach(sanitizeOverlay);
};

const installSanitizer = () => {
  // Initial cleanup
  sanitizeAllOverlays();
  // Har gal modal ichida innerHTML yangilansa — qayta tozalaymiz
  SHEET_IDS_FOR_SANITIZE.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const obs = new MutationObserver(() => {
      // microtask: tozalashni keyinchalik bajarish — yangi DOMni buzmasligi uchun
      requestAnimationFrame(() => cleanTextNodes(el));
    });
    obs.observe(el, { childList: true, subtree: true });
  });
};

const App = {
  async init() {
    State.user = Storage.get(CONFIG.STORAGE_KEYS.USER);
    State.favorites = Storage.get(CONFIG.STORAGE_KEYS.FAVORITES, []);
    State.cart = Storage.get(CONFIG.STORAGE_KEYS.CART, []);
    State.viewedStories = Storage.get(CONFIG.STORAGE_KEYS.VIEWED_STORIES, []);

    Navigation.bind();
    Stories.bind();
    Search.init();
    Profile.bind();
    Registration.bind();
    bindGlobalActions();
    VideoPlayer.bind();
    PWA.init();
    PullToRefresh.init();
    HistoryManager.init();
    Cart.updateBadge();

    // Modal/viewer ichidagi keraksiz matn nodelarini tozalovchi sanitizerni o'rnatamiz.
    installSanitizer();

    const minSplash = new Promise(r => setTimeout(r, 1200));
    try { await Sheets.loadAll(); }
    catch (e) { console.error('Load failed', e); toast('Ma\'lumotlar yuklanmadi'); }
    await minSplash;

    $('#splash').classList.add('fade-out');
    setTimeout(() => $('#splash').remove(), 600);
    $('#app').classList.remove('hidden');

    // Til tanlash: birinchi marta kirganida til tanlash modalini ko'rsatamiz
    const langAlreadySet = LanguageManager.load();
    if (!langAlreadySet) {
      // Birinchi kirish — til tanlash modalini ko'rsatamiz
      LanguageManager.show(() => {
        if (State.user) Profile.render();
        App.renderAll();
      });
    } else {
      // Til allaqachon saqlangan — UI ga til qo'llaymiz
      LanguageManager.applyToUI();
      if (State.user) Profile.render();
      this.renderAll();
    }
  },
  renderAll() {
    Stories.render();
    Sections.render();
    Collections.render();
    Favorites.render();
    Profile.updateStats();
    Search.renderFilters();
  },
  async refresh() {
    // Ma'lumotlar har safar yangilanadi — kesh tozalashning hojati yo'q
    await Sheets.loadAll();
    this.renderAll();
    toast('Yangilandi ✓');
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

window.KapgirApp = { App, State, CONFIG, Sheets, Storage };
