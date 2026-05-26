'use strict';

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

    const tapToOpen = story.productId
      ? `<button class="story-cta" data-story-open-product="${escapeHTML(story.productId)}">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
           Mahsulotni ko'rish
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
         </button>`
      : '';
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
    $('#collectionBody').innerHTML = `
      <div class="product-detail-image collection-cover">
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
    openSheet('#collectionModal', 'collection');
    observeImages($('#collectionBody'));
    startCardSlideshows($('#collectionBody'));
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