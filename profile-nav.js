'use strict';

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
      const _prefix = (typeof LanguageManager !== 'undefined') ? LanguageManager.getPhonePrefix() : '+998 ';
      $('#userPhone').value = ph || _prefix;
      $('#registerModal').classList.remove('hidden');
    });
    // Telefon inputiga +998 prefiksini doimiy qo'yib turish
    const phoneInput = $('#userPhone');
    if (phoneInput) {
      const getPrefix = () => (typeof LanguageManager !== 'undefined') ? LanguageManager.getPhonePrefix() : '+998 ';
      const ensurePrefix = () => {
        const pfx = getPrefix();
        if (!phoneInput.value || !phoneInput.value.startsWith(pfx.trim())) {
          phoneInput.value = pfx + (phoneInput.value || '').replace(/^\+[\d]+\s*/, '');
        }
      };
      phoneInput.addEventListener('focus', ensurePrefix);
      phoneInput.addEventListener('input', () => {
        const pfx = getPrefix();
        if (!phoneInput.value.startsWith(pfx.trim())) {
          const digits = phoneInput.value.replace(/\D/g, '');
          phoneInput.value = pfx + digits;
        }
      });
      phoneInput.addEventListener('keydown', (e) => {
        const pfx = getPrefix();
        if ((e.key === 'Backspace' || e.key === 'Delete') && phoneInput.selectionStart <= pfx.length) {
          e.preventDefault();
        }
      });
      // Sahifa yuklanganda standart qiymat
      if (!phoneInput.value) phoneInput.value = getPrefix();
    }
    $('#shareAppBtn').addEventListener('click', async () => {
      const data = { title: 'Kapgir Premium', text: 'Premium oshxona anjomlari', url: window.location.href };
      if (navigator.share) { try { await navigator.share(data); } catch (e) {} }
      else { await navigator.clipboard?.writeText(window.location.href); toast('Havola nusxalandi'); }
    });
    // Til almashtirish tugmasi
    const changeLangBtn = $('#changeLangBtn');
    if (changeLangBtn) {
      changeLangBtn.addEventListener('click', () => {
        LanguageManager.show((code) => {
          LanguageManager.applyToUI();
          // Render sections/favorites again so dynamic text updates
          if (typeof Sections !== 'undefined') Sections.render();
          if (typeof Collections !== 'undefined') Collections.render();
          if (typeof Favorites !== 'undefined') Favorites.render();
          if (typeof Search !== 'undefined') { Search.renderFilters(); }
        });
      });
    }
  },
};

/* ───── 16. NAVIGATION ───── */
const Navigation = {
  bind() {
    $$('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        addRipple(e, btn);
        // nav-item without data-page (e.g., cart center button) is handled via data-action
        if (btn.dataset.page) this.goTo(btn.dataset.page);
      });
    });
  },
  goTo(page, silent = false) {
    const prev = State.currentPage;
    State.currentPage = page;
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page && b.dataset.page === page));
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
    // Section "See all" button
    const seeAllBtn = e.target.closest('[data-see-all]');
    if (seeAllBtn) {
      e.stopPropagation();
      Sections.openAll(seeAllBtn.dataset.seeAll);
      return;
    }
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      e.stopPropagation();
      const action = actionBtn.dataset.action;
      const id = actionBtn.dataset.id;
      switch (action) {
        case 'like': Favorites.toggle(id); break;
        case 'add-cart': Cart.add(id); break;
        case 'open-cart': Cart.open(); break;
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
      // Skip if click landed on a hero dot or interactive control inside the card
      if (e.target.closest('.hero-dot') || e.target.closest('[data-action]')) return;
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
  // navCartBtn is handled via data-action="open-cart" in the global handler
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
  show() {
    $('#registerModal').classList.remove('hidden');
    const phoneInput = $('#userPhone');
    if (phoneInput && (!phoneInput.value || phoneInput.value === '+998 ')) {
      const pfx = (typeof LanguageManager !== 'undefined') ? LanguageManager.getPhonePrefix() : '+998 ';
      phoneInput.value = pfx;
      phoneInput.placeholder = pfx + '__ ___ __ __';
    }
  },
  hide() { $('#registerModal').classList.add('hidden'); },
  bind() {
    // Telefon inputiga +998 prefiksini doimiy qo'yib turish
    const phoneInput = $('#userPhone');
    if (phoneInput) {
      const getRegPrefix = () => (typeof LanguageManager !== 'undefined') ? LanguageManager.getPhonePrefix() : '+998 ';
      if (!phoneInput.value) phoneInput.value = getRegPrefix();
      phoneInput.addEventListener('focus', () => {
        const pfx = getRegPrefix();
        if (!phoneInput.value.startsWith(pfx.trim())) phoneInput.value = pfx;
        // Kursor prefixdan keyin tursin
        setTimeout(() => {
          const v = phoneInput.value;
          phoneInput.setSelectionRange(v.length, v.length);
        }, 0);
      });
      phoneInput.addEventListener('input', () => {
        const pfx = getRegPrefix();
        if (!phoneInput.value.startsWith(pfx.trim())) {
          const digits = phoneInput.value.replace(/\D/g, '');
          phoneInput.value = pfx + digits;
        }
      });
      phoneInput.addEventListener('keydown', (e) => {
        const pfx = getRegPrefix();
        if ((e.key === 'Backspace' || e.key === 'Delete') && phoneInput.selectionStart <= pfx.length) {
          e.preventDefault();
        }
      });
    }
    $('#registerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#userName').value.trim();
      const surname = $('#userSurname').value.trim();
      let phone = $('#userPhone').value.trim();
      const _pfx = (typeof LanguageManager !== 'undefined') ? LanguageManager.getPhonePrefix().trim() : '+998';
      if (!phone || phone === _pfx) phone = '';
      if (!name || !surname || !phone) return;
      State.user = { name, surname, phone };
      Storage.set(CONFIG.STORAGE_KEYS.USER, State.user);
      this.hide();
      Profile.render();
      toast(LanguageManager.t('welcomeToast'));
      // Agar buyurtma uchun ro'yxatdan o'tilgan bo'lsa — buyurtmani davom ettirish
      if (State._pendingCheckout) {
        State._pendingCheckout = false;
        setTimeout(() => Cart.checkout(), 400);
      }
    });
  },
};