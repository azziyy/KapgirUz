'use strict';

/* ───── 1. CONFIG ───── */
const CONFIG = {
  SHEET_ID: '1qtO6iDbdbWMFEKBnAuHFRGitWLllcjogZwtt5o7wtlo',
  GIDS: {
    products: '0',
    sections: '2056203594',
    collections: '213538629',
    news: '705276355',
  },
  TELEGRAM_USERNAME: 'Azizbek_Bahromov',
  CACHE_TTL: 1000 * 60 * 15,
  STORAGE_KEYS: {
    USER: 'kapgir_user',
    FAVORITES: 'kapgir_favorites',
    CART: 'kapgir_cart',
    VIEWED_STORIES: 'kapgir_viewed_stories',
    CACHE: 'kapgir_cache_',
  },
  STORY_DURATION: 5000,
  PLACEHOLDER_IMG: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="%231a1a25" width="400" height="400"/><g transform="translate(140 130) scale(2.2)"><rect x="36" y="4" width="6" height="30" rx="3" fill="%23ff6b35" transform="rotate(28 39 19)"/><circle cx="24" cy="42" r="18" fill="%23ff6b35"/><circle cx="16" cy="36" r="2" fill="%231a1a25"/><circle cx="24" cy="33" r="2" fill="%231a1a25"/><circle cx="32" cy="36" r="2" fill="%231a1a25"/><circle cx="13" cy="44" r="2" fill="%231a1a25"/><circle cx="24" cy="42" r="2" fill="%231a1a25"/><circle cx="35" cy="44" r="2" fill="%231a1a25"/><circle cx="16" cy="50" r="2" fill="%231a1a25"/><circle cx="24" cy="52" r="2" fill="%231a1a25"/><circle cx="32" cy="50" r="2" fill="%231a1a25"/></g></svg>',
  // Section item limit before "Barchasi" button
  SECTION_LIMITS: { grid: 10, carousel: 10, list: 8, hero: 99 },
  // Product card image auto-rotate interval (ms)
  CARD_ROTATE_MS: 3000,
  HERO_ROTATE_MS: 4500,
};

/* ───── 2. STATE ───── */
const State = {
  user: null,
  products: [],
  sections: [],   // non-story sections (carousel, grid, etc.)
  collections: [],
  news: [],
  stories: [],    // built from sections where type==='story'
  favorites: [],
  cart: [],
  viewedStories: [],
  currentPage: 'home',
  currentStoryIndex: 0,
  storyTimer: null,
  searchFilters: { material: '', minLen: '', maxLen: '' },
  // Active intervals for card slideshows & hero rotation (cleared on re-render)
  intervals: [],
};

// Helper to manage intervals so we can clear them on re-render
const clearIntervals = () => {
  State.intervals.forEach(id => clearInterval(id));
  State.intervals = [];
};
const addInterval = (fn, ms) => {
  const id = setInterval(fn, ms);
  State.intervals.push(id);
  return id;
};