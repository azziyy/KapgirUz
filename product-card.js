'use strict';

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

// Multi-image slideshow for product card (3 images auto-rotate)
const renderCardImages = (product) => {
  const imgs = (product.images && product.images.length) ? product.images : [product.image].filter(Boolean);
  if (imgs.length <= 1) {
    return lazyImg(imgs[0] || '', product.model);
  }
  return imgs.map((img, i) => `
    <img class="product-img card-slide-img ${i === 0 ? 'active' : ''}"
         data-src="${escapeHTML(fixImageUrl(img))}"
         alt="${escapeHTML(product.model)}" loading="lazy" />
  `).join('') + `<div class="product-img-skeleton"></div>
  <div class="card-slide-dots">
    ${imgs.map((_, i) => `<span class="card-slide-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
  </div>`;
};

const renderProductCard = (product) => {
  const liked = State.favorites.includes(product.id);
  const hasMulti = (product.images && product.images.length > 1);
  return `
    <div class="product-card" data-product-id="${escapeHTML(product.id)}">
      <div class="product-img-wrap ${hasMulti ? 'has-slideshow' : ''}">
        ${renderCardImages(product)}
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
        <div class="product-model">Model ${escapeHTML(product.model || product.id)}</div>
        <div class="product-specs-mini">
          ${product.totalLength ? `<div class="spec-mini"><span class="spec-mini-label">Umumiy</span><span class="spec-mini-value">${formatSize(product.totalLength)}</span></div>` : ''}
          ${product.tubeLength ? `<div class="spec-mini"><span class="spec-mini-label">Truba</span><span class="spec-mini-value">${formatSize(product.tubeLength)}</span></div>` : ''}
          ${product.woodLength ? `<div class="spec-mini"><span class="spec-mini-label">Yog'och</span><span class="spec-mini-value">${formatSize(product.woodLength)}</span></div>` : ''}
          ${product.surfaceNumber ? `<div class="spec-mini"><span class="spec-mini-label">Yuza</span><span class="spec-mini-value">№ ${escapeHTML(product.surfaceNumber)}${product.surfaceSize ? ' • ' + escapeHTML(product.surfaceSize) : ''}</span></div>` : ''}
        </div>
        <div class="product-bottom">
          ${product.material ? `<span class="product-material-mini">${escapeHTML(product.material)}</span>` : '<span></span>'}
          <div class="product-cart-wrap" data-cart-wrap="${escapeHTML(product.id)}">
            ${renderCartControl(product.id)}
          </div>
        </div>
      </div>
    </div>`;
};

// Start auto-rotation for all card slideshows inside container
const startCardSlideshows = (root = document) => {
  root.querySelectorAll('.product-img-wrap.has-slideshow').forEach(wrap => {
    if (wrap.dataset.slideshowStarted === '1') return;
    const imgs = Array.from(wrap.querySelectorAll('.card-slide-img'));
    const dots = Array.from(wrap.querySelectorAll('.card-slide-dot'));
    if (imgs.length <= 1) return;
    let idx = 0;
    // Pre-load all images so transitions are smooth
    imgs.forEach(img => {
      const src = img.dataset.src;
      if (src && !img.src) {
        const tmp = new Image();
        tmp.onload = () => { img.src = src; img.classList.add('loaded'); };
        tmp.onerror = () => { img.src = CONFIG.PLACEHOLDER_IMG; img.classList.add('loaded'); };
        tmp.src = src;
      }
    });
    // Hide initial skeleton when first image loaded
    const skel = wrap.querySelector('.product-img-skeleton');
    if (skel) setTimeout(() => { skel.style.display = 'none'; }, 600);
    wrap.dataset.slideshowStarted = '1';
    addInterval(() => {
      const prev = idx;
      idx = (idx + 1) % imgs.length;
      imgs[prev].classList.remove('active');
      imgs[idx].classList.add('active');
      if (dots[prev]) dots[prev].classList.remove('active');
      if (dots[idx]) dots[idx].classList.add('active');
    }, CONFIG.CARD_ROTATE_MS);
  });
};

// Update all cart controls for a given product across DOM
const refreshCartControls = (id) => {
  document.querySelectorAll(`[data-cart-wrap="${CSS.escape(id)}"]`).forEach(wrap => {
    wrap.innerHTML = renderCartControl(id);
  });
};

/* ───── 7. SECTIONS ───── */
// Store sections data by section index for the "See all" modal
const SectionStore = {};

const sectionHeader = (sec, totalCount, shownCount, secKey) => {
  const hasMore = totalCount > shownCount;
  return `
    <div class="section-header">
      <h2 class="section-title">${escapeHTML(sec.title)}</h2>
      ${hasMore ? `<button class="section-see-all" data-see-all="${escapeHTML(secKey)}">
        Barchasi (${totalCount})
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
      </button>` : ''}
    </div>`;
};

const Sections = {
  render() {
    // Clear existing intervals so we don't accumulate
    clearIntervals();
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
    const html = State.sections.map((sec, secIdx) => {
      const products = sec.ids.map(findProduct).filter(Boolean);
      if (!products.length && sec.type !== 'hero') return '';
      const secKey = 'sec_' + secIdx;
      SectionStore[secKey] = { sec, products };
      const limit = CONFIG.SECTION_LIMITS[sec.type] || 10;
      const shown = products.slice(0, limit);
      switch (sec.type) {
        case 'hero':     return this.renderHero(sec, products, secKey);
        case 'carousel': return this.renderCarousel(sec, shown, products.length, secKey);
        case 'grid':     return this.renderGrid(sec, shown, products.length, secKey);
        case 'list':     return this.renderList(sec, shown, products.length, secKey);
        default:         return this.renderGrid(sec, shown, products.length, secKey);
      }
    }).join('');
    container.innerHTML = html;
    observeImages(container);
    startCardSlideshows(container);
    startHeroRotations(container);
  },

  renderHero(sec, products, secKey) {
    if (!products.length) return '';
    return `
      <div class="section section-hero">
        <div class="hero-carousel" data-hero="${escapeHTML(secKey)}">
          <div class="hero-track">
            ${products.map((p, i) => `
              <div class="hero-slide ${i === 0 ? 'active' : ''}" data-hero-idx="${i}" data-product-id="${escapeHTML(p.id)}">
                <img src="${escapeHTML(fixImageUrl(p.image))}" alt="${escapeHTML(p.model)}" loading="lazy" />
                <div class="hero-overlay">
                  <div class="hero-title">${escapeHTML(sec.title || ('Model ' + p.model))}</div>
                  <div class="hero-sub">Model ${escapeHTML(p.model)}</div>
                  <div class="hero-meta">
                    ${p.material ? `<span class="hero-badge">${escapeHTML(p.material)}</span>` : ''}
                    ${p.totalLength ? `<span class="hero-badge soft">${formatSize(p.totalLength)}</span>` : ''}
                  </div>
                </div>
              </div>`).join('')}
          </div>
          ${products.length > 1 ? `
            <div class="hero-dots">
              ${products.map((_, i) => `<button class="hero-dot ${i===0?'active':''}" data-hero-dot="${i}" aria-label="Slayd ${i+1}"></button>`).join('')}
            </div>` : ''}
        </div>
      </div>`;
  },

  renderCarousel(sec, products, total, secKey) {
    return `
      <div class="section">
        ${sectionHeader(sec, total, products.length, secKey)}
        <div class="carousel-scroll">
          ${products.map(renderProductCard).join('')}
        </div>
      </div>`;
  },

  renderGrid(sec, products, total, secKey) {
    return `
      <div class="section">
        ${sectionHeader(sec, total, products.length, secKey)}
        <div class="grid-2">
          ${products.map(renderProductCard).join('')}
        </div>
      </div>`;
  },

  renderList(sec, products, total, secKey) {
    return `
      <div class="section">
        ${sectionHeader(sec, total, products.length, secKey)}
        <div class="list-vertical">
          ${products.map(p => `
            <div class="list-card" data-product-id="${escapeHTML(p.id)}">
              <div class="list-card-img">${lazyImg(p.image, p.model)}</div>
              <div class="list-card-info">
                <div class="list-card-title">Model ${escapeHTML(p.model)}</div>
                <div class="list-card-meta">${p.material ? escapeHTML(p.material) + ' • ' : ''}${formatSize(p.totalLength)}</div>
                <div class="list-card-specs">
                  ${p.tubeLength ? `<span>Truba: ${formatSize(p.tubeLength)}</span>` : ''}
                  ${p.woodLength ? `<span>Yog'och: ${formatSize(p.woodLength)}</span>` : ''}
                  ${p.surfaceNumber ? `<span>Yuza: №${escapeHTML(p.surfaceNumber)}</span>` : ''}
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  openAll(secKey) {
    const entry = SectionStore[secKey];
    if (!entry) return;
    const { sec, products } = entry;
    $('#sectionAllTitle').textContent = sec.title || 'Barchasi';
    $('#sectionAllBody').innerHTML = `
      <div class="grid-2" style="padding:16px">
        ${products.map(renderProductCard).join('')}
      </div>`;
    openSheet('#sectionAllModal', 'sectionAll');
    observeImages($('#sectionAllBody'));
    startCardSlideshows($('#sectionAllBody'));
  },
};

// Hero auto-rotation (16:9)
const startHeroRotations = (root = document) => {
  root.querySelectorAll('.hero-carousel').forEach(carousel => {
    const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
    const dots = Array.from(carousel.querySelectorAll('.hero-dot'));
    if (slides.length <= 1) return;
    let idx = 0;
    const goTo = (i) => {
      slides[idx].classList.remove('active');
      if (dots[idx]) dots[idx].classList.remove('active');
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add('active');
      if (dots[idx]) dots[idx].classList.add('active');
    };
    dots.forEach((d, i) => d.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(i);
    }));
    // Touch swipe
    let startX = 0;
    carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      const diff = (e.changedTouches[0]?.clientX || 0) - startX;
      if (Math.abs(diff) > 50) goTo(idx + (diff < 0 ? 1 : -1));
    }, { passive: true });
    addInterval(() => goTo(idx + 1), CONFIG.HERO_ROTATE_MS);
  });
};

/* ───── Sheet open helper (fix animation glitches) ───── */
const openSheet = (selector, name) => {
  const m = (typeof selector === 'string') ? $(selector) : selector;
  if (!m) return;
  // Make sure animations restart properly: temporarily remove animation,
  // force reflow, then re-enable. Avoids the “instant-then-replay” glitch.
  const content = m.querySelector('.sheet-content');
  m.classList.remove('hidden');
  if (content) {
    content.style.animation = 'none';
    // eslint-disable-next-line no-unused-expressions
    content.offsetHeight;
    content.style.animation = '';
  }
  m.style.animation = 'none';
  // eslint-disable-next-line no-unused-expressions
  m.offsetHeight;
  m.style.animation = '';
  HistoryManager.push(() => m.classList.add('hidden'), name || 'sheet');
};