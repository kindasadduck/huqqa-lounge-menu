// Huqqa Lounge staff panel. Vanilla JS, no build. Contract: docs/api.md. Menu shown = menu-data.js + GET /api/state
// through HQ.applyOverlay (assets/js/overlay.js). With ?mock=1 the fake API in mock-api.js answers instead of the server.
//
// Choices made where docs/api.md is silent (listed in the report too):
//  - Hidden items are kept visible in the panel: `hidden` flags are stripped before applyOverlay and tracked separately.
//  - A new item's later edits are sent as PATCH /api/items/new:<id> (the overlay already reads items["new:<id>"]).
//  - A blank description on a base item that has one is sent as ["",""]; both blank and no base text = null.
//  - A text pair with only one language filled gets the same text in the other one (the contract needs both).
//  - Brands with no flavors are dropped from PUT /api/hookah (the menu would not show them anyway).
//  - Kitchen sees every section except Hookah (flavors/refills), as the plan says.
(async function () {
  "use strict";
  // Mock API with ?mock=1, and always on GitHub Pages (static demo, no server there).
  const MOCK = /[?&]mock=1\b/.test(location.search) || /\.github\.io$/.test(location.hostname);
  const HERE = (document.currentScript && document.currentScript.src) || location.href;
  if (MOCK) {
    await new Promise((res) => { const s = document.createElement("script"); s.src = new URL("mock-api.js?v=2", HERE).href; s.onload = s.onerror = res; document.head.appendChild(s); });
  }
  if (MOCK) document.body.insertAdjacentHTML("afterbegin", `<div class="demo">Demo data · mock API</div>`);
  const BASE = structuredClone(window.MENU);   // pristine base menu; window.MENU itself is never modified
  const HQ = window.HQ;
  const IMG_BASE = new URL("../img/", document.querySelector('script[src*="menu-data.js"]').src);

  // ======================================================================================== text
  const T = {
    staff: ["Staff", "Personel"], panel: ["Staff panel", "Personel paneli"],
    signIn: ["Sign in", "Giriş yap"], signingIn: ["Signing in…", "Giriş yapılıyor…"], signOut: ["Sign out", "Çıkış yap"],
    name: ["Name", "İsim"], pin: ["PIN", "PIN"], pinHelp: ["4 to 12 digits", "4–12 rakam"], showPin: ["Show PIN", "PIN'i göster"], hidePin: ["Hide PIN", "PIN'i gizle"],
    needName: ["Enter your name.", "İsmini yaz."], needPin: ["PIN is 4 to 12 digits.", "PIN 4–12 rakam olmalı."],
    bad_login: ["Name or PIN is wrong. Check both and try again.", "İsim veya PIN yanlış. İkisini de kontrol edip tekrar dene."],
    locked: ["Too many wrong tries for this name. Try again in {t}.", "Bu isimde çok fazla yanlış deneme oldu. {t} sonra tekrar dene."],
    sessionEnded: ["Your session ended. Sign in again.", "Oturumun bitti. Tekrar giriş yap."],
    network: ["Can't reach the server. Check the Wi-Fi, then try again.", "Sunucuya ulaşılamıyor. Wi-Fi'yi kontrol edip tekrar dene."],
    retry: ["Try again", "Tekrar dene"], dismiss: ["Dismiss", "Kapat"], close: ["Close", "Kapat"], cancel: ["Cancel", "Vazgeç"], back: ["Back", "Geri"],
    forbidden: ["Your role can't do this.", "Rolün bunu yapamaz."], csrf: ["The request was refused. Reload the page.", "İstek reddedildi. Sayfayı yenile."],
    notFound: ["That no longer exists. Refresh and look again.", "Bu artık yok. Yenileyip tekrar bak."], exists: ["That name is already taken.", "Bu isim zaten kullanımda."],
    tooLarge: ["The photo is too big for the server.", "Fotoğraf sunucu için çok büyük."], failed: ["Something went wrong ({c}).", "Bir şey ters gitti ({c})."],
    lastAdmin: ["This is the last active admin. Make someone else an admin first, then try again.", "Bu son aktif admin. Önce başka birini admin yap, sonra tekrar dene."],
    saved: ["Saved", "Kaydedildi"], refresh: ["Refresh", "Yenile"], loading: ["Loading…", "Yükleniyor…"], loadFail: ["Couldn't load the menu data.", "Menü verisi yüklenemedi."],
    // nav
    nStock: ["Stock", "Stok"], nPick: ["My pick", "Seçimim"], nPicks: ["Picks", "Seçimler"], nProducts: ["Items", "Ürünler"], nHookah: ["Hookah", "Nargile"], nMore: ["More", "Daha"],
    // stock
    stockT: ["Stock today", "Bugünün stoğu"], stockLede: ["Switch off what we've run out of. It stays off until someone switches it back on.", "Biten ürünü kapat. Biri tekrar açana kadar kapalı kalır."],
    search: ["Search", "Ara"], searchPh: ["Search items or flavors", "Ürün veya aroma ara"], clear: ["Clear search", "Aramayı temizle"],
    inStock: ["In stock", "Var"], outToday: ["Out today", "Bugün yok"], outOnly: ["Out today", "Bugün yok"], allSections: ["All sections", "Tüm bölümler"],
    noMatch: ["Nothing matches.", "Eşleşen yok."], noOut: ["Nothing is marked out today.", "Bugün yok işaretli bir şey yok."], featured: ["Featured", "Öne çıkanlar"],
    hiddenTag: ["Hidden on menu", "Menüde gizli"], bestTag: ["Best seller", "Çok satan"], classic: ["Classic", "Klasik"], premium: ["Premium", "Premium"],
    switchLabel: ["{n}: {s}", "{n}: {s}"],
    // pick
    pickT: ["My pick", "Benim seçimim"], picksT: ["Staff picks", "Ekibin seçimleri"], pickLede: ["Your favorite hookah bowls, shown on the menu.", "Menüde görünen favori nargile kaselerin."],
    pickNone: ["No pick name is set for your account. Ask an admin.", "Hesabında seçim adı yok. Bir admine söyle."],
    pickEdit: ["Edit", "Düzenle"], pickDelete: ["Remove pick", "Seçimi kaldır"], pickPreview: ["Preview", "Önizleme"], pickAlso: ["Also loves", "Bunları da sever"],
    titleEn: ["Title (English)", "Başlık (İngilizce)"], titleTr: ["Title (Turkish)", "Başlık (Türkçe)"], noteEn: ["Note (English)", "Not (İngilizce)"], noteTr: ["Note (Turkish)", "Not (Türkçe)"],
    optional: ["optional", "isteğe bağlı"], bowl: ["Bowl {n}", "Kase {n}"], addFlavor: ["Add flavor", "Aroma ekle"], addBowl: ["Add a bowl", "Kase ekle"], removeBowl: ["Remove bowl", "Kaseyi sil"],
    maxBowls: ["Up to 3 bowls", "En çok 3 kase"], maxFlavors: ["Up to 3 flavors per bowl", "Kasede en çok 3 aroma"], pickFlavors: ["Pick flavors", "Aroma seç"], done: ["Done", "Tamam"],
    savePick: ["Save my pick", "Seçimimi kaydet"], saveThisPick: ["Save pick", "Seçimi kaydet"], bowlEmpty: ["Every bowl needs 1 to 3 flavors.", "Her kasede 1–3 aroma olmalı."], titleNeed: ["Give the pick a title.", "Seçime bir başlık yaz."],
    stale: ["no longer on the list", "listede artık yok"], removeFlavor: ["Remove {f}", "{f} sil"], noteBoth: ["If you fill only one language, the other copies it.", "Tek dil doldurursan diğeri onu kopyalar."],
    pickOf: ["{n}'s pick", "{n} seçimi"], noPicks: ["No picks yet.", "Henüz seçim yok."], confirmPick: ["Remove {n}'s pick from the menu?", "{n} seçimi menüden kaldırılsın mı?"],
    // products
    prodT: ["Items", "Ürünler"], prodLede: ["Edit names, prices and photos. Changes show on the menu within seconds.", "Ad, fiyat ve fotoğrafları düzenle. Değişiklik menüde birkaç saniyede görünür."],
    addItem: ["Add item", "Ürün ekle"], newItem: ["New item", "Yeni ürün"], editItem: ["Edit item", "Ürünü düzenle"], section: ["Section", "Bölüm"], group: ["Group", "Grup"],
    nameEn: ["Name (English)", "Ad (İngilizce)"], nameTr: ["Name (Turkish)", "Ad (Türkçe)"], descEn: ["Description (English)", "Açıklama (İngilizce)"], descTr: ["Description (Turkish)", "Açıklama (Türkçe)"],
    price: ["Price", "Fiyat"], priceHelp: ["Like $12.99", "Örnek: $12.99"], priceBad: ["Price looks like $12.99.", "Fiyat $12.99 biçiminde olmalı."], nameNeed: ["Enter the English name.", "İngilizce adı yaz."],
    veg: ["Vegetarian (V)", "Vejetaryen (V)"], vegHelp: ["Shows a small V on the menu", "Menüde küçük V işareti çıkar"], hide: ["Hide from menu", "Menüden gizle"], hideHelp: ["The item disappears from the menu. Nothing is deleted.", "Ürün menüden kalkar. Hiçbir şey silinmez."],
    on: ["On", "Açık"], off: ["Off", "Kapalı"], baseIs: ["Original:", "Orijinal:"], toBase: ["Back to original", "Temele dön"], toBasePhoto: ["Use original photo", "Orijinal fotoğrafa dön"], noBase: ["(none)", "(yok)"],
    saveChanges: ["Save changes", "Değişiklikleri kaydet"], noChanges: ["No changes to save.", "Kaydedilecek değişiklik yok."], createItem: ["Create item", "Ürünü oluştur"],
    deleteItem: ["Delete this item", "Bu ürünü sil"], confirmDelItem: ["Delete “{n}” for good? It's gone from the menu.", "“{n}” kalıcı silinsin mi? Menüden kalkar."],
    yesDelete: ["Yes, delete", "Evet, sil"], edited: ["Edited", "Düzenlendi"], added: ["Added", "Eklendi"], itemsCount: ["{n} items", "{n} ürün"], outCount: ["{n} out", "{n} yok"],
    pickSectionGroup: ["Pick a section and group.", "Bölüm ve grup seç."], baseDelNote: ["Menu items from the original list can't be deleted. Switch on “Hide from menu” instead.", "Orijinal listedeki ürünler silinemez. Bunun yerine “Menüden gizle”yi aç."],
    // groups / sliders
    addGroup: ["Add group", "Grup ekle"], newGroup: ["+ New group", "+ Yeni grup"], editGroup: ["Edit group", "Grubu düzenle"], deleteGroup: ["Delete empty group", "Boş grubu sil"],
    layout: ["Layout", "Düzen"], layout_rail: ["Scrollable (slider)", "Kaydırmalı (slider)"], layout_grid: ["Photo cards", "Fotoğraflı kartlar"], layout_list: ["List", "Liste"],
    groupNotEmpty: ["Remove the items in this group before deleting it (including hidden items).", "Silmeden önce gruptaki ürünleri (gizli ürünler dahil) sil."],
    sliders: ["Sliders", "Slider’lar"], bestSellers: ["Best sellers", "Çok satanlar"], sliderLede: ["Choose up to 20 items, in the order they appear. Save to publish.", "En çok 20 ürün seç, görünme sırasını düzenle. Yayınlamak için kaydet."],
    sliderWarn: ["Items without a photo and hidden items are skipped on the menu.", "Fotoğrafı olmayan ve gizli ürünler menüdeki slider’da görünmez."],
    sliderLimit: ["Up to 20 items", "En çok 20 ürün"], showIn: ["Show in {n}", "{n} içinde göster"], normalItem: ["Always a normal menu item. Optionally add it to a slider too.", "Her zaman normal bir menü ürünü. İstersen ayrıca slider’a ekle."],
    up: ["Move up", "Yukarı taşı"], down: ["Move down", "Aşağı taşı"], remove: ["Remove", "Çıkar"], disableSlider: ["Turn slider off", "Slider’ı kapat"], sliderOff: ["Slider is off / empty.", "Slider kapalı / boş."], resetPending: ["Original list will be restored when you save.", "Kaydedince temel listeye dönülecek."],
    // photo
    photo: ["Photo", "Fotoğraf"], noPhoto: ["No photo", "Fotoğraf yok"], choosePhoto: ["Choose photo", "Fotoğraf seç"], changePhoto: ["Change photo", "Fotoğrafı değiştir"], processing: ["Preparing photo…", "Fotoğraf hazırlanıyor…"],
    photoSizes: ["Three sizes are made on your phone before upload.", "Üç boyut yüklemeden önce telefonda hazırlanır."], useThis: ["Use this photo", "Bu fotoğrafı kullan"], photoLg: ["Large", "Büyük"], photoMd: ["Medium", "Orta"], photoSm: ["Small", "Küçük"],
    photoFail: ["Couldn't read that image. Try another photo.", "Bu görsel okunamadı. Başka bir fotoğraf dene."], webpFail: ["This browser can't make WebP photos. Use a newer browser.", "Bu tarayıcı WebP üretemiyor. Daha yeni bir tarayıcı kullan."],
    uploading: ["Uploading…", "Yükleniyor…"],
    // hookah
    hkT: ["Hookah flavors", "Nargile aromaları"], hkLede: ["Edit the lists, then save once. Each flavor lives in one place.", "Listeleri düzenle, sonra bir kez kaydet. Her aroma tek yerde durur."],
    hkClassic: ["Classic · Al Fakher", "Klasik · Al Fakher"], hkPremium: ["Premium", "Premium"], hkAdd: ["Add", "Ekle"], hkAddPh: ["New flavor name", "Yeni aroma adı"], hkNewBrand: ["New brand", "Yeni marka"],
    hkNewBrandPh: ["Brand name", "Marka adı"], hkBest: ["Best seller", "Çok satan"], hkBestOn: ["Best seller: on", "Çok satan: açık"], hkBestOff: ["Best seller: off", "Çok satan: kapalı"], hkMove: ["Move or remove {f}", "{f} için taşı veya sil"],
    here: ["Here now", "Şu an burada"], hkMoveTo: ["Move to", "Şuraya taşı"], hkRemove: ["Remove flavor", "Aromayı sil"], hkUnsaved: ["Unsaved changes", "Kaydedilmemiş değişiklik"], hkSave: ["Save lists", "Listeleri kaydet"], hkDiscard: ["Discard", "Vazgeç"],
    hkDup: ["“{f}” is already in {w}.", "“{f}” zaten {w} içinde."], hkEmpty: ["No flavors yet.", "Henüz aroma yok."], hkUsedInPick: ["Used in {n}'s pick.", "{n} seçiminde kullanılıyor."],
    hkMoved: ["{f} moved to {w}", "{f}, {w} içine taşındı"], hkBrandExists: ["That brand is already there.", "Bu marka zaten var."], hkBrandPick: ["New brand name…", "Yeni marka adı…"], hkBrandAdded: ["Brand added", "Marka eklendi"],
    // users
    usersT: ["Staff & sign-in", "Personel ve giriş"], usersLede: ["Give a name and a PIN, then choose a role: Admin, Server or Kitchen.", "İsim ve PIN ver, rol seç: Admin, Garson veya Mutfak."], addUser: ["Add staff", "Personel ekle"], role: ["Role", "Rol"],
    nameLogin: ["Name (used to sign in)", "İsim (giriş adı)"], noPickYet: ["No pick yet", "Henüz seçim yok"], makePick: ["Create pick", "Seçim oluştur"], makePickHelp: ["{n} has no staff pick yet.", "{n} için henüz seçim yok."],
    pickNameSrv: ["Pick name", "Seçim adı"], pickNameSrvHelp: ["Shown on the staff pick card. Empty = same as the name.", "Staff pick kartında görünür. Boşsa isimle aynı."],
    renameHint: ["A name can't be changed. To rename, delete the person and add them again.", "İsim değiştirilemez. Değiştirmek için kişiyi silip yeniden ekle."],
    addPick: ["Add pick", "Seçim ekle"], addPickLede: ["Type a name, or choose someone from the staff list.", "Bir isim yaz ya da personel listesinden seç."], pickNameField: ["Name on the pick", "Seçimdeki isim"], pickStart: ["Continue", "Devam"],
    fromStaff: ["From staff", "Personelden"], noUserTag: ["No user", "Kullanıcısı yok"], noUserHelp: ["No staff account uses this name. Remove the pick if that person has left.", "Bu isimde personel hesabı yok. Kişi ayrıldıysa seçimi kaldır."],
    pickExists: ["{n} already has a pick. Edit it instead.", "{n} için seçim zaten var. Onu düzenle."], pickRemoved: ["Pick removed", "Seçim kaldırıldı"], pickNameBad: ["Enter a name (letters and spaces).", "Bir isim yaz (harf ve boşluk)."], staffAdded: ["{n} added", "{n} eklendi"],
    flavorsT: ["Flavors", "Aromalar"], refillsT: ["Refills", "Kafalar"], hkItemsCount: ["{n} flavors · {m} refills", "{n} aroma · {m} kafa"], flavorsLede: ["Edit the lists, then save once.", "Listeleri düzenle, sonra bir kez kaydet."],
    admin: ["Admin", "Admin"], server: ["Server", "Garson"], kitchen: ["Kitchen", "Mutfak"], pickName: ["Pick name", "Seçim adı"], pickNameHelp: ["Name on the staff pick card. Leave empty if none.", "Staff pick kartındaki ad. Yoksa boş bırak."],
    active: ["Active", "Aktif"], inactive: ["Inactive", "Pasif"], lastLogin: ["Last sign-in", "Son giriş"], never: ["Never", "Hiç"], you: ["you", "sen"],
    resetPin: ["Reset PIN", "PIN'i sıfırla"], newPin: ["New PIN", "Yeni PIN"], setPin: ["Set new PIN", "Yeni PIN'i kaydet"], pinSet: ["PIN changed", "PIN değişti"],
    deactivate: ["Deactivate", "Pasifleştir"], activate: ["Activate", "Aktifleştir"], deleteUser: ["Delete user", "Kullanıcıyı sil"], confirmDelUser: ["Delete {n}? Their sessions end too.", "{n} silinsin mi? Oturumları da kapanır."],
    createUser: ["Create user", "Kullanıcıyı oluştur"], userCreated: ["User added", "Kullanıcı eklendi"], savePickName: ["Save pick name", "Seçim adını kaydet"], changeRole: ["Role", "Rol"],
    selfWarn: ["This is your own account. If you lose admin rights you'll be signed out of admin screens.", "Bu senin hesabın. Admin yetkini kaybedersen admin ekranlarından çıkarsın."],
    // more / log
    moreT: ["More", "Daha fazla"], signedAs: ["Signed in as {n}", "{n} olarak giriş yapıldı"], logT: ["Activity log", "İşlem kaydı"], logLede: ["The last 100 changes.", "Son 100 değişiklik."], logEmpty: ["No activity yet.", "Henüz kayıt yok."],
    demo: ["Demo data · mock API", "Demo veri · sahte API"], demoAccounts: ["Demo accounts — tap one to fill in:", "Demo hesaplar — doldurmak için dokunun:"], needAdmin: ["Admins only.", "Yalnız adminler."],
  };
  const ACTION = {
    login: ["Signed in", "Giriş yaptı"], out: ["Marked out", "Bugün yok işaretledi"], back: ["Back in stock", "Tekrar var yaptı"], item: ["Edited item", "Ürünü düzenledi"], "item+": ["Added item", "Ürün ekledi"], "item-": ["Deleted item", "Ürün sildi"],
    "group.create": ["Added group", "Grup ekledi"], "group.update": ["Edited group", "Grubu düzenledi"], "group.delete": ["Deleted group", "Grup sildi"], "sliders.update": ["Edited sliders", "Slider’ları düzenledi"],
    hookah: ["Hookah lists", "Nargile listeleri"], pick: ["Staff pick", "Staff pick"], "pick-": ["Removed pick", "Seçimi kaldırdı"], user: ["Edited user", "Kullanıcıyı düzenledi"], "user+": ["Added user", "Kullanıcı ekledi"], "user-": ["Deleted user", "Kullanıcı sildi"], upload: ["Uploaded photo", "Fotoğraf yükledi"],
  };

  // ======================================================================================== helpers
  let lang = "en";
  try { if (localStorage.getItem("huqqa-lang") === "tr") lang = "tr"; } catch (_) {}
  const li = () => (lang === "tr" ? 1 : 0);
  const t = (k, v) => { const e = T[k]; let s = e ? e[li()] : k; if (v) for (const x in v) s = s.split("{" + x + "}").join(v[x]); return s; };
  const L = (pair) => (Array.isArray(pair) ? pair[li()] || pair[0] || "" : pair || "");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fold = (s) => String(s || "").toLowerCase().replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const P = {
    check: "M5 12.5l4.5 4.5L19 7", x: "M6 6l12 12M18 6L6 18", plus: "M12 5v14M5 12h14", search: "M16 16l4.5 4.5M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z",
    right: "M9 5l7 7-7 7", left: "M15 5l-7 7 7 7", logout: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9", refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
    stock: "M4 7l2 2 3-3M12 8h8M4 16l2 2 3-3M12 17h8", star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z", tag: "M3 12V4h8l10 10-8 8zM7.5 7.5h.01",
    flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z",
    more: "M5 12h.01M12 12h.01M19 12h.01", users: "M16 20v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V20M10 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM20 20v-1.5a4 4 0 0 0-3-3.9", log: "M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h3",
    image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01", camera: "M4 8h3l1.5-2h7L17 8h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z", trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
    alert: "M12 3l10 18H2zM12 10v5M12 18h.01", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", eyeoff: "M3 3l18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 7.7C3.7 9.5 2 12 2 12s4 6 10 6c1.4 0 2.7-.3 3.8-.8",
    edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4", move: "M7 7h13l-3-3M17 17H4l3 3", chevd: "M6 9l6 6 6-6", key: "M14 10a4 4 0 1 0-3.9 4L20 20v-3h-3v-3h-3", mail: "M4 6h16v12H4zM4 7l8 6 8-6", info: "M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", sun: "M12 12m-0 0",
  };
  const ico = (n, cls) => `<svg viewBox="0 0 24 24" aria-hidden="true"${cls ? ` class="${cls}"` : ""}><path d="${P[n]}"/></svg>`;
  const FLAME = `<span class="flame" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${P.flame}"/></svg></span>`;

  // ======================================================================================== API
  class ApiError extends Error {
    constructor(code, status, message, retryAfter) { super(message || code); this.code = code; this.status = status; this.retryAfter = retryAfter; }
  }
  async function api(method, path, body) {
    const init = { method, credentials: "same-origin", headers: {} };
    if (method !== "GET") init.headers["X-Requested-With"] = "huqqa";
    if (method === "GET") init.cache = "no-store";
    if (body instanceof FormData) init.body = body;
    else if (body !== undefined) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
    let res;
    try { res = await fetch(path, init); } catch (_) { throw new ApiError("network", 0, "network"); }
    if (res.status === 204) return null;
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const e = new ApiError((data && data.error) || "http_" + res.status, res.status, data && data.message, data && data.retryAfter);
      if (res.status === 401 && e.code === "auth") sessionLost();
      throw e;
    }
    return data;
  }
  function errText(e) {
    switch (e.code) {
      case "network": return t("network");
      case "bad_login": return t("bad_login");
      case "locked": return t("locked", { t: fmtWait(e.retryAfter) });
      case "auth": return t("sessionEnded");
      case "forbidden": return t("forbidden");
      case "csrf": return t("csrf");
      case "last_admin": return t("lastAdmin");
      case "not_found": return t("notFound");
      case "exists": return t("exists");
      case "too_large": return t("tooLarge");
      case "not_empty": return t("groupNotEmpty");
      case "slider_limit": return t("sliderLimit");
      case "invalid": return lang === "en" && e.message ? e.message : t("failed", { c: e.code }) + (e.message ? " " + e.message : "");
      default: return e.message && e.message !== e.code ? e.message : t("failed", { c: e.code });
    }
  }
  function fmtWait(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    const m = Math.floor(sec / 60), s = sec % 60;
    return lang === "tr" ? (m ? m + " dk " : "") + s + " sn" : (m ? m + " min " : "") + s + " s";
  }

  // ======================================================================================== state
  const S = {
    user: null, state: null, menu: null, items: [], hiddenSet: new Set(), baseIdx: new Map(), loadErr: null, loadedAt: 0,
    q: "", outOnly: false, tab: null, openSecs: new Set(), pq: "",
    users: null, usersErr: null, log: null, logErr: null, pk: null, it: null, nw: null, photo: null, hk: null, routeKey: "", refreshing: false,
  };
  const ROLE_ROUTES = { admin: ["stock", "pick", "products", "hookah", "more", "users", "log"], server: ["stock", "pick"], kitchen: ["stock"] };

  // Menu = base + overlay. `hidden` flags are removed before the overlay so hidden items stay visible here.
  function rebuild() {
    const st = clone(S.state);
    S.hiddenSet = new Set();
    for (const [k, o] of Object.entries(st.items || {})) { if (o && o.hidden) S.hiddenSet.add(k); if (o) delete o.hidden; }
    const menu = structuredClone(BASE);
    HQ.applyOverlay(menu, st);
    S.menu = menu;
    const rows = [];
    const keyOf = (sec, it) => (it._added ? "new:" + it._added : HQ.itemKey(sec.id, it));
    for (const sec of menu.sections) {
      if (sec.hero && Array.isArray(sec.hero.tiles)) sec.hero.tiles.forEach((it) => rows.push({ key: keyOf(sec, it), item: it, sec, gi: -1, group: [T.featured[0], T.featured[1]] }));
      (sec.groups || []).forEach((g, gi) => (g.items || []).forEach((it) => rows.push({ key: keyOf(sec, it), item: it, sec, gi, group: g.title })));
    }
    for (const r of rows) { r.added = !!r.item._added; r.hidden = S.hiddenSet.has(r.key); r.edited = !!(st.items && st.items[r.key] && Object.keys(st.items[r.key]).length) || S.hiddenSet.has(r.key); }
    S.items = rows;
    S.baseIdx = new Map();
    HQ.walkItems(BASE, (it, key) => { if (!S.baseIdx.has(key)) S.baseIdx.set(key, it); });
  }
  async function loadState() {
    S.state = await api("GET", "/api/state");
    S.loadedAt = Date.now(); S.loadErr = null;
    rebuild();
  }
  const hookahSec = () => S.menu.sections.find((s) => s.id === "hookah");
  const out = () => new Set(S.state.unavailable || []);
  const sectionsFor = (u) => S.menu.sections.filter((s) => (u.role === "kitchen" ? s.id !== "hookah" : true));

  // ---------- photo urls
  function imgUrl(img, size) {
    if (!img || typeof img !== "string") return null;
    if (img.startsWith("r2:")) {
      const slug = img.slice(3);
      const m = window.HQ_MOCK && window.HQ_MOCK.mediaUrl && window.HQ_MOCK.mediaUrl(slug, size);
      return m || `/media/${slug}${size ? "-" + size : ""}.webp`;
    }
    return new URL(`${img}${size ? "-" + size : ""}.webp`, IMG_BASE).href;
  }

  // ======================================================================================== UI infra
  function toast(msg) {
    const box = $("#toasts");
    const el = document.createElement("div");
    el.className = "toast"; el.innerHTML = ico("check") + `<span>${esc(msg)}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add("leave"); setTimeout(() => el.remove(), 600); }, 2200);
  }
  let errEl = null, lastRun = null;   // lastRun = the user action in progress; "Try again" repeats it whole
  function errToast(msg, retry) {
    clearErr();
    const box = $("#toasts");
    errEl = document.createElement("div");
    errEl.className = "toast err"; errEl.setAttribute("role", "alert");
    errEl.innerHTML = `${ico("alert")}<div class="b-t">${esc(msg)}</div>
      <div class="err-btns">${retry ? `<button type="button" class="btn sm primary" data-act="err-retry">${esc(t("retry"))}</button>` : ""}<button type="button" class="btn sm quiet" data-act="err-dismiss">${esc(t("dismiss"))}</button></div>`;
    errEl._retry = retry;
    box.appendChild(errEl);
  }
  function clearErr() { if (errEl) { errEl.remove(); errEl = null; } }

  function setBusy(el, on) {
    if (!el || !el.isConnected) return;
    if (on) { el.setAttribute("aria-busy", "true"); if (el.tagName === "BUTTON" && !el.matches(".sw")) el.disabled = true; }
    else { el.removeAttribute("aria-busy"); if (el.tagName === "BUTTON") el.disabled = false; }
  }
  // Runs one change: locks the pressed button, shows a clear error (with Try again when it was the network) otherwise.
  // Returns { ok, value, error }. `fn` must be safe to run again.
  async function act(el, fn, opts) {
    opts = opts || {};
    if (el && el.getAttribute("aria-busy") === "true") return { ok: false, busy: true };
    const redo = lastRun;
    setBusy(el, true);
    clearErr();
    try {
      const value = await fn();
      return { ok: true, value };
    } catch (e) {
      if (!(e instanceof ApiError)) { console.error(e); e = new ApiError("client", 0, String(e && e.message || e)); }
      if (e.code === "auth") return { ok: false, error: e };
      if (opts.inline) opts.inline(errText(e), e);
      else errToast(errText(e), e.code === "network" ? redo : null);
      return { ok: false, error: e };
    } finally { setBusy(el, false); }
  }

  // ---------- sheets
  let sheetFocus = null;
  function openSheet(title, html, onMount) {
    const root = $("#sheetRoot");
    if ($(".sheet", root)) {   // already open: swap the content, no new slide-in
      $("#sheetT").textContent = title; $("#sheetBody").innerHTML = html; if (onMount) onMount($("#sheetBody"));
      const f = $("#sheetBody input, #sheetBody button"); if (f && !matchMedia("(pointer: coarse)").matches) f.focus();
      return;
    }
    sheetFocus = document.activeElement;
    root.innerHTML = `<div class="scrim" data-act="sheet-close"></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetT"><div class="sheet-in">
        <div class="sheet-h"><h2 id="sheetT">${esc(title)}</h2><button type="button" class="icon-btn" data-act="sheet-close" aria-label="${esc(t("close"))}">${ico("x")}</button></div>
        <div id="sheetBody">${html}</div></div></div>`;
    $("#app").setAttribute("inert", ""); document.documentElement.classList.add("locked");
    requestAnimationFrame(() => requestAnimationFrame(() => { const scrim = $(".scrim", root), sheet = $(".sheet", root); if (scrim && sheet) { scrim.classList.add("on"); sheet.classList.add("on"); } }));
    if (onMount) onMount($("#sheetBody"));
    setTimeout(() => { const f = $("#sheetBody input, #sheetBody button, #sheetBody select"); const first = $("#sheetBody [autofocus]") || f; if (first && !matchMedia("(pointer: coarse)").matches) first.focus(); else { const close = $(".sheet-h .icon-btn", root); if (close) close.focus(); } }, 80);
  }
  function closeSheet(instant) {
    const root = $("#sheetRoot");
    if (!root.firstChild) return;
    $("#app").removeAttribute("inert"); document.documentElement.classList.remove("locked");
    const done = () => { root.innerHTML = ""; };
    if (instant) done();
    else { $(".scrim", root).classList.remove("on"); $(".sheet", root).classList.remove("on"); setTimeout(done, 560); }
    if (sheetFocus && sheetFocus.isConnected) sheetFocus.focus();
    sheetFocus = null; sheetState = null;
  }
  let sheetState = null;
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#sheetRoot").firstChild) closeSheet(); });

  // ======================================================================================== routing
  function parseRoute() {
    const h = decodeURIComponent((location.hash || "").replace(/^#\/?/, "")) .split("/");
    let name = h[0] || "stock";
    const rest = location.hash.replace(/^#\/?/, "").split("/").slice(1).map((x) => decodeURIComponent(x));
    if (!(ROLE_ROUTES[S.user.role] || []).includes(name)) name = "stock";
    return { name, arg: rest[0] || null };
  }
  const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
  window.addEventListener("hashchange", () => { if (S.user) render(true); });

  // ======================================================================================== shell
  function mountShell() {
    $("#app").innerHTML = `<header class="bar"><div class="wrap bar-row">
        <div class="brand"><span class="brand-name">Huqqa Lounge</span><span class="brand-sub" id="brandSub"></span></div>
        <div class="bar-actions">
          <div class="lang" role="group" aria-label="Language"><button type="button" data-lang="en">EN</button><button type="button" data-lang="tr">TR</button></div>
          <button type="button" class="icon-btn" data-act="refresh" id="refreshBtn"></button>
          <button type="button" class="icon-btn" data-act="logout" id="logoutBtn"></button>
        </div></div></header>
      <main id="main"></main><nav class="nav" id="nav" aria-label="Sections"></nav>`;
  }
  function updateChrome(route) {
    document.documentElement.lang = lang;
    $("#brandSub").textContent = `${S.user.name} · ${t(S.user.role)}`;
    $("#refreshBtn").innerHTML = ico("refresh", S.refreshing ? "spin" : ""); $("#refreshBtn").setAttribute("aria-label", t("refresh"));
    $("#logoutBtn").innerHTML = ico("logout"); $("#logoutBtn").setAttribute("aria-label", t("signOut"));
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    const items = S.user.role === "admin"
      ? [["stock", "stock", "nStock"], ["pick", "star", "nPicks"], ["products", "tag", "nProducts"], ["hookah", "flame", "nHookah"], ["more", "more", "nMore"]]
      : S.user.role === "server" ? [["stock", "stock", "nStock"], ["pick", "star", "nPick"]] : [];
    const nav = $("#nav");
    nav.hidden = !items.length; $("#main").classList.toggle("no-nav", !items.length); document.body.classList.toggle("no-nav-page", !items.length);
    const cur = ["users", "log"].includes(route.name) ? "more" : route.name;
    nav.innerHTML = `<div class="nav-row">${items.map(([r, ic, lab]) => `<a href="#/${r}" ${cur === r ? 'aria-current="page"' : ""}>${ico(ic, ic === "more" ? "dots" : "")}<span>${esc(t(lab))}${(r === "hookah" || r === "products") && hkDirty() ? `<span class="sr"> (${esc(t("hkUnsaved"))})</span> <span aria-hidden="true" style="color:var(--gold)">●</span>` : ""}</span></a>`).join("")}</div>`;
  }

  function render(routeChanged) {
    if (!S.user) { renderLogin(); return; }
    if (!$("#main")) mountShell();
    const route = parseRoute();
    const key = route.name + "/" + (route.arg || "");
    const changed = routeChanged || key !== S.routeKey;
    S.routeKey = key;
    if (changed) closeSheet(true);
    updateChrome(route);
    const main = $("#main");
    const y = window.scrollY;
    if (S.loadErr && !S.state) { main.innerHTML = `<div class="screen">${loadErrHtml()}</div>`; return; }
    if (!S.state) { main.innerHTML = `<div class="loading">${ico("refresh", "spin")}<span>${esc(t("loading"))}</span></div>`; return; }
    const html = SCREENS[route.name](route);
    main.innerHTML = `<div class="${changed ? "screen" : ""}">${html}</div>`;
    if (changed) window.scrollTo(0, 0); else window.scrollTo(0, y);
    const after = AFTER[route.name]; if (after) after(route, changed);
  }
  function loadErrHtml() {
    return `<div class="banner">${ico("alert")}<div class="b-t"><b>${esc(t("loadFail"))}</b>${esc(S.loadErr || "")}</div><button type="button" class="btn sm primary" data-act="reload-state">${esc(t("retry"))}</button></div>`;
  }
  const SCREENS = {}, AFTER = {};

  // ======================================================================================== login
  let lockTimer = null, lockUntil = 0, loginMsg = "";
  function renderLogin(msg) {
    clearInterval(lockTimer);
    if (msg !== undefined) loginMsg = msg;
    document.body.classList.remove("no-nav-page");
    $("#app").innerHTML = `<div class="login-top lang" role="group" aria-label="Language" style="position:absolute"><button type="button" data-lang="en">EN</button><button type="button" data-lang="tr">TR</button></div>
      <div class="login"><div class="brand"><span class="brand-name">Huqqa Lounge</span><span class="brand-sub">${esc(t("panel"))}</span></div>
        <form class="card login-card" id="loginForm" novalidate>
          <h1 class="title" style="font-size:24px">${esc(t("signIn"))}</h1>
          <label class="field"><span>${esc(t("name"))}</span><input type="text" id="lgName" name="username" autocomplete="username" autocapitalize="words" spellcheck="false" maxlength="40" required></label>
          <label class="field"><span>${esc(t("pin"))} <em>· ${esc(t("pinHelp"))}</em></span>
            <div class="pw"><input type="password" id="lgPin" name="password" inputmode="numeric" pattern="[0-9]*" autocomplete="current-password" maxlength="12" required>
            <button type="button" class="icon-btn" data-act="pin-eye" aria-label="${esc(t("showPin"))}" aria-pressed="false">${ico("eye")}</button></div></label>
          <div id="lgErr" role="alert">${loginMsg ? `<p class="err-text">${ico("alert")}<span>${esc(loginMsg)}</span></p>` : ""}</div>
          <div class="btn-row"><button type="submit" class="btn primary" id="lgGo">${esc(t("signIn"))}</button></div>
        </form>${MOCK ? demoAccounts() : ""}</div>`;
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    if (MOCK) {
      $$("[data-demo-user]").forEach((b) => b.addEventListener("click", () => {
        $("#lgName").value = b.dataset.demoUser; $("#lgPin").value = b.dataset.demoPin;
      }));
      const preset = document.body.dataset.demoRole && $(`[data-demo-user][data-demo-role="${document.body.dataset.demoRole}"]`);
      if (preset) preset.click(); // demo: /admin opens as Can, /server as Eylül
    }
    document.documentElement.lang = lang;
    if (!MOCK) try { const last = localStorage.getItem("hq-last-name"); if (last) $("#lgName").value = last; } catch (_) {}
  }
  // Demo only (mock API): tap an account to fill the form. These PINs exist only in mock-api.js.
  const DEMO_USERS = [["Can", "1111", "admin"], ["Eylül", "2222", "server"], ["Mutfak", "3333", "kitchen"]];
  function demoAccounts() {
    return `<div class="card demo-accounts"><p class="imeta">${esc(t("demoAccounts"))}</p><div class="btn-row">${DEMO_USERS.map(([n, p, r]) =>
      `<button type="button" class="btn sm" data-demo-user="${esc(n)}" data-demo-pin="${p}" data-demo-role="${r}">${esc(n)} · ${esc(t(r))} · ${p}</button>`).join("")}</div></div>`;
  }
  function loginError(text) { $("#lgErr").innerHTML = text ? `<p class="err-text">${ico("alert")}<span>${esc(text)}</span></p>` : ""; loginMsg = text || ""; }
  async function doLogin(form) {
    const name = $("#lgName").value.trim(), pin = $("#lgPin").value.trim();
    if (!name) { loginError(t("needName")); $("#lgName").focus(); return; }
    if (!/^\d{4,12}$/.test(pin)) { loginError(t("needPin")); $("#lgPin").focus(); return; }
    const btn = $("#lgGo");
    btn.textContent = t("signingIn");
    const r = await act(btn, async () => (await api("POST", "/api/login", { name, pin })).user, { inline: (msg, e) => lockOrError(msg, e) });
    btn.textContent = t("signIn");
    if (Date.now() < lockUntil) btn.disabled = true;   // act() re-enables its button; keep the lock
    if (!r.ok) { $("#lgPin").value = ""; return; }
    try { localStorage.setItem("hq-last-name", name); } catch (_) {}
    S.user = r.value; loginMsg = "";
    await enter();
  }
  function lockOrError(msg, e) {
    clearInterval(lockTimer);
    if (e.code === "locked" && e.retryAfter) {
      const until = lockUntil = Date.now() + e.retryAfter * 1000;
      const btn = $("#lgGo"); btn.disabled = true;
      const tick = () => {
        const left = Math.ceil((until - Date.now()) / 1000);
        if (left <= 0) { clearInterval(lockTimer); loginError(""); if ($("#lgGo")) $("#lgGo").disabled = false; return; }
        loginError(t("locked", { t: fmtWait(left) }));
      };
      tick(); lockTimer = setInterval(tick, 1000);
    } else loginError(msg);
  }
  function sessionLost() {
    if (!S.user) return;
    S.user = null; S.state = null; S.users = null; S.log = null; S.pk = null; S.it = null; S.hk = null;
    closeSheet(true); clearErr();
    renderLogin(t("sessionEnded"));
  }

  async function enter() {
    S.state = null; S.loadErr = null; S.hk = null; S.pk = null; S.it = null;
    mountShell();
    if (!location.hash || !(ROLE_ROUTES[S.user.role] || []).includes(location.hash.replace(/^#\/?/, "").split("/")[0])) history.replaceState(null, "", "#/stock");
    render(true);
    try { await loadState(); } catch (e) { S.loadErr = e instanceof ApiError ? errText(e) : String(e); }
    render(true);
  }

  // ======================================================================================== stock
  const stockSections = () => sectionsFor(S.user);
  function stockRows(sec, o) {
    const rows = [];
    for (const r of S.items) {
      if (r.sec.id !== sec.id || r.hidden) continue;
      rows.push({ kind: "item", key: r.key, name: r.item.name, group: r.group, veg: r.item.veg, price: r.item.price, out: o.has(r.key), gi: r.gi });
    }
    if (sec.id === "hookah") {
      const h = sec;
      const best = new Set(h.bestsellers || []);
      const add = (f, tier, brand) => rows.push({ kind: "flavor", key: "flavor:" + f, name: [f, f], group: [tier === 0 ? T.classic[0] : brand, tier === 0 ? T.classic[1] : brand], best: best.has(f), out: o.has("flavor:" + f), tier, brand, gi: tier === 0 ? -2 : -3 });
      h.tiers[0].flavors.forEach((f) => add(f, 0, h.tiers[0].brand || "Al Fakher"));
      const bo = h.tiers[1].brandOf || {};
      Object.keys(bo).forEach((b) => bo[b].forEach((f) => add(f, 1, b)));
      // flavors first, refills after
      rows.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "flavor" ? -1 : 1));
    }
    return rows;
  }
  function stockRowHtml(r, showSec) {
    const name = L(r.name);
    const state = r.out ? t("outToday") : t("inStock");
    return `<div class="irow ${r.out ? "out" : ""}" data-key="${esc(r.key)}">
      <div class="itext"><div class="iname">${esc(name)}</div>
        <div class="imeta">${showSec ? `<span>${esc(showSec)}</span>` : ""}${r.price ? `<span class="price">${esc(r.price)}</span>` : ""}${r.veg ? `<span class="tag ok" title="Vegetarian">V</span>` : ""}${r.best ? `<span class="tag gold">${FLAME}${esc(t("bestTag"))}</span>` : ""}${r.kind === "flavor" && r.tier === 1 ? `<span class="tag">${esc(t("premium"))}</span>` : ""}</div></div>
      <button type="button" class="sw" role="switch" aria-checked="${r.out ? "false" : "true"}" aria-label="${esc(t("switchLabel", { n: name, s: state }))}" data-act="toggle-stock" data-key="${esc(r.key)}">
        <span class="knob"><svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><path d="${P.check}"/></svg><svg class="x" viewBox="0 0 24 24" aria-hidden="true"><path d="${P.x}"/></svg></span><span class="lbl">${esc(state)}</span></button></div>`;
  }
  function stockDynHtml() {
    const o = out();
    const secs = stockSections();
    if (!S.tab || !secs.some((s) => s.id === S.tab)) S.tab = secs[0].id;
    const counts = {}; let total = 0;
    for (const s of secs) { counts[s.id] = stockRows(s, o).filter((r) => r.out).length; total += counts[s.id]; }
    const q = fold(S.q.trim());
    const global = !!q || S.outOnly;
    const tabs = `<div class="tabs" role="tablist" aria-label="${esc(t("section"))}" id="stockTabs">${secs.map((s) => `<button type="button" role="tab" class="tab" aria-selected="${!global && S.tab === s.id}" data-act="stock-tab" data-id="${s.id}">${esc(L(s.tabTitle || s.title))}${counts[s.id] ? `<span class="count" title="${esc(t("outCount", { n: counts[s.id] }))}"><span class="sr">${esc(t("outCount", { n: counts[s.id] }))}</span><span aria-hidden="true">${counts[s.id]}</span></span>` : ""}</button>`).join("")}</div>`;
    const filter = `<div class="filterbar"><button type="button" class="tab outf" aria-pressed="${S.outOnly}" data-act="stock-out">${ico("x")}${esc(t("outOnly"))}<span class="count"><span class="sr">:</span>${total}</span></button></div>`;
    let body = "";
    const list = global ? secs : secs.filter((s) => s.id === S.tab);
    let any = false;
    for (const s of list) {
      let rows = stockRows(s, o);
      if (S.outOnly) rows = rows.filter((r) => r.out);
      if (q) rows = rows.filter((r) => fold(r.name.join(" ") + " " + L(s.title) + " " + s.title.join(" ")).includes(q));
      if (!rows.length) continue;
      any = true;
      if (global) body += `<h2 class="group-t">${esc(L(s.title))}<small>${rows.length}</small></h2><div class="list">${rows.map((r) => stockRowHtml(r, "")).join("")}</div>`;
      else {
        const groups = []; const seen = new Map();
        for (const r of rows) { const g = r.gi + ":" + L(r.group); if (!seen.has(g)) { seen.set(g, { title: r.group, rows: [] }); groups.push(seen.get(g)); } seen.get(g).rows.push(r); }
        body += groups.map((g) => `${L(g.title) ? `<h2 class="group-t">${esc(L(g.title))}<small>${g.rows.length}</small></h2>` : ""}<div class="list">${g.rows.map((r) => stockRowHtml(r, "")).join("")}</div>`).join("");
      }
    }
    if (!any) body = `<div class="empty">${ico(S.outOnly && !q ? "check" : "search")}<p>${esc(S.outOnly && !q ? t("noOut") : t("noMatch"))}</p></div>`;
    return `<div class="tabbar">${tabs}${filter}</div>` + body;
  }
  SCREENS.stock = () => `<div class="head"><div><h1 class="title">${esc(t("stockT"))}</h1><p class="lede">${esc(t("stockLede"))}</p></div></div>
    <div class="search" role="search">${ico("search")}<input type="search" id="stockQ" value="${esc(S.q)}" placeholder="${esc(t("searchPh"))}" aria-label="${esc(t("search"))}" autocomplete="off" enterkeyhint="search">
      <button type="button" class="clear" data-act="stock-clear" aria-label="${esc(t("clear"))}" ${S.q ? "" : "hidden"}>${ico("x")}</button></div>
    <div id="stockDyn">${stockDynHtml()}</div>`;
  function refreshStock() {
    const dyn = $("#stockDyn"); if (!dyn) return;
    dyn.innerHTML = stockDynHtml();
    const c = $(".search .clear"); if (c) c.hidden = !S.q;
  }

  // ======================================================================================== picks
  const hookTiers = () => { const h = hookahSec(); return { classic: h.tiers[0].flavors, brandOf: h.tiers[1].brandOf || {}, c: h.tiers[0].price, p: h.tiers[1].price }; };
  const allFlavorList = () => { const h = hookTiers(); return [...h.classic, ...Object.values(h.brandOf).flat()]; };
  const pickOf = (name) => (hookahSec().staffPicks || []).find((p) => p.name === name);
  function pickNames() {
    if (S.user.role === "server") return S.user.pickName ? [S.user.pickName] : [];
    // Admin sees the picks that exist; new ones come from "Add pick" (every account has a pickName,
    // so listing users without a pick would add empty rows for admins and kitchen).
    return (hookahSec().staffPicks || []).map((p) => p.name);
  }
  function pickCard(p, tiers) {
    const [main, ...more] = p.picks;
    const flavors = new Set(allFlavorList());
    const prem = main && main.some((f) => !tiers.classic.includes(f));
    return `<div class="scard"><div class="scard-head"><span class="scard-av" aria-hidden="true">${esc((p.name || "?")[0])}</span>${esc(L(p.title))}</div>
      <div class="scard-mix">${(main || []).map((f) => `<span>${esc(f)}</span>`).join('<span class="scard-plus" aria-hidden="true">+</span>') || `<span style="color:var(--faint)">—</span>`}</div>
      ${p.note ? `<div class="scard-also">${esc(L(p.note))}</div>` : ""}
      ${more.length ? `<div class="scard-also">${esc(t("pickAlso"))} ${more.map((m) => esc(m.join(" + "))).join(", ")}</div>` : ""}
      <div class="scard-tier">${esc(prem ? t("premium") : t("classic"))} · ${esc(prem ? tiers.p : tiers.c)}</div></div>`;
  }
  function pkInit(name) {
    const cur = pickOf(name);
    S.pk = {
      name, err: "",
      tEn: cur ? cur.title[0] : name + "'s pick",
      tTr: cur ? cur.title[1] : name + " seçimi",
      nEn: cur && cur.note ? cur.note[0] : "", nTr: cur && cur.note ? cur.note[1] : "",
      bowls: cur ? clone(cur.picks) : [[]],
    };
  }
  const pkPreview = () => ({ name: S.pk.name, title: [S.pk.tEn || "…", S.pk.tTr || S.pk.tEn || "…"], picks: S.pk.bowls.map((b) => b.filter(Boolean)).filter((b) => b.length || true), note: S.pk.nEn || S.pk.nTr ? [S.pk.nEn || S.pk.nTr, S.pk.nTr || S.pk.nEn] : null });
  function pickEditorHtml(name) {
    if (!S.pk || S.pk.name !== name) pkInit(name);
    const k = S.pk, flavors = new Set(allFlavorList());
    const bowls = k.bowls.map((b, i) => `<div class="bowl"><div class="bowl-h"><span>${esc(t("bowl", { n: i + 1 }))}</span>
        ${k.bowls.length > 1 ? `<button type="button" class="btn sm danger" data-act="pk-bowl-del" data-i="${i}">${ico("trash")}${esc(t("removeBowl"))}</button>` : ""}</div>
        <div class="chips">${b.map((f) => `<span class="chip-x ${flavors.has(f) ? "" : "stale"}">${esc(f)}${flavors.has(f) ? "" : ` <small>(${esc(t("stale"))})</small>`}<button type="button" class="x" data-act="pk-fl-del" data-i="${i}" data-f="${esc(f)}" aria-label="${esc(t("removeFlavor", { f }))}">${ico("x")}</button></span>`).join("")}
        <button type="button" class="chip add" data-act="pk-fl-add" data-i="${i}" ${b.length >= 3 ? "disabled" : ""}>${ico("plus")}${esc(t("addFlavor"))}</button></div>
        ${b.length >= 3 ? `<p class="hint">${esc(t("maxFlavors"))}</p>` : ""}</div>`).join("");
    return `<a class="back" href="#/pick" ${S.user.role === "server" ? "hidden" : ""}>${ico("left")}${esc(t("picksT"))}</a>
      <div class="head"><div><h1 class="title">${esc(S.user.role === "server" ? t("pickT") : t("pickOf", { n: name }))}</h1><p class="lede">${esc(t("pickLede"))}</p></div></div>
      <h2 class="sub">${esc(t("pickPreview"))}</h2><div id="pkPrev">${pickCard(pkPreview(), hookTiers())}</div>
      <form id="pkForm" novalidate>
        <div class="cols2"><label class="field"><span>${esc(t("titleEn"))}</span><input type="text" data-bind="pk.tEn" value="${esc(k.tEn)}" maxlength="400"></label>
          <label class="field"><span>${esc(t("titleTr"))}</span><input type="text" data-bind="pk.tTr" value="${esc(k.tTr)}" maxlength="400"></label></div>
        ${bowls}
        <button type="button" class="btn quiet block" style="margin-top:10px" data-act="pk-bowl-add" ${k.bowls.length >= 3 ? "disabled" : ""}>${ico("plus")}${esc(k.bowls.length >= 3 ? t("maxBowls") : t("addBowl"))}</button>
        <div class="cols2"><label class="field"><span class="lab">${esc(t("noteEn"))} <em>· ${esc(t("optional"))}</em></span><textarea data-bind="pk.nEn" maxlength="400">${esc(k.nEn)}</textarea></label>
          <label class="field"><span class="lab">${esc(t("noteTr"))} <em>· ${esc(t("optional"))}</em></span><textarea data-bind="pk.nTr" maxlength="400">${esc(k.nTr)}</textarea></label></div>
        <p class="hint">${esc(t("noteBoth"))}</p>
        <div id="pkErr" role="alert">${k.err ? `<p class="err-text">${ico("alert")}<span>${esc(k.err)}</span></p>` : ""}</div>
        <div class="btn-row"><button type="submit" class="btn primary" id="pkSave">${esc(S.user.role === "server" ? t("savePick") : t("saveThisPick"))}</button>
          ${S.user.role === "admin" && pickOf(name) ? `<button type="button" class="btn danger" data-act="pk-delete">${ico("trash")}${esc(t("pickDelete"))}</button>` : ""}</div>
      </form>`;
  }
  SCREENS.pick = (route) => {
    if (S.user.role === "server") {
      if (!S.user.pickName) return `<div class="head"><h1 class="title">${esc(t("pickT"))}</h1></div><div class="banner info">${ico("info")}<div class="b-t">${esc(t("pickNone"))}</div></div>`;
      return pickEditorHtml(S.user.pickName);
    }
    if (route.arg) return pickEditorHtml(route.arg);
    S.pk = null;
    const names = pickNames(), tiers = hookTiers();
    const userPicks = new Set((S.users || []).map((u) => u.pickName).filter(Boolean));
    return `<div class="head"><div><h1 class="title">${esc(t("picksT"))}</h1><p class="lede">${esc(t("pickLede"))}</p></div></div>
      <button type="button" class="btn primary block" data-act="pick-add" style="margin-bottom:16px">${ico("plus")}${esc(t("addPick"))}</button>
      ${names.map((n) => { const p = pickOf(n); const orphan = !!S.users && !userPicks.has(n) && !!p;
        return `<div style="margin-bottom:18px">${p ? pickCard(p, tiers) : `<div class="scard" style="min-height:0"><div class="scard-head"><span class="scard-av" aria-hidden="true">${esc(n[0])}</span>${esc(t("pickOf", { n }))}</div></div>`}
        <div class="imeta" style="margin-top:8px">${orphan ? `<span class="tag out">${ico("alert")}${esc(t("noUserTag"))}</span>` : ""}${!p ? `<span class="tag">${esc(t("noPickYet"))}</span>` : ""}</div>
        ${orphan ? `<p class="hint">${esc(t("noUserHelp"))}</p>` : ""}
        <div class="btn-row" style="margin-top:8px"><a class="btn quiet" href="#/pick/${encodeURIComponent(n)}">${ico("edit")}${esc(p ? t("pickEdit") : t("makePick"))} · ${esc(n)}</a>
        ${p ? `<button type="button" class="btn danger" data-act="pk-delete" data-name="${esc(n)}">${ico("trash")}${esc(t("pickDelete"))}</button>` : ""}</div></div>`; }).join("") || `<div class="empty"><p>${esc(t("noPicks"))}</p></div>`}`;
  };
  AFTER.pick = (route, changed) => { if (S.user.role === "admin" && !route.arg && (changed || S.users === null) && !S.usersBusy) { S.usersBusy = true; api("GET", "/api/users").then((u) => { const first = S.users === null || JSON.stringify(u) !== JSON.stringify(S.users); S.users = u; if (first && parseRoute().name === "pick" && !parseRoute().arg && !$("#sheetRoot").firstChild) render(); }).catch(() => {}).finally(() => { S.usersBusy = false; }); } };
  let pendingPick = null;
  // Add pick: type a name, or choose a staff member. Then the normal editor opens; nothing is saved until "Save pick".
  function openAddPick() {
    const have = new Set((hookahSec().staffPicks || []).map((p) => p.name));
    const users = (S.users || []).filter((u) => !have.has(u.pickName || u.name));
    openSheet(t("addPick"), `<form class="sheet-b" id="apForm" novalidate><p class="hint" style="margin-top:0">${esc(t("addPickLede"))}</p>
      <label class="field"><span>${esc(t("pickNameField"))}</span><input type="text" id="apName" maxlength="40" autocomplete="off" autocapitalize="words" autofocus></label>
      <div id="apErr" role="alert"></div><div class="btn-row"><button type="submit" class="btn primary">${esc(t("pickStart"))}</button></div>
      ${users.length ? `<h3 class="group-t">${esc(t("fromStaff"))}</h3><div class="list">${users.map((u) => `<button type="button" class="opt" data-act="pick-from-user" data-name="${esc(u.pickName || u.name)}" data-user="${esc(u.pickName ? "" : u.name)}"><span>${esc(u.name)}${u.pickName && u.pickName !== u.name ? ` · ${esc(u.pickName)}` : ""}</span><span class="tag">${esc(t(u.role))}</span></button>`).join("")}</div>` : ""}</form>`);
  }
  function startPick(name, linkUser) {
    name = (name || "").trim().replace(/\s+/g, " ");
    if (!/^[\p{L}][\p{L} .'-]{0,39}$/u.test(name)) return sheetErr("apErr", t("pickNameBad"));
    if (pickOf(name)) return sheetErr("apErr", t("pickExists", { n: name }));
    closeSheet(true); S.pk = null; pkInit(name); S.pk.linkUser = linkUser || null; S.pk.fresh = true;
    go("#/pick/" + encodeURIComponent(name));
  }
  function pkRefresh() { const p = $("#pkPrev"); if (p) p.innerHTML = pickCard(pkPreview(), hookTiers()); }
  function openFlavorPicker(bi) {
    const tiers = hookTiers();
    const html = `<div class="search" style="margin-top:4px">${ico("search")}<input type="search" id="flQ" placeholder="${esc(t("searchPh"))}" aria-label="${esc(t("search"))}" autocomplete="off"></div><div class="sheet-b" id="flList"></div>
      <div style="padding:0 16px 16px"><button type="button" class="btn primary block" data-act="sheet-close">${esc(t("done"))}</button></div>`;
    sheetState = { kind: "flavors", bi };
    openSheet(t("pickFlavors"), html, () => { drawFlavorList(""); $("#flQ").addEventListener("input", (e) => drawFlavorList(e.target.value)); });
    function drawFlavorList(q) { drawFlavors(q); }
  }
  function drawFlavors(q) {
    const bi = sheetState.bi, cur = S.pk.bowls[bi] || [], tiers = hookTiers(); const n = fold(q.trim());
    const groups = [[t("hkClassic"), tiers.classic], ...Object.entries(tiers.brandOf).map(([b, l]) => [b + " · " + t("premium"), l])];
    $("#flList").innerHTML = groups.map(([title, list]) => {
      const f = list.filter((x) => !n || fold(x).includes(n)); if (!f.length) return "";
      return `<h3 class="group-t">${esc(title)}</h3><div class="chips">${f.map((x) => { const on = cur.includes(x); return `<button type="button" class="chip" aria-pressed="${on}" data-act="pk-fl-pick" data-f="${esc(x)}" ${!on && cur.length >= 3 ? "disabled" : ""}>${on ? ico("check") : ""}${esc(x)}</button>`; }).join("")}</div>`;
    }).join("") || `<div class="empty"><p>${esc(t("noMatch"))}</p></div>`;
  }
  async function savePick(btn) {
    const k = S.pk; k.err = "";
    const bowls = k.bowls.map((b) => b.slice()); const fail = (m) => { k.err = m; $("#pkErr").innerHTML = `<p class="err-text">${ico("alert")}<span>${esc(m)}</span></p>`; };
    if (!k.tEn.trim() && !k.tTr.trim()) return fail(t("titleNeed"));
    if (bowls.some((b) => b.length < 1 || b.length > 3)) return fail(t("bowlEmpty"));
    const title = [k.tEn.trim() || k.tTr.trim(), k.tTr.trim() || k.tEn.trim()];
    const note = k.nEn.trim() || k.nTr.trim() ? [k.nEn.trim() || k.nTr.trim(), k.nTr.trim() || k.nEn.trim()] : null;
    const r = await act(btn, async () => {
      const res = await api("PUT", "/api/picks/" + encodeURIComponent(k.name), { title, picks: bowls, note });
      const picks = S.state.picks ? clone(S.state.picks) : clone(BASE.sections.find((s) => s.id === "hookah").staffPicks).map((p) => ({ name: p.name, title: p.title, picks: p.picks, note: p.note || null }));
      const e = { name: k.name, title, picks: bowls, note };
      const i = picks.findIndex((p) => p.name === k.name); i >= 0 ? (picks[i] = e) : picks.push(e);
      S.state.picks = picks; S.state.v = res.v; rebuild();
      return true;
    }, { inline: (m) => fail(m) });
    if (r.ok) {
      if (k.linkUser) { try { await api("PATCH", "/api/users/" + encodeURIComponent(k.linkUser), { pickName: k.name }); S.users = null; } catch (_) {} }
      toast(t("saved")); S.pk = null; if (S.user.role === "admin") go("#/pick"); else render();
    }
  }

  // ======================================================================================== products
  const itemRow = (key) => S.items.find((r) => r.key === key);
  const itemThumb = (r) => { const u = imgUrl(typeof r.item.img === "string" ? r.item.img : null, "sm"); return u ? `<img class="thumb" src="${esc(u)}" alt="" loading="lazy">` : `<span class="thumb empty-t">${ico("image")}</span>`; };
  function prodRowHtml(r, withSec) {
    return `<a class="link-row" href="#/products/${encodeURIComponent(r.key)}">${itemThumb(r)}<div class="itext"><div class="iname">${esc(L(r.item.name))}</div>
      <div class="imeta">${withSec ? `<span>${esc(L(r.sec.title))}</span>` : ""}<span class="price">${esc(r.item.price || "")}</span>${r.hidden ? `<span class="tag out">${ico("x")}${esc(t("hiddenTag"))}</span>` : ""}${r.added ? `<span class="tag gold">${esc(t("added"))}</span>` : r.edited ? `<span class="tag">${esc(t("edited"))}</span>` : ""}</div></div>${ico("right", "chev")}</a>`;
  }
  function prodBodyHtml() {
    const q = fold(S.pq.trim());
    let body = "";
    if (q) {
      const rows = S.items.filter((r) => fold(r.item.name.join(" ") + " " + L(r.sec.title)).includes(q));
      body = rows.length ? `<div class="list">${rows.map((r) => prodRowHtml(r, true)).join("")}</div>` : `<div class="empty"><p>${esc(t("noMatch"))}</p></div>`;
    } else {
      body = BASE.sections.map((bs) => {
        const sec = S.menu.sections.find((s) => s.id === bs.id);
        const rows = S.items.filter((r) => r.sec.id === sec.id);
        const open = S.openSecs.has(sec.id);
        const groups = [];
        const heroRows = rows.filter((r) => r.gi === -1);
        if (heroRows.length) groups.push({ title: [T.featured[0], T.featured[1]], rows: heroRows });
        (sec.groups || []).forEach((g, gi) => groups.push({ title: g.title, gid: g._gid, layout: g._layout, rows: rows.filter((r) => r.gi === gi) }));
        const isHk = sec.id === "hookah";
        const flN = isHk ? allFlavorList().length : 0;
        const tag = isHk ? t("hkItemsCount", { n: flN, m: rows.length }) : t("itemsCount", { n: rows.length });
        const refills = groups.map((g) => `${L(g.title) ? `<h2 class="group-t">${esc(L(g.title))}</h2>` : ""}${g.gid ? `<div class="btn-row" style="margin-top:4px;margin-bottom:8px"><button type="button" class="btn sm quiet" data-act="group-edit" data-sec="${esc(sec.id)}" data-id="${esc(g.gid)}">${ico("edit")}${esc(t("editGroup"))} · ${esc(t("layout_" + g.layout))}</button></div>` : ""}<div class="list" ${L(g.title) ? "" : 'style="margin-top:14px"'}>${g.rows.map((r) => prodRowHtml(r, false)).join("")}</div>`).join("");
        const inner = isHk ? `<div class="hk-block"><h2 class="sub">${esc(t("flavorsT"))}</h2><p class="lede">${esc(t("flavorsLede"))}</p>${hkEditorHtml()}</div>${rows.length ? `<h2 class="sub">${esc(t("refillsT"))}</h2>` : ""}${refills}` : refills;
        return `<div class="acc"><button type="button" class="acc-h" aria-expanded="${open}" aria-controls="acc-${sec.id}" data-act="acc" data-id="${sec.id}"><span>${esc(L(sec.title))}</span><span class="tag">${esc(tag)}</span>${ico("right", "chev")}</button>
          <div class="acc-b ${open ? "open" : ""}" id="acc-${sec.id}">${inner}<div class="btn-row"><button type="button" class="btn quiet block" data-act="group-add" data-sec="${esc(sec.id)}">${ico("plus")}${esc(t("addGroup"))}</button></div></div></div>`;
      }).join("");
    }
    return body;
  }
  SCREENS.products = (route) => {
    if (route.arg === "sliders") { S.it = null; S.nw = null; clearPhoto(); return slidersHtml(); }
    if (route.arg === "new") { S.it = null; return newItemHtml(); }
    if (route.arg) { S.nw = null; return itemEditHtml(route.arg); }
    S.it = null; S.nw = null; clearPhoto();
    return `<div class="head"><div><h1 class="title">${esc(t("prodT"))}</h1><p class="lede">${esc(t("prodLede"))}</p></div></div>
      <a class="btn primary block" href="#/products/new" style="margin-bottom:12px">${ico("plus")}${esc(t("addItem"))}</a>
      <a class="link-row" href="#/products/sliders" style="margin-bottom:12px">${ico("star")}<div class="itext"><div class="iname">${esc(t("sliders"))}</div><div class="imeta">${esc(t("featured"))} · ${esc(t("bestSellers"))}</div></div>${ico("right", "chev")}</a>
      <div class="search" role="search">${ico("search")}<input type="search" id="prodQ" value="${esc(S.pq)}" placeholder="${esc(t("searchPh"))}" aria-label="${esc(t("search"))}" autocomplete="off">
      <button type="button" class="clear" data-act="prod-clear" aria-label="${esc(t("clear"))}" ${S.pq ? "" : "hidden"}>${ico("x")}</button></div><div id="prodDyn">${prodBodyHtml()}</div>`;
  };

  // ---------- text pair helpers
  const pairOrNull = (en, tr) => { en = (en || "").trim(); tr = (tr || "").trim(); return en || tr ? [en || tr, tr || en] : null; };
  function normPrice(v) {
    v = String(v || "").replace(/\s/g, "").replace(/^\$/, "").replace(",", ".");
    if (/^\d{1,4}$/.test(v)) v += ".00";
    if (/^\d{1,4}\.\d$/.test(v)) v += "0";
    return /^\d{1,4}\.\d{2}$/.test(v) ? "$" + v : null;
  }
  const slugify = (s) => fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 44) || "item";

  function itInit(key) {
    const r = itemRow(key); if (!r) return;
    const it = r.item;
    S.it = { key, ni: 0, nEn: it.name[0], nTr: it.name[1], dEn: it.desc ? it.desc[0] : "", dTr: it.desc ? it.desc[1] : "", price: it.price || "", veg: !!it.veg, hidden: r.hidden, reset: {}, err: "" };
  }
  function diffField(f, base, cur) {
    return base !== undefined && !eq(base, cur) ? `<div class="diff"><span>${esc(t("baseIs"))} ${esc(Array.isArray(base) ? base.join(" / ") : base === true ? t("on") : base === false ? t("off") : base || t("noBase"))}</span><button type="button" data-act="it-reset" data-f="${f}">${esc(t("toBase"))}</button></div>` : "";
  }
  const toggleHtml = (id, on, label, help, act, extra) => `<div class="toggle-row"><div class="itext"><div class="iname">${esc(label)}</div><div class="imeta">${esc(help)}</div></div>
    <b class="tgl-s ${on ? "on" : ""}">${esc(on ? t("on") : t("off"))}</b><button type="button" class="tgl" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-act="${act}" ${extra || ""}>${ico("check", "tick")}</button></div>`;

  function photoBlockHtml(curImg, baseImg, hasOverride) {
    const ph = S.photo;
    const cur = imgUrl(typeof curImg === "string" ? curImg : null, "md");
    let preview = "";
    if (ph && ph.urls) {
      preview = `<div class="prev3"><figure class="p-lg"><img src="${ph.urls.lg}" alt="" style="width:100%;aspect-ratio:${ph.dims.lg}"><figcaption>${esc(t("photoLg"))} · ${ph.dims.lgPx} · ${ph.kb.lg} KB</figcaption></figure>
        <figure class="p-md"><img src="${ph.urls.md}" alt="" style="width:100%;aspect-ratio:${ph.dims.md}"><figcaption>${esc(t("photoMd"))} · ${ph.dims.mdPx} · ${ph.kb.md} KB</figcaption></figure>
        <figure class="p-sm"><img src="${ph.urls.sm}" alt=""><figcaption>${esc(t("photoSm"))}<br>160×160<br>${ph.kb.sm} KB</figcaption></figure></div>`;
    }
    return `<div class="field"><span class="lab">${esc(t("photo"))}</span><div class="photo-box">
      ${ph && ph.busy ? `<div class="photo-ph">${esc(t("processing"))}</div>` : cur ? `<img class="photo-cur" src="${esc(cur)}" alt="${esc(t("photo"))}">` : `<div class="photo-ph">${ico("image")}&nbsp;${esc(t("noPhoto"))}</div>`}
      ${preview}
      <input type="file" accept="image/*" id="photoFile" class="hidden-file" aria-label="${esc(t("choosePhoto"))}">
      <div class="btn-row" style="margin-top:0"><label for="photoFile" class="btn quiet" role="button" tabindex="0" data-act="photo-label">${ico("camera")}${esc(cur || (ph && ph.urls) ? t("changePhoto") : t("choosePhoto"))}</label>
        ${ph && ph.urls && S.it ? `<button type="button" class="btn primary" data-act="photo-use">${ico("check")}${esc(t("useThis"))}</button>` : ""}
        ${!ph && hasOverride && baseImg !== undefined ? `<button type="button" class="btn quiet" data-act="photo-base">${esc(t("toBasePhoto"))}</button>` : ""}</div>
      <p class="hint">${esc(t("photoSizes"))}</p></div></div>`;
  }

  function itemEditHtml(key) {
    const r = itemRow(key);
    if (!r) return `<a class="back" href="#/products">${ico("left")}${esc(t("prodT"))}</a><div class="empty"><p>${esc(t("notFound"))}</p></div>`;
    if (!S.it || S.it.key !== key) { itInit(key); clearPhoto(); }
    const d = S.it, base = r.added ? null : S.baseIdx.get(key);
    const baseState = (f) => (base ? base[f] : undefined);
    const stateItem = (S.state.items || {})[key] || {};
    const secG = r.gi >= 0 ? L(r.group) : t("featured");
    return `<a class="back" href="#/products">${ico("left")}${esc(t("prodT"))}</a>
      <div class="head"><div><h1 class="title">${esc(L(r.item.name))}</h1><p class="lede">${[L(r.sec.title), secG, r.added ? t("added") : ""].filter(Boolean).map(esc).join(" · ")}</p></div></div>
      <form id="itForm" novalidate>
        <div class="cols2"><label class="field"><span>${esc(t("nameEn"))}</span><input type="text" data-bind="it.nEn" value="${esc(d.nEn)}" maxlength="400" autocomplete="off"></label>
          <label class="field"><span>${esc(t("nameTr"))}</span><input type="text" data-bind="it.nTr" value="${esc(d.nTr)}" maxlength="400" autocomplete="off"></label></div>
        ${diffField("name", baseState("name"), [d.nEn, d.nTr])}
        <label class="field"><span class="lab">${esc(t("descEn"))}</span><textarea data-bind="it.dEn" maxlength="400">${esc(d.dEn)}</textarea></label>
        <label class="field"><span class="lab">${esc(t("descTr"))}</span><textarea data-bind="it.dTr" maxlength="400">${esc(d.dTr)}</textarea></label>
        ${base ? diffField("desc", base.desc === undefined ? null : base.desc, d.dEn || d.dTr ? [d.dEn, d.dTr] : null) : ""}
        <label class="field"><span>${esc(t("price"))} <em>· ${esc(t("priceHelp"))}</em></span><input type="text" data-bind="it.price" value="${esc(d.price)}" inputmode="decimal" autocomplete="off" maxlength="9"></label>
        ${diffField("price", baseState("price"), d.price)}
        ${toggleHtml("veg", d.veg, t("veg"), t("vegHelp"), "it-veg")}
        ${base ? diffField("veg", !!base.veg, d.veg) : ""}
        ${toggleHtml("hidden", d.hidden, t("hide"), t("hideHelp"), "it-hidden")}
        ${photoBlockHtml(r.item.img, baseState("img"), stateItem.img !== undefined)}
        ${sliderShortcuts(key, r.sec.id, false)}
        <div id="itErr" role="alert">${d.err ? `<p class="err-text">${ico("alert")}<span>${esc(d.err)}</span></p>` : ""}</div>
        <div class="btn-row"><button type="submit" class="btn primary" id="itSave">${esc(t("saveChanges"))}</button></div>
      </form>
      ${r.added ? `<div class="btn-row"><button type="button" class="btn danger block" data-act="it-delete">${ico("trash")}${esc(t("deleteItem"))}</button></div>` : `<p class="hint" style="margin-top:18px">${esc(t("baseDelNote"))}</p>`}`;
  }

  // Which fields changed, as a PATCH body (null = back to original).
  function buildPatch(r, d) {
    const patch = {}; const it = r.item; const base = r.added ? null : S.baseIdx.get(r.key); const ov = (S.state.items || {})[r.key] || {};
    const put = (f, val, baseVal, curVal) => {
      if (d.reset[f]) { if (base) patch[f] = null; return; }
      if (eq(val, curVal)) return;
      if (base && eq(val, baseVal)) { if (ov[f] !== undefined) patch[f] = null; return; }
      patch[f] = val;
    };
    const name = pairOrNull(d.nEn, d.nTr);
    put("name", name, base && base.name, it.name);
    const desc = pairOrNull(d.dEn, d.dTr);
    const curDesc = it.desc || null, baseDesc = base ? base.desc || null : null;
    if (desc === null && curDesc && base && baseDesc) { if (!d.reset.desc) patch.desc = ["", ""]; else patch.desc = null; }
    else put("desc", desc, baseDesc, curDesc);
    put("price", d.priceN, base && base.price, it.price);
    put("veg", d.veg, base ? !!base.veg : undefined, !!it.veg);
    put("hidden", d.hidden, false, r.hidden);
    if (patch.hidden === false) patch.hidden = null;
    if (d.reset.img && base) patch.img = null;
    return patch;
  }
  function applyPatchLocal(key, patch) {
    const items = (S.state.items = S.state.items || {});
    const o = items[key] || {};
    for (const [f, v] of Object.entries(patch)) { if (v === null) delete o[f]; else o[f] = v; }
    if (Object.keys(o).length) items[key] = o; else delete items[key];
  }
  async function saveItem(btn) {
    const d = S.it, r = itemRow(d.key); const fail = (m) => { d.err = m; $("#itErr").innerHTML = `<p class="err-text">${ico("alert")}<span>${esc(m)}</span></p>`; };
    d.err = "";
    if (!d.nEn.trim()) return fail(t("nameNeed"));
    d.priceN = normPrice(d.price);
    if (!d.priceN) return fail(t("priceBad"));
    const patch = buildPatch(r, d);
    if (!Object.keys(patch).length) { $("#itErr").innerHTML = ""; toast(t("noChanges")); return; }
    const res = await act(btn, async () => {
      const out2 = await api("PATCH", "/api/items/" + encodeURIComponent(d.key), patch);
      applyPatchLocal(d.key, patch); S.state.v = out2.v; rebuild(); return true;
    }, { inline: fail });
    if (res.ok) { toast(t("saved")); S.it = null; render(); }
  }

  // ---------- new item
  function nwInit() { S.nw = { sec: "desserts", gi: 0, nEn: "", nTr: "", dEn: "", dTr: "", price: "", veg: false, featured: false, carousel: false, err: "" }; }
  function newItemHtml() {
    if (!S.nw) { nwInit(); clearPhoto(); }
    const d = S.nw;
    const secs = S.menu.sections;
    const sec = secs.find((s) => s.id === d.sec) || secs[0];
    if (sec.id !== d.sec) d.sec = sec.id;
    if (!sec.groups.some((g, i) => String(g._gid ? "g:" + g._gid : i) === String(d.gi))) d.gi = sec.groups[0] && sec.groups[0]._gid ? "g:" + sec.groups[0]._gid : 0;
    return `<a class="back" href="#/products">${ico("left")}${esc(t("prodT"))}</a>
      <div class="head"><div><h1 class="title">${esc(t("newItem"))}</h1></div></div>
      <form id="nwForm" novalidate>
        <label class="field"><span>${esc(t("section"))}</span><select data-bind="nw.sec" data-rerender="1">${secs.map((s) => `<option value="${s.id}" ${s.id === d.sec ? "selected" : ""}>${esc(L(s.title))}</option>`).join("")}</select></label>
        <label class="field"><span>${esc(t("group"))}</span><select data-bind="nw.gi">${sec.groups.map((g, i) => { const value = g._gid ? "g:" + g._gid : i; return `<option value="${esc(value)}" ${String(value) === String(d.gi) ? "selected" : ""}>${esc(L(g.title) || t("group") + " " + (i + 1))}</option>`; }).join("")}<option value="+">${esc(t("newGroup"))}</option></select></label>
        <div class="cols2"><label class="field"><span>${esc(t("nameEn"))}</span><input type="text" data-bind="nw.nEn" value="${esc(d.nEn)}" maxlength="400" autocomplete="off"></label>
          <label class="field"><span>${esc(t("nameTr"))}</span><input type="text" data-bind="nw.nTr" value="${esc(d.nTr)}" maxlength="400" autocomplete="off"></label></div>
        <label class="field"><span class="lab">${esc(t("descEn"))} <em>· ${esc(t("optional"))}</em></span><textarea data-bind="nw.dEn" maxlength="400">${esc(d.dEn)}</textarea></label>
        <label class="field"><span class="lab">${esc(t("descTr"))} <em>· ${esc(t("optional"))}</em></span><textarea data-bind="nw.dTr" maxlength="400">${esc(d.dTr)}</textarea></label>
        <label class="field"><span>${esc(t("price"))} <em>· ${esc(t("priceHelp"))}</em></span><input type="text" data-bind="nw.price" value="${esc(d.price)}" inputmode="decimal" autocomplete="off" maxlength="9"></label>
        ${toggleHtml("veg", d.veg, t("veg"), t("vegHelp"), "nw-veg")}
        ${photoBlockHtml(null, undefined, false)}
        ${sliderShortcuts(null, d.sec, true)}
        <div id="nwErr" role="alert">${d.err ? `<p class="err-text">${ico("alert")}<span>${esc(d.err)}</span></p>` : ""}</div>
        <div class="btn-row"><button type="submit" class="btn primary" id="nwSave">${esc(t("createItem"))}</button></div>
      </form>`;
  }
  async function createItem(btn) {
    const d = S.nw, fail = (m) => { d.err = m; $("#nwErr").innerHTML = `<p class="err-text">${ico("alert")}<span>${esc(m)}</span></p>`; };
    d.err = "";
    if (!d.nEn.trim()) return fail(t("nameNeed"));
    const price = normPrice(d.price); if (!price) return fail(t("priceBad"));
    const ph = S.photo && S.photo.urls ? S.photo : null;
    if (!d.created && [d.featured ? "featured" : null, d.carousel && canCarousel(d.sec) ? d.sec : null].filter(Boolean).some((id) => sliderKeys(id).length >= 20)) return fail(t("sliderLimit"));
    const res = await act(btn, async () => {
      let img = null;
      if (ph) { if (!ph.uploaded) ph.uploaded = await uploadPhoto(ph, d.nEn); img = ph.uploaded; }
      const body = { section: d.sec, group: d.gi, name: pairOrNull(d.nEn, d.nTr), desc: pairOrNull(d.dEn, d.dTr), price, img, veg: d.veg };
      const out2 = d.created || await api("POST", "/api/items", body);
      d.created = out2; // A failed slider write must never create a duplicate item on retry.
      S.state.added = (S.state.added || []).concat([{ id: out2.id, section: d.sec, group: d.gi, name: body.name, desc: body.desc, price, img, veg: d.veg }]);
      await loadState();
      const key = "new:" + out2.id;
      for (const id of [d.featured ? "featured" : null, d.carousel && canCarousel(d.sec) ? d.sec : null].filter(Boolean)) {
        const keys = sliderKeys(id);
        if (!keys.includes(key)) { if (keys.length >= 20) throw new ApiError("slider_limit", 400); await putSlider(id, keys.concat(key)); }
      }
      return out2.id;
    }, { inline: fail });
    if (res.ok) { toast(t("saved")); S.nw = null; clearPhoto(); go("#/products/" + encodeURIComponent("new:" + res.value)); }
  }

  // ---------- photos: pick → canvas → 3 webp sizes → preview → upload → PATCH img
  function clearPhoto() { if (S.photo && S.photo.urls) Object.values(S.photo.urls).forEach((u) => URL.revokeObjectURL(u)); S.photo = null; }
  function loadBitmap(file) {
    if (window.createImageBitmap) return createImageBitmap(file).catch(() => viaImg());
    return viaImg();
    function viaImg() {
      return new Promise((res, rej) => { const u = URL.createObjectURL(file); const im = new Image(); im.onload = () => { res(im); URL.revokeObjectURL(u); }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("img")); }; im.src = u; });
    }
  }
  function toWebp(canvas) {
    return new Promise(async (res, rej) => {
      for (const q of [0.86, 0.74, 0.6, 0.45]) {
        const blob = await new Promise((r) => canvas.toBlob(r, "image/webp", q));
        if (!blob || blob.type !== "image/webp") return rej(new Error("webp"));
        if (blob.size <= 1.4 * 1024 * 1024) return res(blob);
      }
      rej(new Error("big"));
    });
  }
  function drawScaled(bmp, w, h, sx, sy, sw, sh) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h); return c;
  }
  async function makeSizes(file) {
    const bmp = await loadBitmap(file);
    const W = bmp.width, H = bmp.height; if (!W || !H) throw new Error("img");
    const fit = (max) => { const k = Math.min(1, max / Math.max(W, H)); return [Math.round(W * k), Math.round(H * k)]; };   // long side, never upscaled
    const [lw, lh] = fit(1200), [mw, mh] = fit(800);
    const s = Math.min(W, H), sx = (W - s) / 2, sy = (H - s) / 2;                                                           // 160×160 centre crop
    const blobs = { lg: await toWebp(drawScaled(bmp, lw, lh, 0, 0, W, H)), md: await toWebp(drawScaled(bmp, mw, mh, 0, 0, W, H)), sm: await toWebp(drawScaled(bmp, 160, 160, sx, sy, s, s)) };
    if (bmp.close) bmp.close();
    return { blobs, dims: { lg: lw + "/" + lh, md: mw + "/" + mh, lgPx: lw + "×" + lh, mdPx: mw + "×" + mh } };
  }
  async function onPhotoChosen(file) {
    if (!file) return;
    clearPhoto(); S.photo = { busy: true }; refreshPhotoBlock();
    try {
      const { blobs, dims } = await makeSizes(file);
      S.photo = { blobs, dims, urls: { lg: URL.createObjectURL(blobs.lg), md: URL.createObjectURL(blobs.md), sm: URL.createObjectURL(blobs.sm) }, kb: { lg: Math.round(blobs.lg.size / 1024), md: Math.round(blobs.md.size / 1024), sm: Math.round(blobs.sm.size / 1024) } };
    } catch (e) { S.photo = null; errToast(e.message === "webp" ? t("webpFail") : t("photoFail"), null); }
    refreshPhotoBlock();
  }
  function refreshPhotoBlock() {
    // Re-draw the whole current form screen but keep typed values (they live in S.it / S.nw).
    const route = parseRoute(); if (route.name !== "products") return;
    const y = window.scrollY; $("#main").firstElementChild.innerHTML = SCREENS.products(route); window.scrollTo(0, y);
  }
  async function uploadPhoto(ph, nameForSlug) {
    const slug = slugify(nameForSlug) + "-" + Date.now().toString(36).slice(-6);
    const fd = new FormData();
    fd.append("slug", slug); fd.append("lg", ph.blobs.lg, slug + ".webp"); fd.append("md", ph.blobs.md, slug + "-md.webp"); fd.append("sm", ph.blobs.sm, slug + "-sm.webp");
    return (await api("POST", "/api/upload", fd)).img;
  }
  async function usePhoto(btn) {
    const d = S.it, ph = S.photo; if (!ph || !ph.urls) return;
    const r = await act(btn, async () => {
      if (!ph.uploaded) ph.uploaded = await uploadPhoto(ph, d.nEn || "item");     // a retry after a failed PATCH skips the upload
      const out2 = await api("PATCH", "/api/items/" + encodeURIComponent(d.key), { img: ph.uploaded });
      applyPatchLocal(d.key, { img: ph.uploaded }); S.state.v = out2.v; rebuild(); return true;
    });
    if (r.ok) { toast(t("saved")); clearPhoto(); render(); }
  }

  // ======================================================================================== hookah
  const hkBase = () => { const h = hookahSec(); return { classic: clone(h.tiers[0].flavors), premium: clone(h.tiers[1].brandOf || {}), best: clone(h.bestsellers || []) }; };
  const hkClean = (h) => ({ classic: h.classic, premium: Object.fromEntries(Object.entries(h.premium).filter(([, l]) => l.length)), bestsellers: h.best.filter((f) => h.classic.includes(f) || Object.values(h.premium).some((l) => l.includes(f))) });
  const hkDirty = () => !!(S.hk && S.state && S.menu && !eq(hkClean(S.hk), hkClean(hkBase())));
  const hkWhere = (f) => { const k = f.toLowerCase(); if (S.hk.classic.some((x) => x.toLowerCase() === k)) return t("hkClassic"); for (const [b, l] of Object.entries(S.hk.premium)) if (l.some((x) => x.toLowerCase() === k)) return t("premium") + " · " + b; return null; };
  function hkRow(f, list, brand) {
    const best = S.hk.best.includes(f);
    return `<div class="fl-row"><span class="fl-name">${esc(f)}</span>${best ? `<span class="tag gold">${FLAME}${esc(t("hkBest"))}</span>` : ""}
      <button type="button" class="icon-btn" data-act="hk-best" data-f="${esc(f)}" aria-pressed="${best}" aria-label="${esc(f)}: ${esc(best ? t("hkBestOn") : t("hkBestOff"))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${P.flame}"/></svg></button>
      <button type="button" class="icon-btn" data-act="hk-move" data-f="${esc(f)}" aria-label="${esc(t("hkMove", { f }))}">${ico("more", "dots")}</button></div>`;
  }
  const hkAddLine = (where) => `<form class="add-line" data-form="hk-add" data-where="${esc(where)}"><input type="text" maxlength="60" placeholder="${esc(t("hkAddPh"))}" aria-label="${esc(t("hkAddPh"))}" autocomplete="off" autocapitalize="words"><button type="submit" class="btn sm">${ico("plus")}${esc(t("hkAdd"))}</button></form><div class="hk-err" data-for="${esc(where)}" role="alert"></div>`;
  // The one flavor editor, used by #/hookah and inside Items > Hookah.
  function hkEditorHtml() {
    if (!S.hk) S.hk = hkBase();
    const h = S.hk;
    const brands = Object.keys(h.premium);
    return `<h2 class="group-t">${esc(t("hkClassic"))}<small>${h.classic.length}</small></h2>
      <div class="list">${h.classic.map((f) => hkRow(f)).join("") || `<div class="empty"><p>${esc(t("hkEmpty"))}</p></div>`}</div>${hkAddLine("classic")}
      <h2 class="sub">${esc(t("hkPremium"))}</h2>
      ${brands.map((b) => `<h2 class="group-t">${esc(b)}<small>${h.premium[b].length}</small></h2><div class="list">${h.premium[b].map((f) => hkRow(f)).join("") || `<div class="empty"><p>${esc(t("hkEmpty"))}</p></div>`}</div>${hkAddLine("brand:" + b)}`).join("")}
      <h2 class="group-t">${esc(t("hkNewBrand"))}</h2>
      <form class="add-line" data-form="hk-brand"><input type="text" maxlength="40" placeholder="${esc(t("hkNewBrandPh"))}" aria-label="${esc(t("hkNewBrandPh"))}" autocomplete="off" autocapitalize="words"><button type="submit" class="btn sm">${ico("plus")}${esc(t("hkAdd"))}</button></form><div class="hk-err" data-for="newbrand" role="alert"></div>
      ${hkDirty() ? `<div style="height:84px" aria-hidden="true"></div><div class="savebar"><div class="savebar-in"><span class="msg" role="status">${esc(t("hkUnsaved"))}</span><button type="button" class="btn sm quiet" data-act="hk-discard">${esc(t("hkDiscard"))}</button><button type="button" class="btn sm primary" data-act="hk-save">${esc(t("hkSave"))}</button></div></div>` : ""}`;
  }
  SCREENS.hookah = () => `<div class="head"><div><h1 class="title">${esc(t("hkT"))}</h1><p class="lede">${esc(t("hkLede"))}</p></div></div>${hkEditorHtml()}`;
  function hkErr(where, msg) { const el = $(`.hk-err[data-for="${CSS.escape(where)}"]`); if (el) el.innerHTML = msg ? `<p class="err-text">${ico("alert")}<span>${esc(msg)}</span></p>` : ""; }
  function hkRender() { const route = parseRoute(); updateChrome(route); const y = window.scrollY; $("#main").firstElementChild.innerHTML = SCREENS[route.name](route); window.scrollTo(0, y); }
  function hkRemove(f) {
    S.hk.classic = S.hk.classic.filter((x) => x !== f);
    for (const b of Object.keys(S.hk.premium)) S.hk.premium[b] = S.hk.premium[b].filter((x) => x !== f);
  }
  function openMoveSheet(f) {
    const h = S.hk;
    const wasIn = S.hk.classic.includes(f) ? "classic" : Object.keys(h.premium).find((b) => h.premium[b].includes(f));
    const usedBy = (hookahSec().staffPicks || []).filter((p) => p.picks.flat().includes(f)).map((p) => p.name);
    const opts = [`<button type="button" class="opt" data-act="hk-to" data-f="${esc(f)}" data-to="classic" ${wasIn === "classic" ? "disabled" : ""}>${esc(t("hkClassic"))}${wasIn === "classic" ? `<span class="tag">${esc(t("here"))}</span>` : ""}</button>`,
      ...Object.keys(h.premium).map((b) => `<button type="button" class="opt" data-act="hk-to" data-f="${esc(f)}" data-to="brand:${esc(b)}" ${wasIn === b ? "disabled" : ""}>${esc(t("premium"))} · ${esc(b)}${wasIn === b ? `<span class="tag">${esc(t("here"))}</span>` : ""}</button>`)].join("");
    openSheet(f, `<div class="sheet-b"><h3 class="group-t" style="margin-top:0">${esc(t("hkMoveTo"))}</h3>${opts}
      <form class="add-line" data-form="hk-to-new" data-f="${esc(f)}"><input type="text" maxlength="40" placeholder="${esc(t("hkBrandPick"))}" aria-label="${esc(t("hkBrandPick"))}" autocomplete="off"><button type="submit" class="btn sm">${esc(t("hkMoveTo"))}</button></form><div id="mvErr" role="alert"></div>
      ${usedBy.length ? `<p class="hint">${esc(t("hkUsedInPick", { n: usedBy.join(", ") }))}</p>` : ""}
      <button type="button" class="opt danger" style="margin-top:14px" data-act="hk-del" data-f="${esc(f)}">${ico("trash")}${esc(t("hkRemove"))}</button></div>`);
  }
  async function saveHookah(btn) {
    const body = hkClean(S.hk);
    const r = await act(btn, async () => {
      const out2 = await api("PUT", "/api/hookah", body);
      S.state.hookah = body; S.state.v = out2.v; rebuild(); S.hk = null; return true;
    });
    if (r.ok) { toast(t("saved")); render(); }
  }

  // ======================================================================================== more / users / log
  SCREENS.more = () => `<div class="head"><div><h1 class="title">${esc(t("moreT"))}</h1><p class="lede">${esc(t("signedAs", { n: S.user.name }))}</p></div></div>
    <div class="list"><a class="link-row" href="#/users">${ico("users")}<div class="itext"><div class="iname">${esc(t("usersT"))}</div><div class="imeta">${esc(t("usersLede"))}</div></div>${ico("right", "chev")}</a>
    <a class="link-row" href="#/log">${ico("log")}<div class="itext"><div class="iname">${esc(t("logT"))}</div><div class="imeta">${esc(t("logLede"))}</div></div>${ico("right", "chev")}</a></div>
    <div class="btn-row"><button type="button" class="btn quiet block" data-act="logout">${ico("logout")}${esc(t("signOut"))}</button></div>`;

  const fmtDate = (s) => { if (!s) return t("never"); try { return new Date(s).toLocaleString(lang === "tr" ? "tr-TR" : "en-US", { dateStyle: "medium", timeStyle: "short" }); } catch (_) { return s; } };
  const userRowHtml = (u) => `<button type="button" class="link-row" data-act="user-open" data-name="${esc(u.name)}"><span class="scard-av" style="width:44px;height:44px;font-size:19px" aria-hidden="true">${esc(u.name[0])}</span>
    <div class="itext"><div class="iname">${esc(u.name)}${u.name === S.user.name ? ` <small style="color:var(--muted);font-weight:500">(${esc(t("you"))})</small>` : ""}</div>
      <div class="imeta"><span class="tag gold">${esc(t(u.role))}</span>${u.active ? `<span class="tag ok">${ico("check")}${esc(t("active"))}</span>` : `<span class="tag out">${ico("x")}${esc(t("inactive"))}</span>`}${u.pickName ? `<span>${ico("star").replace("<svg", '<svg width="12" height="12" style="width:12px;height:12px;vertical-align:-1px"')} ${esc(u.pickName)}</span>` : ""}${u.pickName && !pickOf(u.pickName) ? `<span class="tag">${esc(t("noPickYet"))}</span>` : ""}</div>
      <div class="imeta">${esc(t("lastLogin"))}: ${esc(fmtDate(u.lastLogin))}</div></div>${ico("right", "chev")}</button>`;
  SCREENS.users = () => `<a class="back" href="#/more">${ico("left")}${esc(t("moreT"))}</a><div class="head"><div><h1 class="title">${esc(t("usersT"))}</h1><p class="lede">${esc(t("usersLede"))}</p></div></div>
    <button type="button" class="btn primary block" data-act="user-add" style="margin-bottom:14px">${ico("plus")}${esc(t("addUser"))}</button>
    <div id="usersBody">${usersBodyHtml()}</div>`;
  function usersBodyHtml() {
    if (S.usersErr) return `<div class="banner">${ico("alert")}<div class="b-t">${esc(S.usersErr)}</div><button type="button" class="btn sm primary" data-act="users-reload">${esc(t("retry"))}</button></div>`;
    if (!S.users) return `<div class="loading">${ico("refresh", "spin")}<span>${esc(t("loading"))}</span></div>`;
    return `<div class="list">${S.users.map(userRowHtml).join("")}</div>`;
  }
  async function loadUsers() {
    S.usersErr = null;
    try { S.users = await api("GET", "/api/users"); } catch (e) { if (e.code !== "auth") S.usersErr = errText(e); }
    if (parseRoute().name === "users") $("#usersBody").innerHTML = usersBodyHtml();
  }
  AFTER.users = (route, changed) => { if (changed || !S.users) loadUsers(); };

  SCREENS.log = () => `<a class="back" href="#/more">${ico("left")}${esc(t("moreT"))}</a><div class="head"><div><h1 class="title">${esc(t("logT"))}</h1><p class="lede">${esc(t("logLede"))}</p></div></div><div id="logBody">${logBodyHtml()}</div>`;
  function logBodyHtml() {
    if (S.logErr) return `<div class="banner">${ico("alert")}<div class="b-t">${esc(S.logErr)}</div><button type="button" class="btn sm primary" data-act="log-reload">${esc(t("retry"))}</button></div>`;
    if (!S.log) return `<div class="loading">${ico("refresh", "spin")}<span>${esc(t("loading"))}</span></div>`;
    if (!S.log.length) return `<div class="empty"><p>${esc(t("logEmpty"))}</p></div>`;
    return `<div class="list">${S.log.map((e) => `<div class="logrow"><div class="when"><span>${esc(fmtDate(e.at))}</span><span>${esc(e.user)}</span></div>
      <div class="what">${esc(ACTION[e.action] ? ACTION[e.action][li()] : e.action)}${e.target ? " · " + esc(e.target) : ""}</div>${e.detail ? `<div class="det">${esc(e.detail)}</div>` : ""}</div>`).join("")}</div>`;
  }
  async function loadLog() {
    S.logErr = null;
    try { S.log = await api("GET", "/api/log?limit=100"); } catch (e) { if (e.code !== "auth") S.logErr = errText(e); }
    if (parseRoute().name === "log") $("#logBody").innerHTML = logBodyHtml();
  }
  AFTER.log = (route, changed) => { if (changed || !S.log) loadLog(); };

  // ---------- user sheets
  const seg = (name, val, opts) => `<div class="seg" role="group" aria-label="${esc(t("role"))}">${opts.map((o) => `<button type="button" data-act="seg" data-name="${name}" data-val="${o}" aria-pressed="${val === o}">${esc(t(o))}</button>`).join("")}</div>`;
  let usheet = null;
  function openAddUser() {
    usheet = { role: "server" };
    openSheet(t("addUser"), `<form class="sheet-b" id="uaForm" novalidate>
      <label class="field"><span>${esc(t("nameLogin"))}</span><input type="text" id="uaName" maxlength="40" autocomplete="off" autocapitalize="words" autofocus></label>
      <div class="field"><span class="lab">${esc(t("role"))}</span><div id="uaRole">${seg("role", "server", ["admin", "server", "kitchen"])}</div></div>
      <label class="field"><span>${esc(t("pin"))} <em>· ${esc(t("pinHelp"))}</em></span><input type="password" id="uaPin" inputmode="numeric" pattern="[0-9]*" maxlength="12" autocomplete="new-password"></label>
      <div id="uaPickBox"><label class="field"><span class="lab">${esc(t("pickNameSrv"))} <em>· ${esc(t("optional"))}</em></span><input type="text" id="uaPick" maxlength="40" autocomplete="off"></label><p class="hint">${esc(t("pickNameSrvHelp"))}</p></div>
      <div id="uaErr" role="alert"></div><div class="btn-row"><button type="submit" class="btn primary" id="uaGo">${esc(t("createUser"))}</button></div></form>`);
  }
  const sheetErr = (id, m) => { const el = $("#" + id); if (el) el.innerHTML = m ? `<p class="err-text">${ico("alert")}<span>${esc(m)}</span></p>` : ""; };
  async function createUser(btn) {
    const name = $("#uaName").value.trim(), pin = $("#uaPin").value.trim();
    const pickName = usheet.role === "server" ? ($("#uaPick").value.trim() || name) : "";
    if (!name) return sheetErr("uaErr", t("needName"));
    if (!/^\d{4,12}$/.test(pin)) return sheetErr("uaErr", t("needPin"));
    const r = await act(btn, async () => { await api("POST", "/api/users", { name, role: usheet.role, pin, pickName: pickName || null }); await loadUsers(); return true; }, { inline: (m) => sheetErr("uaErr", m) });
    if (r.ok) {
      const pn = usheet.role === "server" ? pickName : null;
      if (pn && !pickOf(pn)) {   // new server without a pick: offer the shortcut
        openSheet(t("userCreated"), `<div class="sheet-b"><p class="confirm-t">${esc(t("staffAdded", { n: name }))}. ${esc(t("makePickHelp", { n: pn }))}</p><div class="btn-row"><button type="button" class="btn quiet" data-act="sheet-close">${esc(t("done"))}</button><button type="button" class="btn primary" data-act="pick-create" data-name="${esc(pn)}">${ico("star")}${esc(t("makePick"))}</button></div></div>`);
      } else { closeSheet(); toast(t("userCreated")); }
    }
  }
  function openUser(name) {
    const u = S.users.find((x) => x.name === name); if (!u) return;
    usheet = { name, role: u.role };
    const self = name === S.user.name;
    openSheet(u.name, `<div class="sheet-b">
      <div class="imeta" style="margin-bottom:8px"><span class="tag gold">${esc(t(u.role))}</span>${u.active ? `<span class="tag ok">${ico("check")}${esc(t("active"))}</span>` : `<span class="tag out">${ico("x")}${esc(t("inactive"))}</span>`}<span>${esc(t("lastLogin"))}: ${esc(fmtDate(u.lastLogin))}</span></div>
      ${self ? `<div class="banner info">${ico("info")}<div class="b-t">${esc(t("selfWarn"))}</div></div>` : ""}
      <div class="field"><span class="lab">${esc(t("changeRole"))}</span>${seg("role", u.role, ["admin", "server", "kitchen"])}</div>
      <form data-form="user-pick"><label class="field"><span class="lab">${esc(t("pickName"))}</span><div class="add-line" style="margin-top:0"><input type="text" id="upPick" maxlength="40" value="${esc(u.pickName || "")}" aria-label="${esc(t("pickName"))}" autocomplete="off"><button type="submit" class="btn sm">${esc(t("savePickName"))}</button></div></label></form>
      <form data-form="user-pin"><label class="field"><span class="lab">${esc(t("resetPin"))} <em>· ${esc(t("pinHelp"))}</em></span><div class="add-line" style="margin-top:0"><input type="password" id="upPin" inputmode="numeric" pattern="[0-9]*" maxlength="12" placeholder="${esc(t("newPin"))}" aria-label="${esc(t("newPin"))}" autocomplete="new-password"><button type="submit" class="btn sm">${ico("key")}${esc(t("setPin"))}</button></div></label></form>
      ${u.pickName && !pickOf(u.pickName) ? `<button type="button" class="opt" data-act="pick-create" data-name="${esc(u.pickName)}">${ico("star")}${esc(t("makePick"))} · ${esc(u.pickName)}</button>` : ""}
      <div id="upErr" role="alert"></div>
      <button type="button" class="opt" data-act="user-active" data-val="${u.active ? "0" : "1"}">${ico(u.active ? "x" : "check")}${esc(u.active ? t("deactivate") : t("activate"))}</button>
      <button type="button" class="opt danger" data-act="user-del">${ico("trash")}${esc(t("deleteUser"))}</button><p class="hint">${esc(t("renameHint"))}</p></div>`);
  }
  // After touching your own account, ask the server who you are now.
  async function afterSelfChange() {
    try { S.user = (await api("GET", "/api/me")).user; } catch (_) { return; }
    if (!(ROLE_ROUTES[S.user.role] || []).includes(parseRoute().name)) go("#/stock"); else render();
  }
  async function patchUser(btn, body, okMsg) {
    const name = usheet.name;
    const r = await act(btn, async () => { await api("PATCH", "/api/users/" + encodeURIComponent(name), body); await loadUsers(); if (name === S.user.name) await afterSelfChange(); return true; }, { inline: (m) => sheetErr("upErr", m) });
    if (r.ok) { if (okMsg) toast(okMsg); if (S.users && S.users.find((x) => x.name === name) && $("#sheetRoot").firstChild) openUser(name); }
    return r.ok;
  }

  // ======================================================================================== events
  function setPath(path, val) { const [root, key] = path.split("."); const obj = { pk: S.pk, it: S.it, nw: S.nw }[root]; if (obj) obj[key] = val; return root; }
  const ACT = {
    "sheet-close": () => closeSheet(),
    "err-dismiss": () => clearErr(),
    "err-retry": () => { const f = errEl && errEl._retry; clearErr(); if (f) f(); },
    "pin-eye": (el) => { const i = $("#lgPin"); const show = i.type === "password"; i.type = show ? "text" : "password"; el.setAttribute("aria-pressed", String(show)); el.setAttribute("aria-label", t(show ? "hidePin" : "showPin")); el.innerHTML = ico(show ? "eyeoff" : "eye"); },
    refresh: async (el) => { if (S.refreshing) return; S.refreshing = true; updateChrome(parseRoute()); try { await loadState(); S.loadErr = null; render(); } catch (e) { if (e.code !== "auth") errToast(errText(e), () => ACT.refresh(el)); } S.refreshing = false; updateChrome(parseRoute()); },
    "reload-state": async () => { S.loadErr = null; render(); try { await loadState(); } catch (e) { S.loadErr = errText(e); } render(true); },
    logout: async (el) => {
      const r = await act(el, () => api("POST", "/api/logout"));
      if (r.ok) { S.user = null; S.state = null; S.users = null; S.log = null; S.hk = null; S.pk = null; S.it = null; closeSheet(true); clearErr(); history.replaceState(null, "", location.pathname + location.search); renderLogin(""); }
    },
    // stock
    "stock-tab": (el) => { S.tab = el.dataset.id; S.outOnly = false; S.q = ""; const i = $("#stockQ"); if (i) i.value = ""; refreshStock(); },
    "stock-out": () => { S.outOnly = !S.outOnly; refreshStock(); },
    "stock-clear": () => { S.q = ""; const i = $("#stockQ"); i.value = ""; i.focus(); refreshStock(); },
    "toggle-stock": async (el) => {
      const key = el.dataset.key, nowOut = !out().has(key);
      const r = await act(el, async () => {
        const res = await api("PUT", "/api/availability", { key, unavailable: nowOut });
        const set = new Set(S.state.unavailable); nowOut ? set.add(key) : set.delete(key); S.state.unavailable = [...set]; S.state.v = res.v; rebuild(); return true;
      });
      if (r.ok) { refreshStock(); const again = $(`.sw[data-key="${CSS.escape(key)}"]`); if (again && document.activeElement === document.body) again.focus({ preventScroll: true }); }
    },
    // picks
    "pk-bowl-add": () => { if (S.pk.bowls.length < 3) { S.pk.bowls.push([]); render(); } },
    "pk-bowl-del": (el) => { S.pk.bowls.splice(+el.dataset.i, 1); render(); },
    "pk-fl-del": (el) => { const b = S.pk.bowls[+el.dataset.i]; b.splice(b.indexOf(el.dataset.f), 1); render(); },
    "pk-fl-add": (el) => openFlavorPicker(+el.dataset.i),
    "pk-fl-pick": (el) => { const b = S.pk.bowls[sheetState.bi], f = el.dataset.f, i = b.indexOf(f); if (i >= 0) b.splice(i, 1); else if (b.length < 3) b.push(f); drawFlavors($("#flQ").value); render(); },
    "pk-delete": (el) => {
      const name = el.dataset.name || S.pk.name; pendingPick = name;
      openSheet(t("pickDelete"), `<div class="sheet-b"><p class="confirm-t">${esc(t("confirmPick", { n: name }))}</p><div class="btn-row"><button type="button" class="btn quiet" data-act="sheet-close">${esc(t("cancel"))}</button><button type="button" class="btn danger" data-act="pk-delete-yes">${esc(t("yesDelete"))}</button></div></div>`);
    },
    "pk-delete-yes": async (el) => {
      const name = pendingPick;
      const r = await act(el, async () => { const res = await api("DELETE", "/api/picks/" + encodeURIComponent(name)); const picks = (S.state.picks ? clone(S.state.picks) : clone(BASE.sections.find((s) => s.id === "hookah").staffPicks).map((p) => ({ name: p.name, title: p.title, picks: p.picks, note: p.note || null }))).filter((p) => p.name !== name); S.state.picks = picks; S.state.v = res.v; rebuild(); return true; });
      if (r.ok) { closeSheet(); S.pk = null; toast(t("pickRemoved")); go("#/pick"); }
    },
    "pick-add": () => openAddPick(),
    "pick-create": (el) => { closeSheet(true); S.pk = null; go("#/pick/" + encodeURIComponent(el.dataset.name)); },
    "pick-from-user": (el) => startPick(el.dataset.name, el.dataset.user),
    // products
    acc: (el) => { const id = el.dataset.id; S.openSecs.has(id) ? S.openSecs.delete(id) : S.openSecs.add(id); el.setAttribute("aria-expanded", String(S.openSecs.has(id))); $("#acc-" + id).classList.toggle("open", S.openSecs.has(id)); },
    "prod-clear": () => { S.pq = ""; render(); $("#prodQ").focus(); },
    "it-veg": (el) => { S.it.veg = !S.it.veg; keepForm(); },
    "it-hidden": (el) => { S.it.hidden = !S.it.hidden; keepForm(); },
    "nw-veg": () => { S.nw.veg = !S.nw.veg; keepForm(); },
    "it-reset": (el) => {
      const f = el.dataset.f, r = itemRow(S.it.key), base = S.baseIdx.get(S.it.key); if (!base) return;
      if (f === "name") { S.it.nEn = base.name[0]; S.it.nTr = base.name[1]; }
      if (f === "desc") { S.it.dEn = base.desc ? base.desc[0] : ""; S.it.dTr = base.desc ? base.desc[1] : ""; }
      if (f === "price") S.it.price = base.price;
      if (f === "veg") S.it.veg = !!base.veg;
      S.it.reset[f] = true; keepForm();
    },
    "it-delete": (el) => {
      const r = itemRow(S.it.key);
      openSheet(t("deleteItem"), `<div class="sheet-b"><p class="confirm-t">${esc(t("confirmDelItem", { n: L(r.item.name) }))}</p><div class="btn-row"><button type="button" class="btn quiet" data-act="sheet-close">${esc(t("cancel"))}</button><button type="button" class="btn danger" data-act="it-delete-yes">${esc(t("yesDelete"))}</button></div></div>`);
    },
    "it-delete-yes": async (el) => {
      const key = S.it.key;
      const r = await act(el, async () => {
        const res = await api("DELETE", "/api/items/" + encodeURIComponent(key));
        S.state.added = (S.state.added || []).filter((a) => "new:" + a.id !== key); if (S.state.items) delete S.state.items[key]; S.state.unavailable = (S.state.unavailable || []).filter((k) => k !== key); S.state.v = res.v; rebuild(); return true;
      });
      if (r.ok) { closeSheet(); S.it = null; toast(t("saved")); go("#/products"); }
    },
    "photo-label": (el, e) => { /* the <label for> opens the file picker; Enter/Space on the label does the same */ },
    "photo-use": (el) => usePhoto(el),
    "photo-base": async (el) => {
      const d = S.it;
      const r = await act(el, async () => { const res = await api("PATCH", "/api/items/" + encodeURIComponent(d.key), { img: null }); applyPatchLocal(d.key, { img: null }); S.state.v = res.v; rebuild(); return true; });
      if (r.ok) { toast(t("saved")); render(); }
    },
    // hookah
    "hk-best": (el) => { const f = el.dataset.f, i = S.hk.best.indexOf(f); i >= 0 ? S.hk.best.splice(i, 1) : S.hk.best.push(f); hkRender(); },
    "hk-move": (el) => openMoveSheet(el.dataset.f),
    "hk-to": (el) => {
      const f = el.dataset.f, to = el.dataset.to; hkRemove(f);
      to === "classic" ? S.hk.classic.push(f) : S.hk.premium[to.slice(6)].push(f);
      closeSheet(); hkRender(); toast(t("hkMoved", { f, w: to === "classic" ? t("hkClassic") : to.slice(6) }));
    },
    "hk-del": (el) => { hkRemove(el.dataset.f); S.hk.best = S.hk.best.filter((x) => x !== el.dataset.f); closeSheet(); hkRender(); },
    "hk-discard": () => { S.hk = null; render(); },
    "hk-save": (el) => saveHookah(el),
    // users
    "user-add": () => openAddUser(),
    "user-open": (el) => openUser(el.dataset.name),
    "users-reload": () => { S.usersErr = null; S.users = null; $("#usersBody").innerHTML = usersBodyHtml(); loadUsers(); },
    "log-reload": () => { S.logErr = null; S.log = null; $("#logBody").innerHTML = logBodyHtml(); loadLog(); },
    seg: async (el) => {
      const val = el.dataset.val;
      if (!usheet.name) { usheet.role = val; $$("#uaRole [data-act=seg]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.val === val))); const pb = $("#uaPickBox"); if (pb) pb.hidden = val !== "server"; return; }
      if (val === usheet.role) return;
      const ok = await patchUser(el, { role: val }, t("saved"));
    },
    "user-active": (el) => patchUser(el, { active: el.dataset.val === "1" }, t("saved")),
    "user-del": () => {
      openSheet(t("deleteUser"), `<div class="sheet-b"><p class="confirm-t">${esc(t("confirmDelUser", { n: usheet.name }))}</p><div id="upErr" role="alert"></div><div class="btn-row"><button type="button" class="btn quiet" data-act="user-back">${esc(t("cancel"))}</button><button type="button" class="btn danger" data-act="user-del-yes">${esc(t("yesDelete"))}</button></div></div>`);
    },
    "user-back": () => openUser(usheet.name),
    "user-del-yes": async (el) => {
      const name = usheet.name;
      const r = await act(el, async () => { await api("DELETE", "/api/users/" + encodeURIComponent(name)); await loadUsers(); return true; }, { inline: (m) => sheetErr("upErr", m) });
      if (r.ok) { closeSheet(); toast(t("saved")); }
    },
  };
  // Version 2: panel-owned groups and ordered sliders (docs/api.md).
  // Hookah has flavor best sellers; every other section can own a product slider.
  const carouselSecs = () => BASE.sections.filter((s) => s.id !== "hookah");
  const canCarousel = (id) => carouselSecs().some((s) => s.id === id);
  const sliderTitle = (id) => id === "featured" ? t("featured") : L(BASE.sections.find((s) => s.id === id).title) + " · " + t("bestSellers");
  function sliderKeys(id) {
    if (id === "featured") return clone(Array.isArray(S.state.featured) ? S.state.featured : (BASE.featured || []).map(([sec, name]) => sec + "/" + name));
    const sec = BASE.sections.find((s) => s.id === id);
    return clone(Array.isArray((S.state.carousels || {})[id]) ? S.state.carousels[id] : (sec.carousel || []).map((name) => id + "/" + name));
  }
  const sliderBody = (id, value) => id === "featured" ? { featured: value } : { carousels: { [id]: value } };
  async function putSlider(id, value) {
    await api("PUT", "/api/sliders", sliderBody(id, value));
    await loadState(); // Read the exact persisted target; also reconciles deleted items.
  }
  function sliderWarning(r) {
    return `${!r.item.img ? `<span class="tag out">${esc(t("noPhoto"))}</span>` : ""}${r.hidden ? `<span class="tag out">${esc(t("hiddenTag"))}</span>` : ""}`;
  }
  function sliderShortcuts(key, sec, fresh) {
    const d = fresh ? S.nw : null;
    return `<h2 class="sub">${esc(t("sliders"))}</h2>${fresh ? `<p class="hint">${esc(t("normalItem"))}</p>` : ""}${["featured", ...(canCarousel(sec) ? [sec] : [])].map((id) => toggleHtml(id, fresh ? !!d[id === "featured" ? "featured" : "carousel"] : sliderKeys(id).includes(key), t("showIn", { n: sliderTitle(id) }), t("sliderWarn"), "slider-toggle", `data-id="${esc(id)}" data-fresh="${fresh ? "1" : "0"}" data-key="${esc(key || "")}"`)).join("")}`;
  }
  function slidersHtml() {
    return `<a class="back" href="#/products">${ico("left")}${esc(t("prodT"))}</a><div class="head"><div><h1 class="title">${esc(t("sliders"))}</h1><p class="lede">${esc(t("sliderLede"))}</p></div></div><div class="list">${["featured", ...carouselSecs().map((s) => s.id)].map((id) => `<button type="button" class="link-row" data-act="slider-open" data-id="${esc(id)}">${ico("star")}<div class="itext"><div class="iname">${esc(sliderTitle(id))}</div><div class="imeta">${esc(t("itemsCount", { n: sliderKeys(id).length }))}</div></div>${ico("right", "chev")}</button>`).join("")}</div>`;
  }
  function openSlider(id) { S.sl = { id, value: sliderKeys(id), q: "" }; drawSlider(); }
  function drawSlider() {
    const d = S.sl, keys = d.value === null ? sliderKeysBase(d.id) : d.value;
    openSheet(sliderTitle(d.id), `<div class="sheet-b"><p class="hint">${esc(t("sliderWarn"))}</p><p class="hint">${esc(t("sliderLimit"))} · ${keys.length}/20</p>${d.value === null ? `<p class="hint">${esc(t("resetPending"))}</p>` : ""}<div class="list">${keys.map((key, i) => {
      const r = itemRow(key);
      return `<div class="card"><div class="irow">${r ? itemThumb(r) : ico("alert")}<div class="itext"><div class="iname">${esc(r ? L(r.item.name) : key)}</div><div class="imeta">${r ? sliderWarning(r) : esc(t("stale"))}</div></div></div><div class="btn-row slider-actions">${[[-1, "up"], [1, "down"]].map(([dir, label]) => `<button type="button" class="btn sm quiet" data-act="slider-move" data-i="${i}" data-dir="${dir}" aria-label="${esc(t(label))}: ${esc(r ? L(r.item.name) : key)}" ${(dir < 0 ? i === 0 : i === keys.length - 1) ? "disabled" : ""}>${esc(t(label))}</button>`).join("")}<button type="button" class="btn sm danger" data-act="slider-remove" data-i="${i}" aria-label="${esc(t("remove"))}: ${esc(r ? L(r.item.name) : key)}">${ico("x")}${esc(t("remove"))}</button></div></div>`;
    }).join("") || `<div class="empty"><p>${esc(t("sliderOff"))}</p></div>`}</div><div class="btn-row"><button type="button" class="btn quiet" data-act="slider-picker" ${keys.length >= 20 ? "disabled" : ""}>${ico("plus")}${esc(t("addItem"))}</button></div><div class="btn-row"><button type="button" class="btn danger" data-act="slider-off">${esc(t("disableSlider"))}</button><button type="button" class="btn quiet" data-act="slider-base">${esc(t("toBase"))}</button></div><div class="btn-row"><button type="button" class="btn quiet" data-act="sheet-close">${esc(t("cancel"))}</button><button type="button" class="btn primary" data-act="slider-save">${esc(t("saveChanges"))}</button></div></div>`);
  }
  function sliderKeysBase(id) {
    return id === "featured" ? (BASE.featured || []).map(([sec, n]) => sec + "/" + n) : (BASE.sections.find((s) => s.id === id).carousel || []).map((n) => id + "/" + n);
  }
  function sliderDraft() { if (S.sl.value === null) S.sl.value = sliderKeysBase(S.sl.id); return S.sl.value; }
  function openSliderPicker() {
    openSheet(t("addItem"), `<div class="search">${ico("search")}<input type="search" id="sliderQ" value="${esc(S.sl.q)}" aria-label="${esc(t("search"))}" placeholder="${esc(t("searchPh"))}" autocomplete="off"></div><div class="sheet-b"><p class="hint">${esc(t("sliderWarn"))}</p><div id="sliderChoices" class="list"></div><div class="btn-row"><button type="button" class="btn quiet block" data-act="slider-back">${ico("left")}${esc(t("back"))}</button></div></div>`, () => drawSliderChoices());
  }
  function drawSliderChoices() {
    const d = S.sl, keys = d.value === null ? sliderKeysBase(d.id) : d.value, q = fold(d.q.trim());
    const rows = S.items.filter((r) => (d.id === "featured" || r.sec.id === d.id) && !keys.includes(r.key) && (!q || fold(r.item.name.join(" ") + " " + r.sec.title.join(" ")).includes(q)));
    $("#sliderChoices").innerHTML = rows.map((r) => `<button type="button" class="link-row" data-act="slider-pick" data-key="${esc(r.key)}" ${keys.length >= 20 ? "disabled" : ""}>${itemThumb(r)}<div class="itext"><div class="iname">${esc(L(r.item.name))}</div><div class="imeta">${esc(L(r.sec.title))}${sliderWarning(r)}</div></div>${ico("plus")}</button>`).join("") || `<div class="empty"><p>${esc(t("noMatch"))}</p></div>`;
  }
  let groupDraft = null;
  function openGroup(sec, id, fromNew) {
    const cur = (S.state.groups || []).find((g) => g.id === id);
    groupDraft = { sec, id, fromNew: !!fromNew };
    const occupied = cur && (S.state.added || []).some((a) => a.section === sec && a.group === "g:" + id);
    openSheet(t(cur ? "editGroup" : "addGroup"), `<form class="sheet-b" id="groupForm" novalidate><label class="field"><span>${esc(t("nameEn"))}</span><input type="text" id="groupEn" value="${esc(cur ? cur.title[0] : "")}" maxlength="400" autofocus></label><label class="field"><span>${esc(t("nameTr"))}</span><input type="text" id="groupTr" value="${esc(cur ? cur.title[1] : "")}" maxlength="400"></label><label class="field"><span>${esc(t("layout"))}</span><select id="groupLayout">${(sec === "hookah" ? ["list"] : ["rail", "grid", "list"]).map((l) => `<option value="${l}" ${cur && cur.layout === l ? "selected" : ""}>${esc(t("layout_" + l))}</option>`).join("")}</select></label><p class="hint">${esc(t("noteBoth"))}</p><div id="groupErr" role="alert"></div><div class="btn-row"><button type="button" class="btn quiet" data-act="sheet-close">${esc(t("cancel"))}</button><button type="submit" class="btn primary">${esc(t("saveChanges"))}</button></div>${cur ? `<button type="button" class="btn danger block" style="margin-top:16px" data-act="group-delete" ${occupied ? "disabled" : ""}>${ico("trash")}${esc(t("deleteGroup"))}</button>${occupied ? `<p class="hint">${esc(t("groupNotEmpty"))}</p>` : ""}` : ""}</form>`);
  }
  async function saveGroup(btn) {
    const d = groupDraft, title = pairOrNull($("#groupEn").value, $("#groupTr").value), layout = $("#groupLayout").value;
    if (!title) return sheetErr("groupErr", t("nameNeed"));
    const r = await act(btn, async () => {
      const res = await api(d.id ? "PATCH" : "POST", "/api/groups" + (d.id ? "/" + encodeURIComponent(d.id) : ""), d.id ? { title, layout } : { section: d.sec, title, layout });
      await loadState(); return d.id || res.id;
    }, { inline: (m) => sheetErr("groupErr", m) });
    if (r.ok) { if (d.fromNew && S.nw) S.nw.gi = "g:" + r.value; S.openSecs.add(d.sec); closeSheet(true); render(); toast(t("saved")); }
  }
  Object.assign(ACT, {
    "group-add": (el) => openGroup(el.dataset.sec, null, false),
    "group-edit": (el) => openGroup(el.dataset.sec, el.dataset.id, false),
    "group-delete": async (el) => {
      const d = groupDraft;
      const r = await act(el, async () => { await api("DELETE", "/api/groups/" + encodeURIComponent(d.id)); await loadState(); }, { inline: (m) => sheetErr("groupErr", m) });
      if (r.ok) { closeSheet(true); render(); toast(t("saved")); }
    },
    "slider-open": (el) => openSlider(el.dataset.id),
    "slider-picker": () => openSliderPicker(),
    "slider-back": () => drawSlider(),
    "slider-pick": (el) => { const keys = sliderDraft(); if (keys.length < 20 && !keys.includes(el.dataset.key)) keys.push(el.dataset.key); drawSlider(); },
    "slider-move": (el) => { const keys = sliderDraft(), i = +el.dataset.i, j = i + +el.dataset.dir; if (j >= 0 && j < keys.length) [keys[i], keys[j]] = [keys[j], keys[i]]; drawSlider(); },
    "slider-remove": (el) => { sliderDraft().splice(+el.dataset.i, 1); drawSlider(); },
    "slider-off": () => { S.sl.value = []; drawSlider(); },
    "slider-base": () => { S.sl.value = null; drawSlider(); },
    "slider-save": async (el) => { const d = S.sl; const r = await act(el, () => putSlider(d.id, d.value)); if (r.ok) { closeSheet(true); render(); toast(t("saved")); } },
    "slider-toggle": async (el) => {
      const id = el.dataset.id, fresh = el.dataset.fresh === "1";
      if (fresh) { const field = id === "featured" ? "featured" : "carousel"; S.nw[field] = !S.nw[field]; keepForm(); return; }
      const key = el.dataset.key;
      const r = await act(el, async () => { await loadState(); const keys = sliderKeys(id), on = keys.includes(key); if (!on && keys.length >= 20) throw new ApiError("slider_limit", 400); await putSlider(id, on ? keys.filter((k) => k !== key) : keys.concat(key)); });
      if (r.ok) { keepForm(); toast(t("saved")); }
    },
  });
  document.addEventListener("input", (e) => { if (e.target.id === "sliderQ") { S.sl.q = e.target.value; drawSliderChoices(); } });
  document.addEventListener("change", (e) => {
    if (e.target.matches('[data-bind="nw.gi"]')) { const v = e.target.value; if (v === "+") { e.target.value = String(S.nw.gi); openGroup(S.nw.sec, null, true); } else S.nw.gi = v.startsWith("g:") ? v : +v; }
  });
  // Re-draw the open form (toggles etc.) without losing typed values: they already live in S.it / S.nw.
  function keepForm() { const y = window.scrollY; const route = parseRoute(); $("#main").firstElementChild.innerHTML = SCREENS[route.name](route); window.scrollTo(0, y); }

  document.addEventListener("click", (e) => {
    const lb = e.target.closest("[data-lang]");
    if (lb) { lang = lb.dataset.lang; try { localStorage.setItem("huqqa-lang", lang); } catch (_) {} if (S.user) { render(); } else { const nm = $("#lgName") && $("#lgName").value; renderLogin(); if (nm) $("#lgName").value = nm; } return; }
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const fn = ACT[el.dataset.act];
    if (fn) {
      if (el.dataset.act !== "photo-label") e.preventDefault();
      if (!/^err-/.test(el.dataset.act)) {
        const ds = Object.assign({}, el.dataset);
        const ghost = { dataset: ds, isConnected: false, getAttribute: () => null, setAttribute() {}, removeAttribute() {}, tagName: "X", matches: () => false };
        lastRun = () => fn(el.isConnected ? el : ghost, e);
      }
      fn(el, e);
    }
  });
  document.addEventListener("keydown", (e) => { const l = e.target.closest && e.target.closest('[data-act="photo-label"]'); if (l && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); $("#photoFile").click(); } });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.id === "stockQ") { S.q = el.value; refreshStock(); return; }
    if (el.id === "prodQ") { S.pq = el.value; const q = fold(S.pq.trim()); const c = $(".search .clear"); if (c) c.hidden = !S.pq; $("#prodDyn").innerHTML = prodBodyHtml(); return; }
    const b = el.dataset && el.dataset.bind;
    if (b === "nw.gi" && el.value === "+") return;
    if (b) { let v = el.value; if (el.dataset.num) v = +v; const root = setPath(b, v); if (S.it && root === "it") S.it.reset[{ nEn: "name", nTr: "name", dEn: "desc", dTr: "desc", price: "price" }[b.split(".")[1]]] = false; if (root === "pk") pkRefresh(); }
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.id === "photoFile") { onPhotoChosen(el.files && el.files[0]); el.value = ""; return; }
    const b = el.dataset && el.dataset.bind;
    if (b && el.dataset.rerender) { setPath(b, el.value); if (b === "nw.sec") { S.nw.gi = 0; S.nw.carousel = false; } keepForm(); }
  });
  document.addEventListener("submit", (e) => { e.preventDefault(); const f = e.target; lastRun = () => onSubmit(f); onSubmit(f); });
  function onSubmit(f) {
    const btn = $('button[type="submit"]', f);
    if (f.id === "loginForm") return doLogin(f);
    if (f.id === "pkForm") return savePick(btn);
    if (f.id === "itForm") return saveItem(btn);
    if (f.id === "nwForm") return createItem(btn);
    if (f.id === "groupForm") return saveGroup(btn);
    if (f.id === "uaForm") return createUser(btn);
    if (f.id === "apForm") return startPick($("#apName").value, null);
    switch (f.dataset.form) {
      case "hk-add": {
        const where = f.dataset.where, inp = $("input", f), name = inp.value.trim().replace(/\s+/g, " ");
        if (!name) return;
        const at = hkWhere(name); if (at) return hkErr(where, t("hkDup", { f: name, w: at }));
        where === "classic" ? S.hk.classic.push(name) : S.hk.premium[where.slice(6)].push(name);
        hkRender(); const again = $(`form[data-where="${CSS.escape(where)}"] input`); if (again) again.focus(); return;
      }
      case "hk-brand": {
        const inp = $("input", f), name = inp.value.trim().replace(/\s+/g, " "); if (!name) return;
        if (Object.keys(S.hk.premium).some((b) => b.toLowerCase() === name.toLowerCase())) return hkErr("newbrand", t("hkBrandExists"));
        S.hk.premium[name] = []; hkRender(); toast(t("hkBrandAdded")); const again = $(`form[data-where="${CSS.escape("brand:" + name)}"] input`); if (again) again.focus(); return;
      }
      case "hk-to-new": {
        const f2 = f.dataset.f, name = $("input", f).value.trim().replace(/\s+/g, " "); if (!name) return;
        const ex = Object.keys(S.hk.premium).find((b) => b.toLowerCase() === name.toLowerCase());
        hkRemove(f2); const brand = ex || name; if (!ex) S.hk.premium[brand] = []; S.hk.premium[brand].push(f2);
        closeSheet(); hkRender(); toast(t("hkMoved", { f: f2, w: brand })); return;
      }
      case "user-pick": return patchUser(btn, { pickName: $("#upPick").value.trim() || null }, t("saved"));
      case "user-pin": {
        const pin = $("#upPin").value.trim(); if (!/^\d{4,12}$/.test(pin)) return sheetErr("upErr", t("needPin"));
        return patchUser(btn, { pin }, t("pinSet")).then((ok) => { if (ok && $("#upPin")) $("#upPin").value = ""; });
      }
    }
  }
  // Stale data: when the phone wakes up or the tab comes back, reload the menu state (other staff may have changed it).
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && S.user && S.state && Date.now() - S.loadedAt > 20000 && !$("#sheetRoot").firstChild) {
      loadState().then(() => { if (!$("#sheetRoot").firstChild && !document.activeElement.matches("input, textarea, select")) render(); }).catch(() => {});
    }
  });

  // ======================================================================================== boot
  try {
    const me = await api("GET", "/api/me");
    S.user = me.user;
    await enter();
  } catch (e) {
    if (e instanceof ApiError && e.code === "network") { renderLogin(t("network")); }
    else renderLogin("");
  }
  window.HQ_PANEL = { S, api };   // handy in the console while testing
})();
