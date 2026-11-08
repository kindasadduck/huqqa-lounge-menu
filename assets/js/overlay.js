// Live changes from the admin panel (D1, served by /api/state) applied on top of menu-data.js.
// Shared by the public menu (app.js) and the panel (admin/). If /api/state fails, the base menu shows as is.
// Item key = "<section id>/<English name>" — the English name as written in menu-data.js, even after a rename.
(function () {
  const isItem = (o) => o && typeof o === "object" && Array.isArray(o.name) && o.price !== undefined;
  const itemKey = (sectionId, item) => sectionId + "/" + (item._baseName || item.name)[0];

  // Calls cb(item, key, section, parentArray) for every priced item; tile "more" sheets are skipped
  // (they belong to their tile).
  function walkItems(menu, cb) {
    const visit = (o, sec, parent) => {
      if (Array.isArray(o)) { o.slice().forEach((x) => visit(x, sec, o)); return; }
      if (!o || typeof o !== "object") return;
      if (isItem(o)) { cb(o, itemKey(sec.id, o), sec, parent); }
      for (const [k, v] of Object.entries(o)) {
        if (k === "more" || k === "name" || k === "desc" || k === "extra" || k === "title") continue;
        if (v && typeof v === "object") visit(v, sec, null);
      }
    };
    for (const s of menu.sections) {
      if (s.hero) visit(s.hero, s, null);
      visit(s.groups || [], s, null);
    }
  }

  // [item, section] for an item key (base, renamed or added), or null if hidden/missing.
  function findByKey(menu, key) {
    let hit = null;
    walkItems(menu, (item, k, sec) => {
      if (!hit && (item._added ? "new:" + item._added : k) === key) hit = [item, sec];
    });
    return hit;
  }

  const photo = (img) => (typeof img === "string" && img.startsWith("r2:") ? { r2: img.slice(3) } : img);

  // Mutates and returns menu. state shape: docs/api.md → "GET /api/state".
  function applyOverlay(menu, state) {
    if (!state || typeof state !== "object") return menu;
    const items = state.items || {};
    const unavailable = new Set(state.unavailable || []);

    // Groups opened in the panel go after the section's own groups. layout: rail | grid | list.
    for (const g of state.groups || []) {
      const sec = menu.sections.find((s) => s.id === g.section);
      if (!sec) continue;
      (sec.groups = sec.groups || []).push({ title: g.title, items: [], rail: g.layout === "rail", _layout: g.layout, _gid: g.id });
    }

    // Added items next, so they get the same treatment as base items below.
    for (const a of state.added || []) {
      const sec = menu.sections.find((s) => s.id === a.section);
      const gid = typeof a.group === "string" && a.group.startsWith("g:") ? a.group.slice(2) : null;
      const group = sec && sec.groups && (gid ? sec.groups.find((g) => g._gid === gid) : sec.groups[a.group || 0]);
      if (!group || !Array.isArray(group.items)) continue;
      const desc = Array.isArray(a.desc) && a.desc.join("").trim() ? a.desc : null;
      group.items.push({ name: a.name, price: a.price, img: a.img || null, desc,
        veg: !!a.veg, _added: a.id });
    }

    walkItems(menu, (item, key, sec, parent) => {
      const o = items[item._added ? "new:" + item._added : key];
      if (o) {
        if (!item._baseName) item._baseName = item.name;
        for (const f of ["name", "desc", "price", "img", "veg"]) if (o[f] !== undefined && o[f] !== null) item[f] = o[f];
        if (Array.isArray(item.desc) && !item.desc.join("").trim()) item.desc = null; // panel cleared it
        if (o.hidden && parent) parent.splice(parent.indexOf(item), 1);
      }
      if (unavailable.has(item._added ? "new:" + item._added : key)) item.unavailable = true;
    });

    const hookah = menu.sections.find((s) => s.id === "hookah");
    if (hookah) {
      if (state.hookah) {
        const h = state.hookah;
        if (Array.isArray(h.classic)) hookah.tiers[0].flavors = h.classic;
        if (h.premium && typeof h.premium === "object") {
          hookah.tiers[1].brandOf = h.premium;
          hookah.tiers[1].flavors = Object.values(h.premium).flat();
        }
        if (Array.isArray(h.bestsellers)) hookah.bestsellers = h.bestsellers;
      }
      if (Array.isArray(state.picks)) hookah.staffPicks = state.picks;
      hookah.unavailableFlavors = [...unavailable].filter((k) => k.startsWith("flavor:")).map((k) => k.slice(7));
    }
    // Sliders: Featured (any section) and each section's best-seller rail, as ordered item keys.
    if (Array.isArray(state.featured)) menu.featuredKeys = state.featured;
    for (const [secId, keys] of Object.entries(state.carousels || {})) {
      const sec = menu.sections.find((s) => s.id === secId);
      if (sec && Array.isArray(keys)) sec.carouselKeys = keys;
    }
    menu._stateVersion = state.v || 0;
    return menu;
  }

  window.HQ = Object.assign(window.HQ || {}, { itemKey, walkItems, findByKey, applyOverlay, photo });
})();
