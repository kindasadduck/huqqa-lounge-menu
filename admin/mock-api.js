// Mock API for the staff panel. Active only with ?mock=1 in the URL (admin.js loads this file then).
// Wraps window.fetch for /api/* and /media/*, follows docs/api.md to the letter, keeps its data in
// localStorage ("hq-mock-db") so it survives a reload. Demo users: Can (admin, 1111), Eylül (server, 2222),
// Mutfak (kitchen, 3333). Reset everything: HQ_MOCK.reset().
// Test helpers from the console: HQ_MOCK.setOffline(true) → every request fails like a dead network;
// HQ_MOCK.setLatency(ms).
// Not part of the contract (chosen here): 400 "invalid" for bad bodies, 404 "not_found", 409 "exists" for a duplicate user name.
(function () {
  if (!/[?&]mock=1\b/.test(location.search) && !/\.github\.io$/.test(location.hostname)) return;
  // Separate demo session per page (/admin vs /server) so both can be shown in one browser.
  const DB_KEY = "hq-mock-db", SESS_KEY = "hq-mock-sess" + ((document.body && document.body.dataset.demoRole) ? "-" + document.body.dataset.demoRole : "");
  const realFetch = window.fetch.bind(window);
  let offline = false, latency = 220;

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const seed = () => ({
    v: 1, updatedAt: new Date().toISOString(),
    items: {}, unavailable: [], added: [], groups: [], featured: null, carousels: {}, hookah: null, picks: null, nextId: 1,
    users: [
      { name: "Can", role: "admin", pickName: "Can", active: true, lastLogin: null, pin: "1111" },
      { name: "Eylül", role: "server", pickName: "Eylül", active: true, lastLogin: null, pin: "2222" },
      { name: "Mutfak", role: "kitchen", pickName: null, active: true, lastLogin: null, pin: "3333" },
    ],
    log: [], fails: {}, media: {},
  });
  let db;
  try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch (_) {}
  if (!db || typeof db !== "object") db = seed();
  db.groups = db.groups || []; db.carousels = db.carousels || {}; if (db.featured === undefined) db.featured = null;
  const save = () => {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
    catch (_) { db.media = {}; try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (__) {} } // quota: drop photos
  };
  const getSess = () => { try { return localStorage.getItem(SESS_KEY); } catch (_) { return null; } };
  const setSess = (n) => { try { n ? localStorage.setItem(SESS_KEY, n) : localStorage.removeItem(SESS_KEY); } catch (_) {} };

  // ---- helpers -------------------------------------------------------------------------------
  const json = (status, body, headers) => new Response(body === undefined ? null : JSON.stringify(body),
    { status, headers: Object.assign({ "Content-Type": "application/json" }, headers || {}) });
  const err = (status, error, message, extra) => json(status, Object.assign({ error, message }, extra || {}));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isPair = (p) => Array.isArray(p) && p.length === 2 && p.every((s) => typeof s === "string" && s.length <= 400);
  const bump = () => { db.v += 1; db.updatedAt = new Date().toISOString(); };
  const logIt = (user, action, target, detail) => {
    db.log.unshift({ at: new Date().toISOString(), user, action, target: target || "", detail: detail || "" });
    db.log = db.log.slice(0, 300);
  };
  const publicUser = (u) => ({ name: u.name, role: u.role, pickName: u.pickName || null });
  const me = () => { const n = getSess(); return n ? db.users.find((u) => u.name === n && u.active) : null; };

  const baseKeys = () => { const s = new Set(); window.HQ.walkItems(window.MENU, (it, key) => s.add(key)); return s; };
  const hookahNow = () => {
    if (db.hookah) return db.hookah;
    const h = window.MENU.sections.find((s) => s.id === "hookah");
    return { classic: h.tiers[0].flavors, premium: h.tiers[1].brandOf, bestsellers: h.bestsellers };
  };
  const allFlavors = () => { const h = hookahNow(); return new Set([...h.classic, ...Object.values(h.premium).flat()]); };
  const keyOk = (key) => {
    if (typeof key !== "string" || key.length > 120) return false;
    if (key.startsWith("flavor:")) return key.length > 7; // any name: a flavor removed from the list may still need its mark cleared
    if (key.startsWith("new:")) return db.added.some((a) => "new:" + a.id === key);
    return baseKeys().has(key);
  };
  const seedPicks = () => {
    const h = window.MENU.sections.find((s) => s.id === "hookah");
    return clone(h.staffPicks).map((p) => ({ name: p.name, title: p.title, picks: p.picks, note: p.note || null }));
  };

  // ---- routes --------------------------------------------------------------------------------
  const routes = [];
  const route = (method, re, roles, fn) => routes.push({ method, re, roles, fn });

  route("GET", /^\/api\/state$/, null, () => json(200, {
    v: db.v, updatedAt: db.updatedAt, items: db.items, unavailable: db.unavailable,
    added: db.added, groups: db.groups, featured: db.featured, carousels: db.carousels, hookah: db.hookah, picks: db.picks,
  }, { "Cache-Control": "public, max-age=10" }));

  route("POST", /^\/api\/login$/, null, (r) => {
    const { name, pin } = r.body || {};
    if (typeof name !== "string" || typeof pin !== "string") return err(401, "bad_login", "Wrong name or PIN.");
    const k = name.trim().toLowerCase();
    const f = db.fails[k];
    if (f && f.until && f.until > Date.now()) {
      return err(429, "locked", "Too many tries. Try again later.", { retryAfter: Math.ceil((f.until - Date.now()) / 1000) });
    }
    const u = db.users.find((x) => x.name.toLowerCase() === k && x.active);
    if (!u || u.pin !== pin) {
      const n = ((f && !f.until ? f.n : 0) || 0) + 1;
      db.fails[k] = n >= 5 ? { n: 0, until: Date.now() + 15 * 60 * 1000 } : { n };
      save();
      if (n >= 5) return err(429, "locked", "Too many tries. Try again later.", { retryAfter: 900 });
      return err(401, "bad_login", "Wrong name or PIN.");
    }
    delete db.fails[k];
    u.lastLogin = new Date().toISOString();
    setSess(u.name); logIt(u.name, "login", u.name, ""); save();
    return json(200, { user: publicUser(u) });
  });
  route("POST", /^\/api\/logout$/, null, () => { setSess(null); return new Response(null, { status: 204 }); });
  route("GET", /^\/api\/me$/, null, () => { const u = me(); return u ? json(200, { user: publicUser(u) }) : err(401, "auth", "Sign in first."); });

  route("PUT", /^\/api\/availability$/, ["admin", "server", "kitchen"], (r, u) => {
    const { key, unavailable } = r.body || {};
    if (!keyOk(key) || typeof unavailable !== "boolean") return err(400, "invalid", "Bad key or value.");
    // Kitchen: food and drinks only, no hookah flavors (the panel hides them; the server enforces it too).
    if (u.role === "kitchen" && (key.startsWith("flavor:") || key.startsWith("hookah/"))) return err(403, "forbidden", "Not allowed for your role.");
    const set = new Set(db.unavailable);
    unavailable ? set.add(key) : set.delete(key);
    db.unavailable = [...set];
    bump(); logIt(u.name, unavailable ? "out" : "back", key, ""); save();
    return json(200, { v: db.v });
  });

  route("PATCH", /^\/api\/items\/(.+)$/, ["admin"], (r, u, m) => {
    const key = decodeURIComponent(m[1]);
    if (!keyOk(key) || key.startsWith("flavor:")) return err(404, "not_found", "No such item.");
    const b = r.body || {};
    const o = db.items[key] || {};
    for (const [f, val] of Object.entries(b)) {
      if (!["name", "desc", "price", "img", "veg", "hidden"].includes(f)) return err(400, "invalid", "Unknown field " + f + ".");
      if (val === null) { delete o[f]; continue; }
      if ((f === "name" || f === "desc") && !isPair(val)) return err(400, "invalid", f + " must be [en, tr], 400 characters each.");
      if (f === "name" && !val[0].trim()) return err(400, "invalid", "Name can't be empty.");
      if (f === "price" && !/^\$\d{1,4}\.\d{2}$/.test(val)) return err(400, "invalid", "Price looks like $12.99.");
      if (f === "img" && !(typeof val === "string" && /^(?:r2:)?[a-z0-9-]{2,60}$/.test(val))) return err(400, "invalid", "Bad img.");
      if ((f === "veg" || f === "hidden") && typeof val !== "boolean") return err(400, "invalid", f + " must be true/false.");
      o[f] = val;
    }
    if (Object.keys(o).length) db.items[key] = o; else delete db.items[key];
    bump(); logIt(u.name, "item", key, Object.keys(b).join(", ")); save();
    return json(200, { v: db.v });
  });
  route("POST", /^\/api\/items$/, ["admin"], (r, u) => {
    const b = r.body || {};
    const sec = window.MENU.sections.find((s) => s.id === b.section);
    const group = sec && (typeof b.group === "string" && b.group.startsWith("g:") ? db.groups.find((g) => "g:" + g.id === b.group && g.section === b.section) : Number.isInteger(b.group) && sec.groups && sec.groups[b.group]);
    if (!group) return err(400, "invalid", "Pick a section and group.");
    if (!isPair(b.name) || !b.name[0].trim()) return err(400, "invalid", "Name is required in both languages.");
    if (b.desc !== null && b.desc !== undefined && !isPair(b.desc)) return err(400, "invalid", "Bad description.");
    if (!/^\$\d{1,4}\.\d{2}$/.test(b.price || "")) return err(400, "invalid", "Price looks like $12.99.");
    if (b.img && !/^(?:r2:)?[a-z0-9-]{2,60}$/.test(b.img)) return err(400, "invalid", "Bad img.");
    const id = (Date.now().toString(36).slice(-3) + (db.nextId++).toString(36)).slice(0, 8);
    db.added.push({ id, section: b.section, group: b.group, name: b.name, desc: b.desc || null, price: b.price, img: b.img || null, veg: !!b.veg });
    bump(); logIt(u.name, "item+", "new:" + id, b.name[0]); save();
    return json(201, { id, v: db.v });
  });
  route("DELETE", /^\/api\/items\/(.+)$/, ["admin"], (r, u, m) => {
    const key = decodeURIComponent(m[1]);
    if (!key.startsWith("new:")) return err(400, "invalid", "Base items can't be deleted; hide them instead.");
    const i = db.added.findIndex((a) => "new:" + a.id === key);
    if (i < 0) return err(404, "not_found", "No such item.");
    db.added.splice(i, 1); delete db.items[key]; db.unavailable = db.unavailable.filter((k) => k !== key);
    if (Array.isArray(db.featured)) db.featured = db.featured.filter((k) => k !== key);
    for (const sec of Object.keys(db.carousels)) db.carousels[sec] = db.carousels[sec].filter((k) => k !== key);
    bump(); logIt(u.name, "item-", key, ""); save();
    return json(200, { v: db.v });
  });

  const sectionOf = (id) => window.MENU.sections.find((s) => s.id === id);
  const validGroup = (sec, title, layout) => sectionOf(sec) && isPair(title) && title.every((s) => s.trim()) && ["rail", "grid", "list"].includes(layout) && (sec !== "hookah" || layout === "list");
  route("POST", /^\/api\/groups$/, ["admin"], (r, u) => {
    const { section, title, layout } = r.body || {};
    if (!validGroup(section, title, layout)) return err(400, "invalid", "Bad section, title or layout.");
    const id = "g" + (db.nextId++).toString(36) + Date.now().toString(36).slice(-4);
    db.groups.push({ id, section, title, layout }); bump(); logIt(u.name, "group.create", id, title[0]); save(); return json(201, { id, v: db.v });
  });
  route("PATCH", /^\/api\/groups\/(.+)$/, ["admin"], (r, u, m) => {
    const g = db.groups.find((g) => g.id === decodeURIComponent(m[1]));
    if (!g) return err(404, "not_found", "No such group.");
    const b = r.body || {}, title = b.title === undefined ? g.title : b.title, layout = b.layout === undefined ? g.layout : b.layout;
    if (Object.keys(b).some((k) => !["title", "layout"].includes(k)) || !validGroup(g.section, title, layout)) return err(400, "invalid", "Bad group fields.");
    Object.assign(g, { title, layout }); bump(); logIt(u.name, "group.update", g.id, ""); save(); return json(200, { v: db.v });
  });
  route("DELETE", /^\/api\/groups\/(.+)$/, ["admin"], (r, u, m) => {
    const id = decodeURIComponent(m[1]);
    if (!db.groups.some((g) => g.id === id)) return err(404, "not_found", "No such group.");
    if (db.added.some((a) => a.group === "g:" + id)) return err(409, "not_empty", "Remove the items first.");
    db.groups = db.groups.filter((g) => g.id !== id); bump(); logIt(u.name, "group.delete", id, ""); save(); return json(200, { v: db.v });
  });
  route("PUT", /^\/api\/sliders$/, ["admin"], (r, u) => {
    const b = r.body || {};
    const listOK = (a, sec) => a === null || (Array.isArray(a) && a.length <= 20 && new Set(a).size === a.length && a.every((k) => typeof k === "string" && k.length <= 500 && /^(?:[a-z][a-z0-9-]*\/[^\x00-\x1f/]+|new:[a-zA-Z0-9-]+)$/.test(k) && (!sec || k.startsWith(sec + "/") || db.added.some((a) => "new:" + a.id === k && a.section === sec))));
    if (!Object.keys(b).length || Object.keys(b).some((k) => !["featured", "carousels"].includes(k)) || (b.featured !== undefined && !listOK(b.featured))) return err(400, "invalid", "Bad slider list (maximum 20).");
    if (b.carousels !== undefined && (!b.carousels || typeof b.carousels !== "object" || Array.isArray(b.carousels) || !Object.entries(b.carousels).every(([id, a]) => sectionOf(id) && listOK(a, id)))) return err(400, "invalid", "Bad section slider.");
    if (b.featured !== undefined) db.featured = b.featured;
    for (const [id, a] of Object.entries(b.carousels || {})) { if (a === null) delete db.carousels[id]; else db.carousels[id] = a; }
    bump(); logIt(u.name, "sliders.update", "sliders", ""); save(); return json(200, { v: db.v });
  });

  route("PUT", /^\/api\/hookah$/, ["admin"], (r, u) => {
    const { classic, premium, bestsellers } = r.body || {};
    const okList = (a) => Array.isArray(a) && a.every((s) => typeof s === "string" && s.trim() && s.length <= 60);
    if (!okList(classic) || !premium || typeof premium !== "object" || Array.isArray(premium) || !Object.values(premium).every(okList) || !okList(bestsellers)) {
      return err(400, "invalid", "Send classic, premium and bestsellers as lists.");
    }
    const all = [...classic, ...Object.values(premium).flat()].map((s) => s.toLowerCase());
    if (new Set(all).size !== all.length) return err(400, "invalid", "A flavor can be in one place only.");
    if (!bestsellers.every((f) => all.includes(f.toLowerCase()))) return err(400, "invalid", "Best sellers must be in the lists.");
    db.hookah = { classic, premium, bestsellers };
    bump(); logIt(u.name, "hookah", "hookah", classic.length + " classic, " + all.length + " in all"); save();
    return json(200, { v: db.v });
  });

  route("PUT", /^\/api\/picks\/(.+)$/, ["admin", "server"], (r, u, m) => {
    const name = decodeURIComponent(m[1]);
    if (u.role === "server" && (!u.pickName || u.pickName !== name)) return err(403, "forbidden", "You can edit only your own pick.");
    const { title, picks, note } = r.body || {};
    if (!isPair(title) || !title[0].trim()) return err(400, "invalid", "Title needed in both languages.");
    if (note !== null && note !== undefined && !isPair(note)) return err(400, "invalid", "Bad note.");
    const flav = allFlavors();
    if (!Array.isArray(picks) || picks.length < 1 || picks.length > 3 ||
      !picks.every((b) => Array.isArray(b) && b.length >= 1 && b.length <= 3 && b.every((f) => flav.has(f)))) {
      return err(400, "invalid", "1–3 bowls, each with 1–3 flavors from the current list.");
    }
    if (!db.picks) db.picks = seedPicks();
    const entry = { name, title, picks, note: note || null };
    const i = db.picks.findIndex((p) => p.name === name);
    i >= 0 ? (db.picks[i] = entry) : db.picks.push(entry);
    bump(); logIt(u.name, "pick", name, picks.map((b) => b.join(" + ")).join(" | ")); save();
    return json(200, { v: db.v });
  });
  route("DELETE", /^\/api\/picks\/(.+)$/, ["admin"], (r, u, m) => {
    const name = decodeURIComponent(m[1]);
    if (!db.picks) db.picks = seedPicks();
    const i = db.picks.findIndex((p) => p.name === name);
    if (i < 0) return err(404, "not_found", "No such pick.");
    db.picks.splice(i, 1);
    bump(); logIt(u.name, "pick-", name, ""); save();
    return json(200, { v: db.v });
  });

  const activeAdmins = () => db.users.filter((x) => x.role === "admin" && x.active);
  const nameOk = (n) => typeof n === "string" && /^[\p{L}][\p{L} '.\-]{0,39}$/u.test(n.trim());
  const pinOk = (p) => typeof p === "string" && /^\d{4,12}$/.test(p);
  const listUsers = () => db.users.map((x) => ({ name: x.name, role: x.role, pickName: x.pickName || null, active: x.active, lastLogin: x.lastLogin }));
  route("GET", /^\/api\/users$/, ["admin"], () => json(200, listUsers()));
  route("POST", /^\/api\/users$/, ["admin"], (r, u) => {
    const { name, role, pin, pickName } = r.body || {};
    if (!nameOk(name)) return err(400, "invalid", "Name: 1–40 letters, spaces or - ' .");
    if (!["admin", "server", "kitchen"].includes(role)) return err(400, "invalid", "Bad role.");
    if (!pinOk(pin)) return err(400, "invalid", "PIN must be 4–12 digits.");
    if (db.users.some((x) => x.name.toLowerCase() === name.trim().toLowerCase())) return err(409, "exists", "That name is taken.");
    db.users.push({ name: name.trim(), role, pin, pickName: pickName ? String(pickName).trim().slice(0, 40) : null, active: true, lastLogin: null });
    logIt(u.name, "user+", name.trim(), role); save();
    return json(201, { user: { name: name.trim(), role } });
  });
  route("PATCH", /^\/api\/users\/(.+)$/, ["admin"], (r, u, m) => {
    const t = db.users.find((x) => x.name === decodeURIComponent(m[1]));
    if (!t) return err(404, "not_found", "No such user.");
    const b = r.body || {};
    if (b.role !== undefined && !["admin", "server", "kitchen"].includes(b.role)) return err(400, "invalid", "Bad role.");
    if (b.pin !== undefined && !pinOk(b.pin)) return err(400, "invalid", "PIN must be 4–12 digits.");
    if (b.active !== undefined && typeof b.active !== "boolean") return err(400, "invalid", "active must be true/false.");
    const losesAdmin = t.role === "admin" && t.active && ((b.role && b.role !== "admin") || b.active === false);
    if (losesAdmin && activeAdmins().length <= 1) return err(409, "last_admin", "At least one active admin must remain.");
    if (b.role !== undefined) t.role = b.role;
    if (b.pin !== undefined) t.pin = b.pin;
    if (b.pickName !== undefined) t.pickName = b.pickName ? String(b.pickName).trim().slice(0, 40) : null;
    if (b.active !== undefined) t.active = b.active;
    logIt(u.name, "user", t.name, Object.keys(b).map((k) => (k === "pin" ? "pin reset" : k + "=" + b[k])).join(", ")); save();
    return json(200, { user: { name: t.name, role: t.role, pickName: t.pickName, active: t.active } });
  });
  route("DELETE", /^\/api\/users\/(.+)$/, ["admin"], (r, u, m) => {
    const t = db.users.find((x) => x.name === decodeURIComponent(m[1]));
    if (!t) return err(404, "not_found", "No such user.");
    if (t.role === "admin" && t.active && activeAdmins().length <= 1) return err(409, "last_admin", "At least one active admin must remain.");
    db.users = db.users.filter((x) => x !== t);
    logIt(u.name, "user-", t.name, ""); save();
    return json(200, { ok: true });
  });

  route("POST", /^\/api\/upload$/, ["admin"], async (r, u) => {
    const fd = r.formData;
    const slug = fd && fd.get("slug");
    if (typeof slug !== "string" || !/^[a-z0-9-]{2,60}$/.test(slug)) return err(400, "invalid", "Bad slug.");
    const out = {};
    for (const [part, suffix] of [["lg", ""], ["md", "-md"], ["sm", "-sm"]]) {
      const f = fd.get(part);
      if (!f || typeof f === "string" || f.type !== "image/webp") return err(400, "invalid", part + " must be image/webp.");
      if (f.size > 1.5 * 1024 * 1024) return err(413, "too_large", part + " is over 1.5 MB.");
      out[suffix] = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(f); });
    }
    db.media[slug] = out;
    logIt(u.name, "upload", "r2:" + slug, ""); save();
    return json(201, { img: "r2:" + slug });
  });

  route("GET", /^\/api\/log$/, ["admin"], (r) => {
    const n = Math.max(1, Math.min(200, parseInt(new URL(r.url, location.origin).searchParams.get("limit"), 10) || 100));
    return json(200, db.log.slice(0, n));
  });

  // /media/<slug>[-md|-sm].webp → the stored data URL, as a real image response.
  async function media(path) {
    const m = path.match(/^\/media\/([a-z0-9-]+?)(-md|-sm)?\.webp$/);
    const rec = m && db.media[m[1]];
    const data = rec && rec[m[2] || ""];
    if (!data) return new Response("not found", { status: 404 });
    const blob = await (await realFetch(data)).blob();
    return new Response(blob, { status: 200, headers: { "Content-Type": "image/webp" } });
  }

  // ---- fetch wrapper -------------------------------------------------------------------------
  window.fetch = async function (input, init) {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    const path = url.pathname;
    if (!/^\/(api|media)\//.test(path)) return realFetch(input, init);
    init = init || {};
    const method = (init.method || (typeof input !== "string" && input.method) || "GET").toUpperCase();
    await sleep(latency);
    if (offline) throw new TypeError("Failed to fetch");
    if (path.startsWith("/media/")) return media(path);

    const headers = new Headers(init.headers || {});
    let body = null, formData = null;
    if (init.body instanceof FormData) formData = init.body;
    else if (typeof init.body === "string") { try { body = JSON.parse(init.body); } catch (_) { return err(400, "invalid", "Bad JSON."); } }

    const rt = routes.find((x) => x.method === method && x.re.test(path));
    if (!rt) return err(404, "not_found", "No such endpoint.");
    if (method !== "GET" && headers.get("X-Requested-With") !== "huqqa") return err(403, "csrf", "Missing X-Requested-With.");
    if (init.credentials !== "same-origin" && init.credentials !== "include") { /* cookies would not be sent */ }
    let user = null;
    if (rt.roles) {
      user = me();
      if (!user) return err(401, "auth", "Sign in first.");
      if (!rt.roles.includes(user.role)) return err(403, "forbidden", "Not allowed for your role.");
    }
    return rt.fn({ body, formData, url: url.href }, user, path.match(rt.re));
  };

  window.HQ_MOCK = {
    on: true,
    setOffline(v) { offline = !!v; },
    setLatency(ms) { latency = ms; },
    reset() { localStorage.removeItem(DB_KEY); localStorage.removeItem(SESS_KEY); location.reload(); },
    // <img> tags can't go through fetch(), so the panel asks here for photos uploaded in this session.
    mediaUrl(slug, size) { const r = db.media[slug]; return r && r[size ? "-" + size : ""] || null; },
  };
})();
