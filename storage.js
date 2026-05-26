'use strict';

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