'use strict';

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
    if (!badge) return;
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
    openSheet('#cartModal', 'cart');
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
                 onerror="imgFallback(this)" />
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
    if (!State.cart.length) { toast(LanguageManager.t('cartEmpty')); return; }
    const user = State.user;
    if (!user) {
      // Ro'yxatdan o'tilmagan — registratsiya modalini ko'rsatamiz
      // Ro'yxatdan o'tgandan keyin avtomatik buyurtma yuboriladi
      State._pendingCheckout = true;
      Registration.show();
      return;
    }
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
      text += `   • Soni: ${item.qty} ${LanguageManager.t('dona')}\n`;
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
          <span class="detail-qty-value">${qty} ${LanguageManager.t('dona')}</span>
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
                   onerror="imgFallback(this)" />
            </div>`).join('')}
        </div>
        ${hasMulti || p.video ? `
          <div class="gallery-thumbs-row">
            <div class="gallery-thumbs">
              ${images.map((img, i) => `
                <button class="gallery-thumb ${i===0?'active':''}" data-thumb="${i}">
                  <img src="${escapeHTML(fixImageUrl(img))}" alt="" onerror="imgFallback(this)" />
                </button>`).join('')}
              ${p.video ? `
                <button class="gallery-thumb gallery-thumb-video" id="playVideoBtn" aria-label="Videoni ko'rish">
                  <img src="${escapeHTML(fixImageUrl(images[0]||''))}" alt="" onerror="imgFallback(this)" />
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
        <h2 class="product-detail-title"><span class="detail-model-label">${LanguageManager.t('modelLabel')} </span>${escapeHTML(p.model)}</h2>
        ${p.material ? `<div class="product-detail-material">${escapeHTML(p.material)}</div>` : ''}
        <div class="product-spec-list">
          ${p.totalLength ? `<div class="product-spec-row"><span class="product-spec-label">${LanguageManager.t('specTotalLen')}</span><span class="product-spec-value">${formatSize(p.totalLength)}</span></div>` : ''}
          ${p.surfaceSize ? `<div class="product-spec-row"><span class="product-spec-label">${LanguageManager.t('specSurfaceSize')}</span><span class="product-spec-value">${escapeHTML(p.surfaceSize)}</span></div>` : ''}
          ${p.woodLength ? `<div class="product-spec-row"><span class="product-spec-label">${LanguageManager.t('specWoodLen')}</span><span class="product-spec-value">${formatSize(p.woodLength)}</span></div>` : ''}
          ${p.surfaceNumber ? `<div class="product-spec-row"><span class="product-spec-label">${LanguageManager.t('specSurfaceNum')}</span><span class="product-spec-value">${escapeHTML(p.surfaceNumber)}</span></div>` : ''}
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
          const viewer = $('#imageViewer');
          $('#viewerImg').src = img.src;
          $('#viewerImg').alt = img.alt || '';
          viewer.classList.remove('hidden');
          // Back tugmasi bilan yopish uchun history stackga qo'shamiz
          HistoryManager.push(() => viewer.classList.add('hidden'), 'imageViewer');
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

    openSheet('#productModal', 'product');
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
          ${n.image ? `<div class="news-card-img"><img src="${escapeHTML(fixImageUrl(n.image))}" alt="${escapeHTML(n.title)}" loading="lazy" onerror="imgFallback(this)" /></div>` : ''}
          <div class="news-card-body">
            <div class="news-card-title">${escapeHTML(n.title)}</div>
            <div class="news-card-text">${escapeHTML(n.text)}</div>
          </div>
        </div>`).join('');
    }
    openSheet('#newsModal', 'news');
  },
};