/* ═══════════════════════════════════════════════════════════════
   KAPGIR PREMIUM — app.js  (v2 — Updated)
   - Stories from Sheet 2 (rows with column A = "story")
   - Product images: I=img1, J=img2, K=img3 ; Video: L
   - Simple video player (play/pause only)
   - Collection product click opens modal
   - Cart +/− buttons replace add button after adding
   - Search with filters (material, surface)
═══════════════════════════════════════════════════════════════ */

(() => {
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
    PLACEHOLDER_IMG: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="%231a1a25" width="400" height="400"/><text x="50%25" y="50%25" font-size="48" text-anchor="middle" dy=".3em" fill="%234a4a5c">🍳</text></svg>',
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
  };

  /* ───── 3. STORAGE ───── */
  const Storage = {
    get(key, def = null) {
      try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; }
      catch (e) { return def; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} },
    remove(key) { localStorage.removeItem(key); },
    cacheGet(key) {
      const data = this.get(CONFIG.STORAGE_KEYS.CACHE + key);
      if (!data) return null;
      if (Date.now() - data.t > CONFIG.CACHE_TTL) return null;
      return data.v;
    },
    cacheSet(key, value) { this.set(CONFIG.STORAGE_KEYS.CACHE + key, { t: Date.now(), v: value }); },
    clearAll() {
      Object.values(CONFIG.STORAGE_KEYS).forEach(k => {
        if (k.endsWith('_')) {
          Object.keys(localStorage).filter(key => key.startsWith(k)).forEach(key => localStorage.removeItem(key));
        } else { localStorage.removeItem(k); }
      });
    },
  };
  /* ───── 4. SHEETS ───── */
  const Sheets = {
    async fetch(gid, cacheKey) {
      if (cacheKey) {
        const cached = Storage.cacheGet(cacheKey);
        if (cached) return cached;
      }
      const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
      try {
        const res = await fetch(url);
        const text = await res.text();
        const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        const cols = json.table.cols.map(c => c.label || c.id);
        const rows = (json.table.rows || []).map(r => {
          const obj = {};
          (r.c || []).forEach((cell, i) => {
            const v = cell ? (cell.v !== null && cell.v !== undefined ? String(cell.v) : '') : '';
            obj[cols[i] || `col${i}`] = v;
            obj[`_${i}`] = v;
          });
          return obj;
        });
        if (cacheKey) Storage.cacheSet(cacheKey, rows);
        return rows;
      } catch (err) {
        console.error('Sheets.fetch error', err);
        if (cacheKey) {
          const stale = Storage.get(CONFIG.STORAGE_KEYS.CACHE + cacheKey);
          if (stale && stale.v) return stale.v;
        }
        return [];
      }
    },

    async loadAll() {
      const [products, sections, collections, news] = await Promise.all([
        this.fetch(CONFIG.GIDS.products, 'products'),
        this.fetch(CONFIG.GIDS.sections, 'sections'),
        this.fetch(CONFIG.GIDS.collections, 'collections'),
        this.fetch(CONFIG.GIDS.news, 'news'),
      ]);

      // 1-varaq: BAZA (Products)
      // A=Model, B=Material, C=Umumiy uzunlik, D=Truba uzunlik, E=Yog'och uzunlik,
      // F=Yuza raqami, G=Yuza o'lchami, H=ID, I=Rasm1, J=Rasm2, K=Rasm3, L=Video
      // Helper: '0.6' -> '06' (Sheets-dagi sonni matn ko'rinishida ko'rsatish)
      const fixModelFmt = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v).trim();
        if (!s) return '';
        // Agar son ko'rinishida bo'lsa va '0.X' ko'rinishida bo'lsa => '0X'
        const m = s.match(/^0\.(\d+)$/);
        if (m) return '0' + m[1];
        return s;
      };
      State.products = products.filter(r => r._0 || r._7).map(r => ({
        model: fixModelFmt(r._0),
        material: r._1 || '',
        totalLength: r._2 || '',
        tubeLength: r._3 || '',
        woodLength: r._4 || '',
        surfaceNumber: r._5 || '',
        surfaceSize: r._6 || '',
        id: String(r._7 || r._0 || '').trim(),
        image: r._8 || '',   // I
        image2: r._9 || '',  // J
        image3: r._10 || '', // K
        video: r._11 || '',  // L
        images: [r._8, r._9, r._10].filter(Boolean),
      })).filter(p => p.id);

      // 2-varaq: Sections - A=Type, B=Title, C=Product IDs
      // Type === 'story' => Instagram-style story at top
      const allSections = sections.filter(r => r._0).map(r => ({
        type: (r._0 || '').toLowerCase().trim(),
        title: r._1 || '',
        ids: (r._2 || '').split(',').map(s => s.trim()).filter(Boolean),
      }));

      // Separate stories from other sections (but preserve order for non-stories)
      State.stories = [];
      State.sections = [];
      allSections.forEach((sec, idx) => {
        if (sec.type === 'story') {
          // Each story-row creates one or more story items based on its products/images
          const prods = sec.ids.map(id => State.products.find(p => p.id === id)).filter(Boolean);
          if (prods.length) {
            prods.forEach((p, j) => {
              State.stories.push({
                id: `story_${idx}_${j}`,
                title: sec.title || p.model,
                image: p.image,
                productId: p.id,
              });
            });
          } else if (sec.title) {
            // Fallback story without product
            State.stories.push({
              id: `story_${idx}`,
              title: sec.title,
              image: '',
              productId: null,
            });
          }
        } else {
          State.sections.push(sec);
        }
      });

      // If no story rows in sheet, fall back to news as stories
      if (!State.stories.length && news.length) {
        State.stories = news.filter(r => r._0).slice(0, 10).map((r, i) => ({
          id: `nstory_${i}`, title: r._0 || '', image: r._2 || '', productId: null,
        }));
      }

      // 3-varaq: Collections
      State.collections = collections.filter(r => r._0).map((r, i) => ({
        id: 'col_' + i,
        name: r._0 || '',
        description: r._1 || '',
        image: r._2 || '',
        ids: (r._3 || '').split(',').map(s => s.trim()).filter(Boolean),
      }));

      // 4-varaq: News
      State.news = news.filter(r => r._0).map((r, i) => ({
        id: 'news_' + i, title: r._0 || '', text: r._1 || '', image: r._2 || '',
      }));

      console.log('✅ Data:', { products: State.products.length, sections: State.sections.length, stories: State.stories.length, collections: State.collections.length, news: State.news.length });
    },
  };
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
  /* ───── 6. PRODUCT CARD ───── */
  const renderCartControl = (productId) => {
    const qty = cartQty(productId);
    if (qty > 0) {
      return `
        <div class="card-qty-control" data-qty-control="${escapeHTML(productId)}">
          <button class="card-qty-btn" data-action="qty-down" data-id="${escapeHTML(productId)}" aria-label="−">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/></svg>
          </button>
          <span class="card-qty-value">${qty}</span>
          <button class="card-qty-btn" data-action="qty-up" data-id="${escapeHTML(productId)}" aria-label="+">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5v14"/></svg>
          </button>
        </div>`;
    }
    return `
      <button class="btn-add-cart" data-action="add-cart" data-id="${escapeHTML(productId)}" aria-label="Savatchaga qo'shish">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5v14"/></svg>
      </button>`;
  };

  const renderProductCard = (product) => {
    const liked = State.favorites.includes(product.id);
    const sizes = [];
    if (product.totalLength) sizes.push(formatSize(product.totalLength));
    return `
      <div class="product-card" data-product-id="${escapeHTML(product.id)}">
        <div class="product-img-wrap">
          ${lazyImg(product.image, product.model)}
          <div class="product-badges">
            ${product.material ? `<span class="badge badge-material">${escapeHTML(product.material)}</span>` : ''}
            ${product.video ? `<span class="badge badge-video"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>Video</span>` : ''}
          </div>
          <div class="product-actions">
            <button class="product-action-btn btn-like ${liked ? 'liked' : ''}" data-action="like" data-id="${escapeHTML(product.id)}" aria-label="Sevimli">
              <svg viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
          </div>
        </div>
        <div class="product-info">
          <div class="product-model">${escapeHTML(product.model || 'Model ' + product.id)}</div>
          <div class="product-meta">
            ${product.surfaceNumber ? `<span class="product-meta-item">Y: ${escapeHTML(product.surfaceNumber)}</span>` : ''}
            ${product.surfaceSize ? `<span class="product-meta-item">${escapeHTML(product.surfaceSize)}</span>` : ''}
          </div>
          <div class="product-bottom">
            <span class="product-size">${sizes.join(' • ') || '—'}</span>
            <div class="product-cart-wrap" data-cart-wrap="${escapeHTML(product.id)}">
              ${renderCartControl(product.id)}
            </div>
          </div>
        </div>
      </div>`;
  };

  // Update all cart controls for a given product across DOM
  const refreshCartControls = (id) => {
    document.querySelectorAll(`[data-cart-wrap="${CSS.escape(id)}"]`).forEach(wrap => {
      wrap.innerHTML = renderCartControl(id);
    });
  };
  /* ───── 7. SECTIONS ───── */
  const Sections = {
    render() {
      const container = $('#dynamicSections');
      if (!State.sections.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <h3>Bo'limlar topilmadi</h3>
            <p>Google Sheets 2-varag'iga ma'lumot qo'shing</p>
          </div>`;
        return;
      }
      const html = State.sections.map(sec => {
        const products = sec.ids.map(findProduct).filter(Boolean);
        if (!products.length && sec.type !== 'hero') return '';
        switch (sec.type) {
          case 'hero':     return this.renderHero(sec, products);
          case 'carousel': return this.renderCarousel(sec, products);
          case 'grid':     return this.renderGrid(sec, products);
          case 'list':     return this.renderList(sec, products);
          default:         return this.renderGrid(sec, products);
        }
      }).join('');
      container.innerHTML = html;
      observeImages(container);
    },

    renderHero(sec, products) {
      const first = products[0];
      if (!first) return '';
      return `
        <div class="section section-hero">
          <div class="hero-card" data-product-id="${escapeHTML(first.id)}">
            <img src="${escapeHTML(fixImageUrl(first.image))}" alt="${escapeHTML(first.model)}" loading="lazy" />
            <div class="hero-overlay">
              <div class="hero-title">${escapeHTML(sec.title || first.model)}</div>
              <div class="hero-meta">
                ${first.material ? `<span class="hero-badge">${escapeHTML(first.material)}</span>` : ''}
                ${first.totalLength ? `<span class="hero-badge" style="background:rgba(255,255,255,0.25)">${formatSize(first.totalLength)}</span>` : ''}
              </div>
            </div>
          </div>
        </div>`;
    },

    renderCarousel(sec, products) {
      return `
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">${escapeHTML(sec.title)}</h2>
          </div>
          <div class="carousel-scroll">
            ${products.map(renderProductCard).join('')}
          </div>
        </div>`;
    },

    renderGrid(sec, products) {
      return `
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">${escapeHTML(sec.title)}</h2>
          </div>
          <div class="grid-2">
            ${products.map(renderProductCard).join('')}
          </div>
        </div>`;
    },

    renderList(sec, products) {
      return `
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">${escapeHTML(sec.title)}</h2>
          </div>
          <div class="list-vertical">
            ${products.map(p => `
              <div class="list-card" data-product-id="${escapeHTML(p.id)}">
                <div class="list-card-img">${lazyImg(p.image, p.model)}</div>
                <div class="list-card-info">
                  <div>
                    <div class="list-card-title">${escapeHTML(p.model)}</div>
                    <div class="list-card-meta">${escapeHTML(p.material)} • ${formatSize(p.totalLength)}</div>
                  </div>
                  <div class="list-card-meta">Y: ${escapeHTML(p.surfaceNumber || '—')} ${p.surfaceSize ? '• ' + escapeHTML(p.surfaceSize) : ''}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    },
  };
  /* ───── 8. STORIES ───── */
  const Stories = {
    render() {
      const container = $('#storiesContainer');
      if (!State.stories.length) {
        container.innerHTML = '';
        $('.stories-wrap')?.classList.add('hidden');
        return;
      }
      $('.stories-wrap')?.classList.remove('hidden');
      container.innerHTML = State.stories.map((s, i) => {
        const viewed = State.viewedStories.includes(s.id);
        return `
          <div class="story-item" data-story-idx="${i}">
            <div class="story-ring ${viewed ? 'viewed' : ''}">
              <div class="story-ring-inner">
                <img src="${escapeHTML(fixImageUrl(s.image))}" alt="${escapeHTML(s.title)}" loading="lazy"
                     onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
              </div>
            </div>
            <span class="story-title">${escapeHTML(s.title)}</span>
          </div>`;
      }).join('');
      container.querySelectorAll('.story-item').forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.dataset.storyIdx, 10);
          this.open(idx);
        });
      });
    },

    open(idx) {
      State.currentStoryIndex = idx;
      $('#storyViewer').classList.remove('hidden');
      HistoryManager.push(() => this._closeInternal(), 'story');
      this.show(idx);
    },

    show(idx) {
      if (idx < 0 || idx >= State.stories.length) { this.close(); return; }
      State.currentStoryIndex = idx;
      const story = State.stories[idx];
      if (!State.viewedStories.includes(story.id)) {
        State.viewedStories.push(story.id);
        Storage.set(CONFIG.STORAGE_KEYS.VIEWED_STORIES, State.viewedStories);
      }
      const progressWrap = $('#storyProgressWrap');
      progressWrap.innerHTML = State.stories.map((_, i) => `
        <div class="story-progress">
          <div class="story-progress-fill ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}"></div>
        </div>`).join('');

      const tapToOpen = story.productId ? `<button class="story-cta" data-story-open-product="${escapeHTML(story.productId)}">Mahsulotni ko'rish →</button>` : '';
      $('#storyContent').innerHTML = `
        <div class="story-title-bar">${escapeHTML(story.title)}</div>
        <img src="${escapeHTML(fixImageUrl(story.image))}" alt="${escapeHTML(story.title)}"
             onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
        ${tapToOpen}
      `;
      const ctaBtn = $('#storyContent .story-cta');
      if (ctaBtn) {
        ctaBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const pid = ctaBtn.dataset.storyOpenProduct;
          this.close();
          setTimeout(() => ProductDetail.open(pid), 200);
        });
      }
      clearTimeout(State.storyTimer);
      State.storyTimer = setTimeout(() => this.show(idx + 1), CONFIG.STORY_DURATION);
    },

    next() { this.show(State.currentStoryIndex + 1); },
    prev() { this.show(State.currentStoryIndex - 1); },

    _closeInternal() {
      clearTimeout(State.storyTimer);
      $('#storyViewer').classList.add('hidden');
      Stories.render();
    },
    close() {
      // Triggered via UI close button -> use history back so stack stays consistent
      if (HistoryManager.stack.length && HistoryManager.stack[HistoryManager.stack.length - 1].name === 'story') {
        history.back();
      } else {
        this._closeInternal();
      }
    },

    bind() {
      $('#storyClose').addEventListener('click', () => this.close());
      $('#storyPrev').addEventListener('click', () => this.prev());
      $('#storyNext').addEventListener('click', () => this.next());
    },
  };
  /* ───── 9. COLLECTIONS ───── */
  const Collections = {
    render() {
      const container = $('#collectionsContainer');
      if (!State.collections.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <h3>To'plamlar topilmadi</h3>
            <p>3-varaqqa ma'lumot qo'shing</p>
          </div>`;
        return;
      }
      container.innerHTML = State.collections.map(col => `
        <div class="collection-card" data-collection-id="${escapeHTML(col.id)}">
          <img src="${escapeHTML(fixImageUrl(col.image))}" alt="${escapeHTML(col.name)}" loading="lazy"
               onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
          <div class="collection-overlay">
            <div class="collection-title">${escapeHTML(col.name)}</div>
            ${col.description ? `<div class="collection-desc">${escapeHTML(col.description)}</div>` : ''}
            <span class="collection-count">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              ${col.ids.length} ta mahsulot
            </span>
          </div>
        </div>`).join('');

      container.querySelectorAll('.collection-card').forEach(card => {
        card.addEventListener('click', () => {
          const col = State.collections.find(c => c.id === card.dataset.collectionId);
          if (col) Collections.open(col);
        });
      });
    },

    open(col) {
      const products = col.ids.map(findProduct).filter(Boolean);
      HistoryManager.push(() => $('#collectionModal').classList.add('hidden'), 'collection');
      $('#collectionBody').innerHTML = `
        <div class="product-detail-image" style="aspect-ratio:16/9">
          <img src="${escapeHTML(fixImageUrl(col.image))}" alt="${escapeHTML(col.name)}"
               onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
        </div>
        <div class="product-detail-info">
          <h2 class="product-detail-title">${escapeHTML(col.name)}</h2>
          ${col.description ? `<p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:16px">${escapeHTML(col.description)}</p>` : ''}
          <div class="grid-2" style="padding:0">
            ${products.map(renderProductCard).join('')}
          </div>
        </div>`;
      $('#collectionModal').classList.remove('hidden');
      observeImages($('#collectionBody'));
    },
  };
  /* ───── 10. SEARCH + FILTERS ───── */
  const Search = {
    init() {
      const input = $('#searchInput');
      const clear = $('#searchClear');
      let timer;
      input.addEventListener('input', () => {
        clearTimeout(timer);
        const q = input.value.trim().toLowerCase();
        clear.classList.toggle('visible', q.length > 0);
        timer = setTimeout(() => this.perform(q), 150);
      });
      clear.addEventListener('click', () => {
        input.value = '';
        clear.classList.remove('visible');
        this.perform('');
        input.focus();
      });
      this.renderFilters();
    },

    renderFilters() {
      const wrap = $('#searchFilters');
      if (!wrap) return;
      // Build material list from products
      const materials = [...new Set(State.products.map(p => p.material).filter(Boolean))];
      const surfaces = [...new Set(State.products.map(p => p.surfaceNumber).filter(Boolean))];
      wrap.innerHTML = `
        <div class="filter-row">
          <button class="filter-chip ${!State.searchFilters.material ? 'active' : ''}" data-fmat="">Hammasi</button>
          ${materials.map(m => `<button class="filter-chip ${State.searchFilters.material === m ? 'active' : ''}" data-fmat="${escapeHTML(m)}">${escapeHTML(m)}</button>`).join('')}
        </div>
        ${surfaces.length ? `
        <div class="filter-row">
          <span class="filter-label">Yuza:</span>
          <button class="filter-chip small ${!State.searchFilters.surface ? 'active' : ''}" data-fsurf="">—</button>
          ${surfaces.map(s => `<button class="filter-chip small ${State.searchFilters.surface === s ? 'active' : ''}" data-fsurf="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join('')}
        </div>` : ''}
      `;
      wrap.querySelectorAll('[data-fmat]').forEach(b => {
        b.addEventListener('click', () => {
          State.searchFilters.material = b.dataset.fmat;
          this.renderFilters();
          this.perform($('#searchInput').value.trim().toLowerCase());
        });
      });
      wrap.querySelectorAll('[data-fsurf]').forEach(b => {
        b.addEventListener('click', () => {
          State.searchFilters.surface = b.dataset.fsurf;
          this.renderFilters();
          this.perform($('#searchInput').value.trim().toLowerCase());
        });
      });
    },

    perform(q) {
      const container = $('#searchResults');
      const f = State.searchFilters;
      const hasFilter = f.material || f.surface;
      if (!q && !hasFilter) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>Mahsulot qidiring</h3>
            <p>Model, material, yuza yoki ID</p>
          </div>`;
        return;
      }
      const results = State.products.filter(p => {
        // Text query
        const textOk = !q || (
          (p.model || '').toLowerCase().includes(q) ||
          (p.material || '').toLowerCase().includes(q) ||
          (p.surfaceNumber || '').toLowerCase().includes(q) ||
          (p.id || '').toLowerCase().includes(q) ||
          (p.surfaceSize || '').toLowerCase().includes(q)
        );
        // Material filter
        const matOk = !f.material || p.material === f.material;
        // Surface filter
        const surfOk = !f.surface || p.surfaceNumber === f.surface;
        return textOk && matOk && surfOk;
      });
      if (!results.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">😔</div>
            <h3>Topilmadi</h3>
            <p>So'rov yoki filterlarni o'zgartiring</p>
          </div>`;
        return;
      }
      container.innerHTML = `
        <p style="color:var(--text-secondary);font-size:13px;margin:8px 0 12px">${results.length} ta natija</p>
        <div class="grid-2" style="padding:0">
          ${results.map(renderProductCard).join('')}
        </div>`;
      observeImages(container);
    },
  };
  /* ───── 11. FAVORITES ───── */
  const Favorites = {
    toggle(id) {
      const idx = State.favorites.indexOf(id);
      if (idx >= 0) { State.favorites.splice(idx, 1); toast('Sevimlilardan o\'chirildi'); }
      else { State.favorites.push(id); toast('Sevimlilarga qo\'shildi ❤️'); }
      Storage.set(CONFIG.STORAGE_KEYS.FAVORITES, State.favorites);
      this.render();
      document.querySelectorAll(`[data-action="like"][data-id="${id}"]`).forEach(btn => {
        const isLiked = State.favorites.includes(id);
        btn.classList.toggle('liked', isLiked);
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', isLiked ? 'currentColor' : 'none');
      });
      Profile.updateStats();
    },
    render() {
      const container = $('#favoritesContainer');
      const products = State.favorites.map(findProduct).filter(Boolean);
      $('#favCount').textContent = `${products.length} ta mahsulot`;
      if (!products.length) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-icon">❤️</div>
            <h3>Sevimlilar bo'sh</h3>
            <p>Mahsulotlarga yurakcha bosing</p>
          </div>`;
        return;
      }
      container.innerHTML = products.map(renderProductCard).join('');
      observeImages(container);
    },
  };

  /* ───── 12. CART ───── */
  const Cart = {
    add(id) {
      const existing = State.cart.find(i => i.id === id);
      if (existing) existing.qty++;
      else State.cart.push({ id, qty: 1 });
      Storage.set(CONFIG.STORAGE_KEYS.CART, State.cart);
      this.updateBadge(true);
      toast('Savatchaga qo\'shildi 🛒');
      Profile.updateStats();
      refreshCartControls(id);
      this.refreshDetailCart(id);
    },
    remove(id) {
      State.cart = State.cart.filter(i => i.id !== id);
      Storage.set(CONFIG.STORAGE_KEYS.CART, State.cart);
      this.updateBadge();
      this.renderModal();
      Profile.updateStats();
      refreshCartControls(id);
      this.refreshDetailCart(id);
    },
    updateQty(id, delta) {
      const item = State.cart.find(i => i.id === id);
      if (!item) {
        if (delta > 0) return this.add(id);
        return;
      }
      item.qty += delta;
      if (item.qty <= 0) { this.remove(id); return; }
      Storage.set(CONFIG.STORAGE_KEYS.CART, State.cart);
      this.updateBadge();
      this.renderModal();
      Profile.updateStats();
      refreshCartControls(id);
      this.refreshDetailCart(id);
    },
    refreshDetailCart(id) {
      // refresh inside product detail if open
      const wrap = document.querySelector(`#productModalBody [data-detail-cart="${CSS.escape(id)}"]`);
      if (wrap) wrap.innerHTML = ProductDetail.renderDetailCartControl(id);
    },
    count() { return State.cart.reduce((sum, i) => sum + i.qty, 0); },
    updateBadge(animate = false) {
      const badge = $('#cartBadge');
      const c = this.count();
      badge.textContent = c;
      badge.style.display = c > 0 ? 'flex' : 'none';
      if (animate) {
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
      }
    },
    open() {
      this.renderModal();
      $('#cartModal').classList.remove('hidden');
      HistoryManager.push(() => $('#cartModal').classList.add('hidden'), 'cart');
    },
    renderModal() {
      const body = $('#cartBody');
      const footer = $('#cartFooter');
      if (!State.cart.length) {
        body.innerHTML = `
          <div class="cart-empty">
            <div class="empty-icon">🛒</div>
            <h3>Savatcha bo'sh</h3>
            <p style="color:var(--text-secondary)">Mahsulot qo'shing</p>
          </div>`;
        footer.style.display = 'none';
        return;
      }
      footer.style.display = 'block';
      body.innerHTML = State.cart.map(item => {
        const p = findProduct(item.id);
        if (!p) return '';
        return `
          <div class="cart-item">
            <div class="cart-item-img">
              <img src="${escapeHTML(fixImageUrl(p.image))}" alt="${escapeHTML(p.model)}"
                   onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
            </div>
            <div class="cart-item-info">
              <div class="cart-item-title">${escapeHTML(p.model)}</div>
              <div class="cart-item-meta">${escapeHTML(p.material)} • ${formatSize(p.totalLength)}</div>
              <div class="cart-qty-control">
                <button class="qty-btn" data-action="qty-down" data-id="${escapeHTML(p.id)}">−</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn" data-action="qty-up" data-id="${escapeHTML(p.id)}">+</button>
              </div>
            </div>
            <button class="cart-remove" data-action="cart-remove" data-id="${escapeHTML(p.id)}" aria-label="O'chirish">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>`;
      }).join('');
    },
    checkout() {
      if (!State.cart.length) { toast('Savatcha bo\'sh'); return; }
      const user = State.user;
      if (!user) { toast('Iltimos ma\'lumotlaringizni kiriting'); return; }
      let text = `🛒 *Yangi buyurtma*\n\n`;
      text += `👤 *Mijoz:*\n${user.name} ${user.surname}\n📞 ${user.phone}\n\n`;
      text += `📦 *Buyurtmalar:*\n`;
      State.cart.forEach((item, i) => {
        const p = findProduct(item.id);
        if (!p) return;
        text += `\n${i + 1}. ${p.model}\n`;
        text += `   • Material: ${p.material}\n`;
        if (p.totalLength) text += `   • Uzunlik: ${formatSize(p.totalLength)}\n`;
        if (p.surfaceNumber) text += `   • Yuza: ${p.surfaceNumber}\n`;
        text += `   • Soni: ${item.qty} dona\n`;
      });
      text += `\n📅 ${new Date().toLocaleString('uz-UZ')}`;
      const url = `https://t.me/${CONFIG.TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    },
  };
  /* ───── 13. PRODUCT DETAIL ───── */
  const ProductDetail = {
    renderDetailCartControl(id) {
      const qty = cartQty(id);
      if (qty > 0) {
        return `
          <div class="detail-qty-control">
            <button class="detail-qty-btn" data-action="qty-down" data-id="${escapeHTML(id)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/></svg>
            </button>
            <span class="detail-qty-value">${qty} dona</span>
            <button class="detail-qty-btn" data-action="qty-up" data-id="${escapeHTML(id)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5v14"/></svg>
            </button>
          </div>`;
      }
      return `
        <button class="btn-add-to-cart-full" data-action="add-cart" data-id="${escapeHTML(id)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          Savatchaga qo'shish
        </button>`;
    },

    open(id) {
      const p = findProduct(id);
      if (!p) return;
      const liked = State.favorites.includes(p.id);
      const images = (p.images && p.images.length) ? p.images : [p.image].filter(Boolean);
      const hasMulti = images.length > 1;

      $('#productModalBody').innerHTML = `
        <div class="product-detail-gallery">
          <div class="gallery-main" id="galleryMain">
            ${images.map((img, i) => `
              <div class="gallery-slide ${i === 0 ? 'active' : ''}" data-slide-idx="${i}">
                <img src="${escapeHTML(fixImageUrl(img))}" alt="${escapeHTML(p.model)}"
                     onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
              </div>`).join('')}
          </div>
          ${hasMulti || p.video ? `
            <div class="gallery-thumbs-row">
              <div class="gallery-thumbs">
                ${images.map((img, i) => `
                  <button class="gallery-thumb ${i===0?'active':''}" data-thumb="${i}">
                    <img src="${escapeHTML(fixImageUrl(img))}" alt="" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                  </button>`).join('')}
                ${p.video ? `
                  <button class="gallery-thumb gallery-thumb-video" id="playVideoBtn" aria-label="Videoni ko'rish">
                    <img src="${escapeHTML(fixImageUrl(images[0]||''))}" alt="" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" />
                    <div class="thumb-video-play">
                      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </button>` : ''}
              </div>
              ${hasMulti ? `
                <div class="gallery-dots">
                  ${images.map((_, i) => `<button class="gallery-dot ${i===0?'active':''}" data-dot="${i}"></button>`).join('')}
                </div>` : ''}
            </div>` : ''}
        </div>
        <div class="product-detail-info">
          <h2 class="product-detail-title">${escapeHTML(p.model)}</h2>
          ${p.material ? `<div class="product-detail-material">${escapeHTML(p.material)}</div>` : ''}
          <div class="product-spec-list">
            ${p.totalLength ? `<div class="product-spec-row"><span class="product-spec-label">Umumiy uzunligi</span><span class="product-spec-value">${formatSize(p.totalLength)}</span></div>` : ''}
            ${p.tubeLength ? `<div class="product-spec-row"><span class="product-spec-label">Truba uzunligi</span><span class="product-spec-value">${formatSize(p.tubeLength)}</span></div>` : ''}
            ${p.woodLength ? `<div class="product-spec-row"><span class="product-spec-label">Yog'och uzunligi</span><span class="product-spec-value">${formatSize(p.woodLength)}</span></div>` : ''}
            ${p.surfaceNumber ? `<div class="product-spec-row"><span class="product-spec-label">Yuza raqami</span><span class="product-spec-value">${escapeHTML(p.surfaceNumber)}</span></div>` : ''}
            ${p.surfaceSize ? `<div class="product-spec-row"><span class="product-spec-label">Yuza o'lchami</span><span class="product-spec-value">${escapeHTML(p.surfaceSize)}</span></div>` : ''}
            <div class="product-spec-row"><span class="product-spec-label">ID</span><span class="product-spec-value">#${escapeHTML(p.id)}</span></div>
          </div>
        </div>
        <div class="product-detail-actions">
          <button class="btn-secondary ${liked ? 'liked' : ''}" data-action="like" data-id="${escapeHTML(p.id)}" aria-label="Sevimli">
            <svg viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </button>
          <button class="btn-secondary" data-action="share" data-id="${escapeHTML(p.id)}" aria-label="Ulashish">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <div class="detail-cart-wrap" data-detail-cart="${escapeHTML(p.id)}" style="flex:1">
            ${this.renderDetailCartControl(p.id)}
          </div>
        </div>`;

      // Gallery slide switching
      let currentSlide = 0;
      const slides = $('#productModalBody').querySelectorAll('.gallery-slide');
      const dots = $('#productModalBody').querySelectorAll('.gallery-dot');
      const thumbs = $('#productModalBody').querySelectorAll('.gallery-thumb');
      const goSlide = (idx) => {
        if (idx < 0) idx = slides.length - 1;
        if (idx >= slides.length) idx = 0;
        currentSlide = idx;
        slides.forEach((s, i) => s.classList.toggle('active', i === idx));
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
      };
      dots.forEach(d => d.addEventListener('click', () => goSlide(parseInt(d.dataset.dot, 10))));
      thumbs.forEach(t => t.addEventListener('click', () => goSlide(parseInt(t.dataset.thumb, 10))));

      // Touch swipe
      const galleryMain = $('#galleryMain');
      if (galleryMain && slides.length > 1) {
        let startX = 0;
        galleryMain.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
        galleryMain.addEventListener('touchend', (e) => {
          const diff = (e.changedTouches[0]?.clientX || 0) - startX;
          if (Math.abs(diff) > 50) goSlide(currentSlide + (diff < 0 ? 1 : -1));
        }, { passive: true });
      }

      // Click main image to open fullscreen
      slides.forEach(slide => {
        slide.addEventListener('click', (e) => {
          if (e.target.closest('#playVideoBtn')) return;
          const img = slide.querySelector('img');
          if (img) {
            $('#viewerImg').src = img.src;
            $('#imageViewer').classList.remove('hidden');
          }
        });
      });

      // Video play
      const playBtn = $('#playVideoBtn');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          VideoPlayer.open(p.video);
        });
      }

      $('#productModal').classList.remove('hidden');
      HistoryManager.push(() => $('#productModal').classList.add('hidden'), 'product');
    },
  };

  /* ───── 13b. SIMPLE VIDEO PLAYER ───── */
  const VideoPlayer = {
    open(url) {
      if (!url) return;
      const v = $('#videoElement');
      v.src = url;
      v.removeAttribute('controls'); // we provide our own simple controls
      $('#videoPlayer').classList.remove('hidden');
      $('#videoPlayer').classList.add('simple');
      v.play().catch(() => {});
      this.updatePlayBtn();
      HistoryManager.push(() => this._closeInternal(), 'video');
    },
    _closeInternal() {
      const v = $('#videoElement');
      v.pause();
      v.src = '';
      $('#videoPlayer').classList.add('hidden');
    },
    close() {
      if (HistoryManager.stack.length && HistoryManager.stack[HistoryManager.stack.length - 1].name === 'video') {
        history.back();
      } else {
        this._closeInternal();
      }
    },
    toggle() {
      const v = $('#videoElement');
      if (v.paused) v.play().catch(() => {});
      else v.pause();
      this.updatePlayBtn();
    },
    updatePlayBtn() {
      const btn = $('#videoPlayPauseBtn');
      if (!btn) return;
      const v = $('#videoElement');
      btn.innerHTML = v.paused
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
    },
    bind() {
      const v = $('#videoElement');
      v.addEventListener('play', () => this.updatePlayBtn());
      v.addEventListener('pause', () => this.updatePlayBtn());
      v.addEventListener('ended', () => this.updatePlayBtn());
      $('#videoPlayPauseBtn')?.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
      // Click on video itself toggles play/pause
      v.addEventListener('click', () => this.toggle());
    },
  };

  /* ───── 14. NEWS ───── */
  const News = {
    open() {
      const body = $('#newsBody');
      if (!State.news.length) {
        body.innerHTML = `<div class="empty-state"><div class="empty-icon">📰</div><h3>Yangiliklar yo'q</h3></div>`;
      } else {
        body.innerHTML = State.news.map(n => `
          <div class="news-card">
            ${n.image ? `<div class="news-card-img"><img src="${escapeHTML(fixImageUrl(n.image))}" alt="${escapeHTML(n.title)}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_IMG}'" /></div>` : ''}
            <div class="news-card-body">
              <div class="news-card-title">${escapeHTML(n.title)}</div>
              <div class="news-card-text">${escapeHTML(n.text)}</div>
            </div>
          </div>`).join('');
      }
      $('#newsModal').classList.remove('hidden');
      HistoryManager.push(() => $('#newsModal').classList.add('hidden'), 'news');
    },
  };

  /* ───── 15. PROFILE ───── */
  const Profile = {
    render() {
      if (!State.user) return;
      $('#profileName').textContent = `${State.user.name} ${State.user.surname}`;
      $('#profilePhone').textContent = State.user.phone;
      $('#profileInitials').textContent = (State.user.name[0] || '') + (State.user.surname[0] || '');
      this.updateStats();
    },
    updateStats() {
      $('#statFavorites').textContent = State.favorites.length;
      $('#statCart').textContent = Cart.count();
    },
    bind() {
      $('#editProfileBtn').addEventListener('click', () => {
        $('#userName').value = State.user?.name || '';
        $('#userSurname').value = State.user?.surname || '';
        const ph = State.user?.phone || '';
        $('#userPhone').value = ph || '+998 ';
        $('#registerModal').classList.remove('hidden');
      });
      // Telefon inputiga +998 prefiksini doimiy qo'yib turish
      const phoneInput = $('#userPhone');
      if (phoneInput) {
        const ensurePrefix = () => {
          if (!phoneInput.value || !phoneInput.value.startsWith('+998')) {
            phoneInput.value = '+998 ' + (phoneInput.value || '').replace(/^\+?998\s*/, '');
          }
        };
        phoneInput.addEventListener('focus', ensurePrefix);
        phoneInput.addEventListener('input', () => {
          // Foydalanuvchi +998 ni o'chirib yubormasin
          if (!phoneInput.value.startsWith('+998')) {
            const digits = phoneInput.value.replace(/\D/g, '').replace(/^998/, '');
            phoneInput.value = '+998 ' + digits;
          }
        });
        phoneInput.addEventListener('keydown', (e) => {
          // Cursor +998 dan oldinga o'tib o'chirishga urinishga to'sqinlik
          if ((e.key === 'Backspace' || e.key === 'Delete') && phoneInput.selectionStart <= 5) {
            e.preventDefault();
          }
        });
        // Sahifa yuklanganda standart qiymat
        if (!phoneInput.value) phoneInput.value = '+998 ';
      }
      $('#shareAppBtn').addEventListener('click', async () => {
        const data = { title: 'Kapgir Premium', text: 'Premium oshxona anjomlari', url: window.location.href };
        if (navigator.share) { try { await navigator.share(data); } catch (e) {} }
        else { await navigator.clipboard?.writeText(window.location.href); toast('Havola nusxalandi'); }
      });
      $('#clearCacheBtn').addEventListener('click', () => {
        if (confirm('Hamma ma\'lumotlar o\'chiriladi. Davom etilsinmi?')) { Storage.clearAll(); location.reload(); }
      });
    },
  };

  /* ───── 16. NAVIGATION ───── */
  const Navigation = {
    bind() {
      $$('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          addRipple(e, btn);
          this.goTo(btn.dataset.page);
        });
      });
    },
    goTo(page, silent = false) {
      const prev = State.currentPage;
      State.currentPage = page;
      $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
      $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (page === 'favorites') Favorites.render();
      if (page === 'profile') Profile.updateStats();
      if (page === 'search') { Search.renderFilters(); setTimeout(() => $('#searchInput').focus(), 200); }
      // Tarix: home dan boshqa sahifaga o'tilganda back uchun yozib qo'yamiz
      if (!silent && prev !== page && page !== 'home') {
        HistoryManager.push(() => {
          // Back bosilganda home ga qaytadi
          Navigation.goTo('home', true);
        }, 'page:' + page);
      }
    },
  };

  /* ───── 17. GLOBAL ACTIONS ───── */
  const bindGlobalActions = () => {
    document.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;
        switch (action) {
          case 'like': Favorites.toggle(id); break;
          case 'add-cart': Cart.add(id); break;
          case 'share':
            const p = findProduct(id);
            if (p && navigator.share) {
              navigator.share({ title: p.model, text: `${p.model} - ${p.material}`, url: window.location.href }).catch(() => {});
            } else {
              navigator.clipboard?.writeText(window.location.href);
              toast('Havola nusxalandi');
            }
            break;
          case 'qty-up': Cart.updateQty(id, +1); break;
          case 'qty-down': Cart.updateQty(id, -1); break;
          case 'cart-remove': Cart.remove(id); break;
        }
        return;
      }
      const productEl = e.target.closest('[data-product-id]');
      if (productEl) {
        ProductDetail.open(productEl.dataset.productId);
        return;
      }
      const closeBtn = e.target.matches('[data-close]') ? e.target : e.target.closest('[data-close]');
      if (closeBtn) {
        // Use history.back so HistoryManager handles closing the right layer
        if (HistoryManager.stack.length) {
          history.back();
        } else {
          const sheet = closeBtn.closest('.bottom-sheet');
          if (sheet) sheet.classList.add('hidden');
          else document.querySelectorAll('.bottom-sheet').forEach(s => s.classList.add('hidden'));
        }
      }
    });

    $('#searchBtn').addEventListener('click', () => Navigation.goTo('search'));
    $('#cartBtn').addEventListener('click', () => Cart.open());
    $('#notifBtn').addEventListener('click', () => News.open());
    $('#checkoutBtn').addEventListener('click', () => Cart.checkout());

    $('#viewerClose').addEventListener('click', () => {
      if (HistoryManager.stack.length && HistoryManager.stack[HistoryManager.stack.length - 1].name === 'imageViewer') {
        history.back();
      } else {
        $('#imageViewer').classList.add('hidden');
      }
    });
    $('#videoClose').addEventListener('click', () => VideoPlayer.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close in order from topmost layer
        if (!$('#videoPlayer').classList.contains('hidden')) { VideoPlayer.close(); return; }
        if (!$('#imageViewer').classList.contains('hidden')) { $('#imageViewer').classList.add('hidden'); return; }
        if (!$('#storyViewer').classList.contains('hidden')) { Stories.close(); return; }
        // Close topmost visible bottom-sheet only
        const visibleSheets = Array.from(document.querySelectorAll('.bottom-sheet:not(.hidden)'));
        if (visibleSheets.length) {
          // Pick the one with highest z-index (topmost)
          visibleSheets.sort((a, b) => {
            return (parseInt(getComputedStyle(b).zIndex) || 0) - (parseInt(getComputedStyle(a).zIndex) || 0);
          });
          visibleSheets[0].classList.add('hidden');
        }
      }
    });
  };

  /* ───── 18. REGISTRATION ───── */
  const Registration = {
    show() { $('#registerModal').classList.remove('hidden'); },
    hide() { $('#registerModal').classList.add('hidden'); },
    bind() {
      // Telefon inputiga +998 prefiksini doimiy qo'yib turish
      const phoneInput = $('#userPhone');
      if (phoneInput) {
        if (!phoneInput.value) phoneInput.value = '+998 ';
        phoneInput.addEventListener('focus', () => {
          if (!phoneInput.value.startsWith('+998')) phoneInput.value = '+998 ';
          // Kursor +998 dan keyin tursin
          setTimeout(() => {
            const v = phoneInput.value;
            phoneInput.setSelectionRange(v.length, v.length);
          }, 0);
        });
        phoneInput.addEventListener('input', () => {
          if (!phoneInput.value.startsWith('+998')) {
            const digits = phoneInput.value.replace(/\D/g, '').replace(/^998/, '');
            phoneInput.value = '+998 ' + digits;
          }
        });
        phoneInput.addEventListener('keydown', (e) => {
          if ((e.key === 'Backspace' || e.key === 'Delete') && phoneInput.selectionStart <= 5) {
            e.preventDefault();
          }
        });
      }
      $('#registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#userName').value.trim();
        const surname = $('#userSurname').value.trim();
        let phone = $('#userPhone').value.trim();
        if (!phone || phone === '+998' || phone === '+998 ') phone = '';
        if (!name || !surname || !phone) return;
        State.user = { name, surname, phone };
        Storage.set(CONFIG.STORAGE_KEYS.USER, State.user);
        this.hide();
        Profile.render();
        toast('Xush kelibsiz!');
      });
    },
  };

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

  /* ───── 21. APP ───── */
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

      const minSplash = new Promise(r => setTimeout(r, 1200));
      try { await Sheets.loadAll(); }
      catch (e) { console.error('Load failed', e); toast('Ma\'lumotlar yuklanmadi'); }
      await minSplash;

      $('#splash').classList.add('fade-out');
      setTimeout(() => $('#splash').remove(), 600);
      $('#app').classList.remove('hidden');

      if (!State.user) Registration.show();
      else Profile.render();

      this.renderAll();
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
      Object.keys(localStorage).filter(k => k.startsWith(CONFIG.STORAGE_KEYS.CACHE)).forEach(k => localStorage.removeItem(k));
      await Sheets.loadAll();
      this.renderAll();
      toast('Yangilandi');
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  window.KapgirApp = { App, State, CONFIG, Sheets, Storage };
})();
