# Kapgir Premium — Yangilashlar va O'zgarishlar

## 📋 Qo'llanma

Ushbu loyihada quyidagi asosiy o'zgarishlar amalga oshirildi:

### 1. **ID Mapping — E Ustunidan Olinadi**

**Oldingi tizim:**
- Google Sheets 1-varag'ining H ustunidan mahsulot ID olinardi

**Yangi tizim:**
- Google Sheets 1-varag'ining **E ustunidan** (Kapgir ID) mahsulot ID olinadi
- Bu ID raqami asosida mahsulotlarni to'lam (Collections), hero va story sahifalariga qo'shish mumkin

**Fayllar:**
- `storage.js` — 82-90 qatorlar: ID mapping qismi yangilandi

**Google Sheets struktura:**
```
A = Model (masalan: "1", "2", "3")
B = Material (masalan: "Metall", "Plastik")
C = Umumiy uzunlik (masalan: "30 sm")
D = Truba uzunlik (masalan: "20 sm")
E = Kapgir ID ← ID SHUNGA OLINADI (masalan: "KP001", "KP002")
F = Yuza raqami (masalan: "1", "2", "3")
G = Yuza o'lchami (masalan: "5x5 sm", "10x10 sm")
H = Eski ID (endi ishlatilmaydi)
I = Rasm1 (URL)
J = Rasm2 (URL)
K = Rasm3 (URL)
L = Video (URL)
```

### 2. **Mahsulot Kartasida O'lcham Ko'rsatkichlari**

**Yangilangan ko'rsatkichlar:**
- **Umumiy uzunlik** — Mahsulotning to'liq uzunligi
- **Yuza o'lchami** — Yuza qismining o'lchami

**Fayllar:**
- `product-card.js` — 59-61 qatorlar: Kartada ko'rsatilgan o'lchamlar yangilandi

**Kartada ko'rinadigan ma'lumotlar:**
```
┌─────────────────────┐
│   Mahsulot Rasmi    │
├─────────────────────┤
│ Model 1             │
│ Umumiy: 30 sm       │
│ Yuza: 5x5 sm        │
│ Material: Metall    │
└─────────────────────┘
```

### 3. **To'lam (Collections) va Hero Sahifasiga Qo'shish**

**Qanday ishlaydi:**
- Google Sheets 3-varag'ida (Collections) D ustunida mahsulot ID raqamlarini vergul bilan ajratib yozing
- Google Sheets 2-varag'ida (Sections) C ustunida mahsulot ID raqamlarini vergul bilan ajratib yozing
- Ushbu ID raqamlar E ustunidagi Kapgir ID raqamlariga mos kelishi kerak

**Misol:**
```
Collections varag'i (3-varaq):
Nomi: "Oshxona Anjomlari"
Tavsifi: "Eng yaxshi kapgirlar"
Rasm: [URL]
ID raqamlar: KP001, KP002, KP003

Sections varag'i (2-varaq):
Type: hero
Title: "Yangi Mahsulotlar"
ID raqamlar: KP001, KP002, KP003
```

### 4. **Story va Instagram-Uslubi Sahifalar**

**Qanday ishlaydi:**
- Google Sheets 2-varag'ida (Sections) Type ustuniga "story" yozing
- C ustunida mahsulot ID raqamlarini vergul bilan ajratib yozing
- Ushbu mahsulotlar Instagram-uslubi story sahifasida ko'rinadi

**Misol:**
```
Type: story
Title: "Yangi Koleksiya"
ID raqamlar: KP001, KP002, KP003
```

### 5. **Mahsulot Detallarida Yangi Ma'lumotlar**

**Mahsulot detallarida ko'rinadigan ma'lumotlar:**
- Model
- Material
- Umumiy uzunligi
- Truba uzunligi
- Yog'och uzunligi
- Yuza raqami
- Yuza o'lchami
- **Kapgir ID** (yangi)

**Fayllar:**
- `cart-detail.js` — 188-198 qatorlar: Detallar ko'rsatiladi

---

## 🔧 Texnik Tafsilotlar

### Yangilangan Fayllar:
1. **storage.js** — ID mapping qismi (E ustunidan)
2. **product-card.js** — Kartada ko'rsatilgan o'lchamlar
3. **cart-detail.js** — Detallarida ID ko'rsatiladi

### Asosiy Funksiyalar:
- `findProduct(id)` — ID raqami asosida mahsulot topish
- `Sections.render()` — Sections varag'idan ma'lumotlarni ko'rsatish
- `Collections.render()` — Collections varag'idan ma'lumotlarni ko'rsatish
- `Stories.render()` — Story sahifasini ko'rsatish

---

## ✅ Tekshirilgan Vazifalar

- [x] E ustunidan ID olinadi
- [x] Mahsulot kartasida umumiy uzunlik ko'rsatiladi
- [x] Mahsulot kartasida yuza o'lchami ko'rsatiladi
- [x] To'lam (Collections) ID raqamlar asosida ishlaydi
- [x] Hero sahifasi ID raqamlar asosida ishlaydi
- [x] Story sahifasi ID raqamlar asosida ishlaydi

---

## 📝 Qo'shimcha Eslatmalar

- Google Sheets'dagi ma'lumotlar har 15 daqiqada yangilanadi (cache)
- ID raqamlar bosh-kichik harfga sezgir (case-sensitive)
- ID raqamlar bo'sh joylardan tozalanadi (trim)
- Mahsulot kartasida faqat to'liq ma'lumotlar ko'rsatiladi

---

**Yangilangan sana:** 2026-06-13
