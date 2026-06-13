'use strict';

/* ═══════════════════════════════════════════════════════════════
   0. LANGUAGE MANAGER — til tanlash va tarjimalar
   ─────────────────────────────────────────────────────────────
   6 ta til qo'llab-quvvatlanadi:
   uz (O'zbek) · tr (Türkçe) · en (English)
   ky (Кыргызча) · kk (Қазақша) · ru (Русский)
═══════════════════════════════════════════════════════════════ */

const TRANSLATIONS = {
  uz: {
    langTitle:        "Tilni tanlang",
    langSubtitle:     "Qaysi tilda davom etmoqchisiz?",
    welcome:          "Xush kelibsiz!",
    regSubtitle:      "Buyurtma uchun ma'lumotlaringizni kiriting",
    firstName:        "Ism",
    firstNamePH:      "Ismingiz",
    lastName:         "Familiya",
    lastNamePH:       "Familiyangiz",
    phone:            "Telefon raqam",
    continuBtn:       "Davom etish",
    cartTitle:        "Savatcha",
    checkoutBtn:      "Telegram orqali buyurtma",
    welcomeToast:     "Xush kelibsiz! 🎉",
    cartEmpty:        "Savatcha bo'sh",
    navHome:          "Asosiy",
    navSearch:        "Qidiruv",
    navCollections:   "To'plamlar",
    navFavorites:     "Sevimli",
    navProfile:       "Profil",
    newsTitle:        "Yangiliklar",
    allBtn:           "Barchasi",
    changeLang:           "Tilni almashtirish",
    shareApp:           "Ilovani ulashish",
    profileEdit:           "Tahrirlash",
    statFav:           "Sevimlilar",
    statCart:           "Savatcha",
    collectionsTitle:          "To'plamlar",
    collectionsSub:          "Premium kolleksiyalar",
    collectionsEmpty:          "To'plamlar topilmadi",
    collectionsEmptySub:          "3-varaqqa ma'lumot qo'shing",
    favTitle:          "Sevimlilar",
    favEmpty:          "Sevimlilar bo'sh",
    favEmptySub:          "Mahsulotlarga yurakcha bosing",
    searchPlaceholder:          "Model, material, yuza...",
    searchEmpty:          "Mahsulot qidiring",
    searchEmptySub:          "Model raqami, material yoki yuza raqami",
    searchNotFound:          "Topilmadi",
    searchNotFoundSub:          "So'rov yoki filterlarni o'zgartiring",
    filterAll:          "Hammasi",
    filterSurface:          "Yuza:",
    productCount:          "ta mahsulot",
    modelLabel:          "Model",
    specTotalLen:          "Umumiy uzunligi",
    specSurfaceSize:          "Yuza o'lchami",
    specWoodLen:          "Yog'och uzunligi",
    specSurfaceNum:          "Yuza raqami",
    specId:          "ID",
    dona:          "dona",
  },
  tr: {
    langTitle:        "Dil seçin",
    langSubtitle:     "Hangi dilde devam etmek istersiniz?",
    welcome:          "Hoş geldiniz!",
    regSubtitle:      "Sipariş için bilgilerinizi girin",
    firstName:        "Ad",
    firstNamePH:      "Adınız",
    lastName:         "Soyad",
    lastNamePH:       "Soyadınız",
    phone:            "Telefon numarası",
    continuBtn:       "Devam et",
    cartTitle:        "Sepet",
    checkoutBtn:      "Telegram ile sipariş ver",
    welcomeToast:     "Hoş geldiniz! 🎉",
    cartEmpty:        "Sepet boş",
    navHome:          "Ana Sayfa",
    navSearch:        "Arama",
    navCollections:   "Koleksiyonlar",
    navFavorites:     "Favoriler",
    navProfile:       "Profil",
    newsTitle:        "Haberler",
    allBtn:           "Tümü",
    changeLang:           "Dili değiştir",
    shareApp:           "Uygulamayı paylaş",
    profileEdit:           "Düzenle",
    statFav:           "Favoriler",
    statCart:           "Sepet",
    collectionsTitle:          "Koleksiyonlar",
    collectionsSub:          "Premium koleksiyonlar",
    collectionsEmpty:          "Koleksiyon bulunamadı",
    collectionsEmptySub:          "3. sayfaya veri ekleyin",
    favTitle:          "Favoriler",
    favEmpty:          "Favoriler boş",
    favEmptySub:          "Ürünlere kalp basın",
    searchPlaceholder:          "Model, malzeme, yüzey...",
    searchEmpty:          "Ürün arayın",
    searchEmptySub:          "Model numarası, malzeme veya yüzey",
    searchNotFound:          "Bulunamadı",
    searchNotFoundSub:          "Sorgu veya filtreleri değiştirin",
    filterAll:          "Hepsi",
    filterSurface:          "Yüzey:",
    productCount:          "ürün",
    modelLabel:          "Model",
    specTotalLen:          "Toplam uzunluk",
    specSurfaceSize:          "Yüzey ölçüsü",
    specWoodLen:          "Ahşap uzunluğu",
    specSurfaceNum:          "Yüzey no",
    specId:          "ID",
    dona:          "adet",
  },
  en: {
    langTitle:        "Select language",
    langSubtitle:     "Which language would you like to continue in?",
    welcome:          "Welcome!",
    regSubtitle:      "Enter your details to place an order",
    firstName:        "First name",
    firstNamePH:      "Your first name",
    lastName:         "Last name",
    lastNamePH:       "Your last name",
    phone:            "Phone number",
    continuBtn:       "Continue",
    cartTitle:        "Cart",
    checkoutBtn:      "Order via Telegram",
    welcomeToast:     "Welcome! 🎉",
    cartEmpty:        "Cart is empty",
    navHome:          "Home",
    navSearch:        "Search",
    navCollections:   "Collections",
    navFavorites:     "Favourites",
    navProfile:       "Profile",
    newsTitle:        "News",
    allBtn:           "See all",
    changeLang:           "Change language",
    shareApp:           "Share app",
    profileEdit:           "Edit",
    statFav:           "Favourites",
    statCart:           "Cart",
    collectionsTitle:          "Collections",
    collectionsSub:          "Premium collections",
    collectionsEmpty:          "No collections found",
    collectionsEmptySub:          "Add data to sheet 3",
    favTitle:          "Favourites",
    favEmpty:          "Favourites empty",
    favEmptySub:          "Tap heart on products",
    searchPlaceholder:          "Model, material, surface...",
    searchEmpty:          "Search products",
    searchEmptySub:          "Model number, material or surface",
    searchNotFound:          "Not found",
    searchNotFoundSub:          "Change query or filters",
    filterAll:          "All",
    filterSurface:          "Surface:",
    productCount:          "products",
    modelLabel:          "Model",
    specTotalLen:          "Total length",
    specSurfaceSize:          "Surface size",
    specWoodLen:          "Wood length",
    specSurfaceNum:          "Surface no",
    specId:          "ID",
    dona:          "pcs",
  },
  ky: {
    langTitle:        "Тилди тандаңыз",
    langSubtitle:     "Кайсы тилде улантасыз?",
    welcome:          "Кош келиңиз!",
    regSubtitle:      "Буйрутма берүү үчүн маалыматыңызды киргизиңиз",
    firstName:        "Аты",
    firstNamePH:      "Атыңыз",
    lastName:         "Фамилия",
    lastNamePH:       "Фамилияңыз",
    phone:            "Телефон номери",
    continuBtn:       "Улантуу",
    cartTitle:        "Себет",
    checkoutBtn:      "Telegram аркылуу буйрутма",
    welcomeToast:     "Кош келиңиз! 🎉",
    cartEmpty:        "Себет бош",
    navHome:          "Башкы",
    navSearch:        "Издөө",
    navCollections:   "Жыйнактар",
    navFavorites:     "Тандамалдар",
    navProfile:       "Профиль",
    newsTitle:        "Жаңылыктар",
    allBtn:           "Баары",
    changeLang:           "Тилди алмаштыруу",
    shareApp:           "Колдонмону бөлүшүү",
    profileEdit:           "Өзгөртүү",
    statFav:           "Тандамалдар",
    statCart:           "Себет",
    collectionsTitle:          "Жыйнактар",
    collectionsSub:          "Премиум жыйнактар",
    collectionsEmpty:          "Жыйнактар табылган жок",
    collectionsEmptySub:          "3-баракка маалымат кошуңуз",
    favTitle:          "Тандамалдар",
    favEmpty:          "Тандамалдар бош",
    favEmptySub:          "Өнүмдөргө жүрөк басыңыз",
    searchPlaceholder:          "Модель, материал, бет...",
    searchEmpty:          "Өнүм издеңиз",
    searchEmptySub:          "Модель номери, материал же бет",
    searchNotFound:          "Табылган жок",
    searchNotFoundSub:          "Суроону же чыпкаларды өзгөртүңүз",
    filterAll:          "Баары",
    filterSurface:          "Бет:",
    productCount:          "өнүм",
    modelLabel:          "Модель",
    specTotalLen:          "Жалпы узундугу",
    specSurfaceSize:          "Бет өлчөмү",
    specWoodLen:          "Жыгач узундугу",
    specSurfaceNum:          "Бет номери",
    specId:          "ID",
    dona:          "дана",
  },
  kk: {
    langTitle:        "Тілді таңдаңыз",
    langSubtitle:     "Қай тілде жалғастырғыңыз келеді?",
    welcome:          "Қош келдіңіз!",
    regSubtitle:      "Тапсырыс үшін деректеріңізді енгізіңіз",
    firstName:        "Аты",
    firstNamePH:      "Атыңыз",
    lastName:         "Тегі",
    lastNamePH:       "Тегіңіз",
    phone:            "Телефон нөмірі",
    continuBtn:       "Жалғастыру",
    cartTitle:        "Себет",
    checkoutBtn:      "Telegram арқылы тапсырыс",
    welcomeToast:     "Қош келдіңіз! 🎉",
    cartEmpty:        "Себет бос",
    navHome:          "Басты",
    navSearch:        "Іздеу",
    navCollections:   "Жинақтар",
    navFavorites:     "Таңдаулылар",
    navProfile:       "Профиль",
    newsTitle:        "Жаңалықтар",
    allBtn:           "Барлығы",
    changeLang:           "Тілді ауыстыру",
    shareApp:           "Қолданбаны бөлісу",
    profileEdit:           "Өзгерту",
    statFav:           "Таңдаулылар",
    statCart:           "Себет",
    collectionsTitle:          "Жинақтар",
    collectionsSub:          "Премиум жинақтар",
    collectionsEmpty:          "Жинақтар табылмады",
    collectionsEmptySub:          "3-параққа деректер қосыңыз",
    favTitle:          "Таңдаулылар",
    favEmpty:          "Таңдаулылар бос",
    favEmptySub:          "Өнімдерге жүрек басыңыз",
    searchPlaceholder:          "Модель, материал, бет...",
    searchEmpty:          "Өнім іздеңіз",
    searchEmptySub:          "Модель нөмірі, материал немесе бет",
    searchNotFound:          "Табылмады",
    searchNotFoundSub:          "Сұрауды немесе сүзгілерді өзгертіңіз",
    filterAll:          "Барлығы",
    filterSurface:          "Бет:",
    productCount:          "өнім",
    modelLabel:          "Модель",
    specTotalLen:          "Жалпы ұзындығы",
    specSurfaceSize:          "Бет өлшемі",
    specWoodLen:          "Ағаш ұзындығы",
    specSurfaceNum:          "Бет нөмірі",
    specId:          "ID",
    dona:          "дана",
  },
  tg: {
    langTitle:        "Забонро интихоб кунед",
    langSubtitle:     "Ба кадом забон идома додан мехоҳед?",
    welcome:          "Хуш омадед!",
    regSubtitle:      "Маълумотҳоятонро барои фармоиш ворид кунед",
    firstName:        "Ном",
    firstNamePH:      "Номатон",
    lastName:         "Насаб",
    lastNamePH:       "Насабатон",
    phone:            "Рақами телефон",
    continuBtn:       "Идома додан",
    cartTitle:        "Сабад",
    checkoutBtn:      "Фармоиш тавассути Telegram",
    welcomeToast:     "Хуш омадед! 🎉",
    cartEmpty:        "Сабад холӣ аст",
    navHome:          "Асосӣ",
    navSearch:        "Ҷустуҷӯ",
    navCollections:   "Маҷмӯаҳо",
    navFavorites:     "Дӯстдоштаҳо",
    navProfile:       "Профил",
    newsTitle:        "Хабарҳо",
    allBtn:           "Ҳама",
    changeLang:           "Забонро иваз кунед",
    shareApp:           "Барномаро мубодила кунед",
    profileEdit:           "Таҳрир",
    statFav:           "Дӯстдоштаҳо",
    statCart:           "Сабад",
    collectionsTitle:          "Маҷмӯаҳо",
    collectionsSub:          "Маҷмӯаҳои Premium",
    collectionsEmpty:          "Маҷмӯае ёфт нашуд",
    collectionsEmptySub:        "Маълумот ба варақи 3 илова кунед",
    favTitle:          "Дӯстдоштаҳо",
    favEmpty:          "Дӯстдоштаҳо холӣ аст",
    favEmptySub:          "Ба маҳсулот дил зананд",
    searchPlaceholder:          "Модел, мавод, сатҳ...",
    searchEmpty:          "Маҳсулотро ҷустуҷӯ кунед",
    searchEmptySub:          "Рақами модел, мавод ё сатҳ",
    searchNotFound:          "Ёфт нашуд",
    searchNotFoundSub:          "Дархост ё филтрҳоро иваз кунед",
    filterAll:          "Ҳама",
    filterSurface:          "Сатҳ:",
    productCount:          "маҳсулот",
    modelLabel:          "Модел",
    specTotalLen:          "Дарозии умумӣ",
    specSurfaceSize:        "Андозаи сатҳ",
    specWoodLen:          "Дарозии чӯб",
    specSurfaceNum:        "Рақами сатҳ",
    specId:          "ID",
    dona:          "дона",
  },
  ru: {
    langTitle:        "Выберите язык",
    langSubtitle:     "На каком языке хотите продолжить?",
    welcome:          "Добро пожаловать!",
    regSubtitle:      "Введите данные для оформления заказа",
    firstName:        "Имя",
    firstNamePH:      "Ваше имя",
    lastName:         "Фамилия",
    lastNamePH:       "Ваша фамилия",
    phone:            "Номер телефона",
    continuBtn:       "Продолжить",
    cartTitle:        "Корзина",
    checkoutBtn:      "Заказ через Telegram",
    welcomeToast:     "Добро пожаловать! 🎉",
    cartEmpty:        "Корзина пуста",
    navHome:          "Главная",
    navSearch:        "Поиск",
    navCollections:   "Коллекции",
    navFavorites:     "Избранное",
    navProfile:       "Профиль",
    newsTitle:        "Новости",
    allBtn:           "Все",
    changeLang:           "Сменить язык",
    shareApp:           "Поделиться приложением",
    profileEdit:           "Редактировать",
    statFav:           "Избранное",
    statCart:           "Корзина",
    collectionsTitle:          "Коллекции",
    collectionsSub:          "Премиум коллекции",
    collectionsEmpty:          "Коллекции не найдены",
    collectionsEmptySub:          "Добавьте данные на лист 3",
    favTitle:          "Избранное",
    favEmpty:          "Избранное пусто",
    favEmptySub:          "Нажмите сердечко на товарах",
    searchPlaceholder:          "Модель, материал, поверхность...",
    searchEmpty:          "Ищите товары",
    searchEmptySub:          "Номер модели, материал или поверхность",
    searchNotFound:          "Не найдено",
    searchNotFoundSub:          "Измените запрос или фильтры",
    filterAll:          "Все",
    filterSurface:          "Поверх.:",
    productCount:          "товаров",
    modelLabel:          "Модель",
    specTotalLen:          "Общая длина",
    specSurfaceSize:          "Размер поверхности",
    specWoodLen:          "Длина дерева",
    specSurfaceNum:          "Номер поверхности",
    specId:          "ID",
    dona:          "шт",
  },
};

const LANG_OPTIONS = [
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'ky', flag: '🇰🇬', label: 'Кыргызча' },
  { code: 'kk', flag: '🇰🇿', label: 'Қазақша' },
  { code: 'tg', flag: '🇹🇯', label: 'Тоҷикӣ' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'uz', flag: '🇺🇿', label: "O'zbek" },
];

// Har bir tilga mos telefon prefiksi
const PHONE_PREFIXES = {
  uz: '+998 ',
  tr: '+90 ',
  en: '+44 ',
  ky: '+996 ',
  kk: '+7 ',
  tg: '+992 ',
  ru: '+7 ',
};

const LanguageManager = {
  current: 'uz',

  t(key) {
    const dict = TRANSLATIONS[this.current] || TRANSLATIONS.uz;
    return dict[key] || TRANSLATIONS.uz[key] || key;
  },

  save(code) {
    this.current = code;
    localStorage.setItem(CONFIG.STORAGE_KEYS.LANG, code);
  },

  load() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.LANG);
    if (saved && TRANSLATIONS[saved]) {
      this.current = saved;
      return true; // already set
    }
    this.current = 'uz';
    return false; // not set yet
  },

  /* --- UI ni tanlangan tilga moslashtirish --- */
  getPhonePrefix() {
    return PHONE_PREFIXES[this.current] || '+';
  },

  applyToUI() {
    const t = (k) => this.t(k);

    // ── Registration modal ──
    const regH2 = document.querySelector('#registerModal .register-header h2');
    if (regH2) regH2.textContent = t('welcome');
    const regP = document.querySelector('#registerModal .register-header p');
    if (regP) regP.textContent = t('regSubtitle');
    document.querySelectorAll('#registerForm .form-group').forEach((g, i) => {
      const label = g.querySelector('label');
      const input = g.querySelector('input');
      if (i === 0) { if (label) label.textContent = t('firstName'); if (input) input.placeholder = t('firstNamePH'); }
      else if (i === 1) { if (label) label.textContent = t('lastName'); if (input) input.placeholder = t('lastNamePH'); }
      else if (i === 2) { if (label) label.textContent = t('phone'); }
    });
    const regBtn = document.querySelector('#registerForm .btn-primary');
    if (regBtn) regBtn.textContent = t('continuBtn');

    // ── Cart modal ──
    const cartH2 = document.querySelector('#cartModal .sheet-header h2');
    if (cartH2) cartH2.textContent = t('cartTitle');

    // ── Checkout button ──
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.04 16.94l-.4 4.04c.57 0 .82-.24 1.12-.54l2.7-2.58 5.6 4.1c1.03.57 1.76.27 2.04-.95l3.7-17.35c.33-1.52-.55-2.12-1.55-1.75L1.36 9.55c-1.48.58-1.46 1.4-.25 1.78l5.1 1.6 11.84-7.46c.56-.37 1.07-.17.65.2"/></svg>${t('checkoutBtn')}`;
    }

    // ── News modal ──
    const newsH2 = document.querySelector('#newsModal .sheet-header h2');
    if (newsH2) newsH2.textContent = t('newsTitle');

    // ── Collections page ──
    const colTitle = document.getElementById('collectionsPageTitle') || document.querySelector('#page-collections .page-title');
    if (colTitle) colTitle.textContent = t('collectionsTitle');
    const colSub = document.getElementById('collectionsPageSub') || document.querySelector('#page-collections .page-subtitle');
    if (colSub) colSub.textContent = t('collectionsSub');

    // ── Search page placeholder ──
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = t('searchPlaceholder');

    // ── Favorites page ──
    const favTitle = document.getElementById('favPageTitle') || document.querySelector('#page-favorites .page-title');
    if (favTitle) favTitle.textContent = t('favTitle');
    document.querySelectorAll('#page-favorites .empty-state h3').forEach(el => el.textContent = t('favEmpty'));
    document.querySelectorAll('#page-favorites .empty-state p').forEach(el => el.textContent = t('favEmptySub'));

    // ── Search empty states (initial) ──
    const searchEmptyH3 = document.getElementById('searchEmptyH3');
    if (searchEmptyH3) searchEmptyH3.textContent = t('searchEmpty');
    const searchEmptyP = document.getElementById('searchEmptyP');
    if (searchEmptyP) searchEmptyP.textContent = t('searchEmptySub');
    // Also update dynamically rendered search results
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      const h3 = searchResults.querySelector('.empty-state h3');
      const p  = searchResults.querySelector('.empty-state p');
      if (h3) h3.textContent = t('searchEmpty');
      if (p)  p.textContent  = t('searchEmptySub');
    }

    // ── Profile page ──
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) editProfileBtn.textContent = t('profileEdit');
    const changeLangBtnLabel = document.getElementById('changeLangBtnLabel');
    if (changeLangBtnLabel) changeLangBtnLabel.textContent = t('changeLang');
    const shareAppSpan = document.querySelector('#shareAppBtn span');
    if (shareAppSpan) shareAppSpan.textContent = t('shareApp');
    const statFavLabel = document.querySelector('.stat-card:first-child .stat-label');
    if (statFavLabel) statFavLabel.textContent = t('statFav');
    const statCartLabel = document.querySelector('.stat-card:last-child .stat-label');
    if (statCartLabel) statCartLabel.textContent = t('statCart');

    // ── Phone input prefix by language ──
    const phoneInputEl = document.getElementById('userPhone');
    if (phoneInputEl) {
      const prefix = this.getPhonePrefix();
      const currentVal = phoneInputEl.value || '';
      // Replace old prefix with new one, keeping any digits after it
      const digitsOnly = currentVal.replace(/^\+\d+\s*/, '');
      phoneInputEl.value = prefix + digitsOnly;
      phoneInputEl.placeholder = prefix + '__ ___ __ __';
    }

    // ── Lang modal title/subtitle ──
    const langTitle = document.getElementById('langModalTitle');
    if (langTitle) langTitle.textContent = t('langTitle');
    const langSubtitle = document.getElementById('langModalSubtitle');
    if (langSubtitle) langSubtitle.textContent = t('langSubtitle');

    // ── Bottom nav labels (faqat data-page bo'lgan itemlar) ──
    const navPages = ['home', 'collections', 'favorites', 'profile'];
    const navKeys2 = ['navHome', 'navCollections', 'navFavorites', 'navProfile'];
    navPages.forEach((page, i) => {
      const btn = document.querySelector(`.nav-item[data-page="${page}"]`);
      if (btn) { const span = btn.querySelector('span'); if (span) span.textContent = t(navKeys2[i]); }
    });
  },
  /* --- Til tanlash modal --- */
  renderModal() {
    const container = document.getElementById('langBtnList');
    if (!container) return;
    const otherLangs = LANG_OPTIONS.filter(l => l.code !== 'uz');
    const uzLang     = LANG_OPTIONS.find(l => l.code === 'uz');
    const mkBtn = (l, wide) => `
      <button class="lang-btn ${wide ? 'lang-btn--wide' : ''} ${l.code === this.current ? 'lang-btn--active' : ''}"
              data-lang="${l.code}">
        <span class="lang-flag">${l.flag}</span>
        <span class="lang-label">${l.label}</span>
        ${l.code === this.current ? '<span class="lang-check">✓</span>' : ''}
      </button>`;
    container.innerHTML =
      '<div class="lang-grid-uz">'  + mkBtn(uzLang, true) + '</div>' +
      '<div class="lang-grid-other">' + otherLangs.map(l => mkBtn(l, false)).join('') + '</div>';
  },

  show(onSelect) {
    this.renderModal();
    const modal = document.getElementById('langModal');
    if (modal) modal.classList.remove('hidden');

    document.getElementById('langBtnList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lang]');
      if (!btn) return;
      const code = btn.dataset.lang;
      this.save(code);
      this.applyToUI();
      modal.classList.add('hidden');
      if (onSelect) onSelect(code);
    }, { once: true });
  },

  hide() {
    const modal = document.getElementById('langModal');
    if (modal) modal.classList.add('hidden');
  },
};
