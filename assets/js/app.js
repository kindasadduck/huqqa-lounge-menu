(() => {
  const M = window.MENU;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const UI = {
    brandSub: ["Hookah & Turkish Kitchen", "Nargile & Türk Mutfağı"],
    ourMenu: ["Our <em>Menu</em>", "<em>Menümüz</em>"],
    halal: ["100% Halal", "%100 Helal"],
    featured: ["Featured", "Öne Çıkanlar"],
    featuredTag: ["House favorites", "Favoriler"],
    bestSellers: ["Best sellers", "Çok satanlar"],
    details: ["Details", "Detaylar"],
    search: ["Search", "Ara"],
    searchPlaceholder: ["Search the menu", "Menüde ara"],
    close: ["Close", "Kapat"],
    backToTop: ["Back to top", "Başa dön"],
    noResults: ["Nothing matches “{q}”.", "“{q}” ile eşleşen ürün yok."],
    thanks: ["Thank you for visiting", "Bizi tercih ettiğiniz için teşekkürler"],
    flavorCount: ["flavors", "aroma"],
    served: ["Served", "Servis"],
    hot: ["Hot", "Sıcak"],
    iced: ["Iced", "Buzlu"],
    size: ["Size", "Boy"],
    flavors: ["Flavors", "Aromalar"],
    tapPreview: ["Tap an option to see it.", "Görmek için bir seçeneğe dokunun."],
  };

  const ICON = {
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    hot: '<svg viewBox="0 0 24 24"><path d="M8 3c-1 1.5 1 2.5 0 4M12 3c-1 1.5 1 2.5 0 4M16 3c-1 1.5 1 2.5 0 4M4 10h14v4a6 6 0 01-6 6h-2a6 6 0 01-6-6v-4zM18 11h1a2 2 0 010 4h-1"/></svg>',
    iced: '<svg viewBox="0 0 24 24"><path d="M12 2v20M4 6.5l16 11M20 6.5l-16 11M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/></svg>',
    cup: '<svg viewBox="0 0 24 24"><path d="M5 9h12v5a5 5 0 01-5 5h-2a5 5 0 01-5-5V9zM17 10h1.5a2.5 2.5 0 010 5H17M9 3v3M13 3v3"/></svg>',
  };

  // ---- state & helpers ----------------------------------------------------
  let lang = "en";
  try { if (localStorage.getItem("huqqa-lang") === "tr") lang = "tr"; } catch (_) {}

  const L = (pair) => (pair ? pair[lang === "tr" ? 1 : 0] : "");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fold = (s) => s.toLocaleLowerCase("tr").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
  const img = (slug, size) => `assets/img/${slug}${size === "sm" ? "-sm" : ""}.webp`;
  const findItem = (sectionId, name) => {
    const s = M.sections.find((x) => x.id === sectionId);
    for (const g of s.groups) for (const it of g.items) if (it.name[0] === name) return [it, s];
    throw new Error(`Menu item not found: ${sectionId} / ${name}`);
  };

  // ---- rendering ----------------------------------------------------------
  const photoCard = (it, kicker) => `
    <button type="button" class="pcard" data-photo="${it.img}" data-name="${esc(L(it.name))}" data-price="${esc(it.price)}">
      <img src="${img(it.img)}" alt="" loading="lazy">
      <div class="pcard-body">
        ${kicker ? `<div class="kicker">${esc(kicker)}</div>` : ""}
        <div class="pcard-name">${esc(L(it.name))}</div>
        ${it.desc ? `<div class="pcard-desc">${esc(L(it.desc))}</div>` : ""}
        <div class="pcard-price">${esc(it.price)}</div>
      </div>
    </button>`;

  // Names and descriptions in both languages, so "adana" also finds the Huqqa Mix Kebab.
  const searchKey = (it) => esc(fold([...it.name, ...(it.desc || []), ...(it.extra || [])].join(" ")));

  const row = (it) => {
    const thumb = it.img
      ? `<button type="button" class="thumb" data-photo="${it.img}" data-name="${esc(L(it.name))}" data-price="${esc(it.price)}" aria-label="${esc(L(it.name))}">
           <img src="${img(it.img, "sm")}" alt="" loading="lazy" width="64" height="64"></button>`
      : `<div class="thumb empty" aria-hidden="true">${ICON.cup}</div>`;
    return `
      <div class="row" data-search="${searchKey(it)}">
        ${thumb}
        <div>
          <div class="row-name">${esc(L(it.name))}</div>
          ${it.desc ? `<div class="row-desc">${esc(L(it.desc))}</div>` : ""}
          ${it.extra ? `<div class="row-extra">${esc(L(it.extra))}</div>` : ""}
        </div>
        <div class="price">${esc(it.price)}</div>
      </div>`;
  };

  const plainRow = (it) => `
    <div class="row plain" data-search="${searchKey(it)}"${it.brands ? ` data-brands="${esc(it.brands.join("|"))}"` : ""}>
      <div class="row-name">${esc(L(it.name))}</div>
      <div class="price">${esc(it.price)}</div>
    </div>`;

  const note = (n) => (n ? `<div class="note">${esc(L(n))}</div>` : "");

  const group = (g, rowFn = row) => `
    <div class="group">
      ${g.title ? `<h3 class="sub">${esc(L(g.title))}</h3>` : ""}
      <div class="list">${g.items.map(rowFn).join("")}</div>
      ${note(g.note)}
    </div>`;

  // Three copies of the cards so the rail can loop seamlessly in both directions;
  // the outer copies are hidden from assistive tech and keyboard focus.
  const rail = (cards, extraClass = "") => {
    const clones = cards.map((c) => c.replace("<button ", '<button aria-hidden="true" tabindex="-1" ')).join("");
    return `<div class="rail ${extraClass}" data-count="${cards.length}">${clones}${cards.join("")}${clones}</div>`;
  };

  const carousel = (s) => {
    if (!s.carousel) return "";
    const cards = s.carousel.map((name) => photoCard(findItem(s.id, name)[0]));
    return `<h3 class="sub">${esc(L(UI.bestSellers))}</h3>${rail(cards)}
      <div class="divider" aria-hidden="true"><span></span></div>`;
  };

  // Photo card with the name and price over the photo. Cards with a description or add-on
  // note open a details bar under their row; cards without either are not tappable.
  const gridCard = (it, wide) => {
    const tappable = it.desc || it.extra;
    const tag = tappable ? "button" : "div";
    const attrs = tappable
      ? `type="button" aria-expanded="false" aria-label="${esc(`${L(it.name)}, ${it.price}, ${L(UI.details)}`)}"
         data-desc="${esc(L(it.desc))}" data-extra="${esc(L(it.extra))}"`
      : "";
    return `
      <${tag} class="gcard${wide ? " wide" : ""}" ${attrs} data-search="${searchKey(it)}"
              data-name="${esc(L(it.name))}" data-price="${esc(it.price)}">
        <img src="${img(it.img)}" alt="" loading="lazy"${it.focus ? ` style="object-position: ${it.focus} 50%"` : ""}>
        <div class="gcard-body">
          <div class="gcard-text">
            <div class="gcard-name">${esc(L(it.name))}</div>
            <div class="gcard-price">${esc(it.price)}</div>
          </div>
          ${tappable ? `<span class="gcard-arrow" aria-hidden="true">${ICON.chevron}</span>` : ""}
        </div>
      </${tag}>`;
  };

  // With an odd number of items the first card spans both columns, so rows stay full.
  const gridGroup = (g) => `
    <div class="group">
      ${g.title ? `<h3 class="sub">${esc(L(g.title))}</h3>` : ""}
      <div class="grid">${g.items.map((it, n) => gridCard(it, n === 0 && g.items.length % 2 === 1)).join("")}</div>
      ${note(g.note)}
    </div>`;

  const money = (n) => `$${n.toFixed(2)}`;

  // Both the regular and the happy-hour price are rendered; body.hh decides which shows.
  const tierPrice = (price, discount) => {
    if (!discount) return `<span class="price">${esc(price)}</span>`;
    const discounted = money(parseFloat(price.slice(1)) - discount);
    return `<span class="price"><span class="hh-off">${esc(price)}</span>` +
      `<span class="hh-on"><s>${esc(price)}</s>${discounted}</span></span>`;
  };

  const happyHour = (hh) => (hh ? `
    <div class="hh-card hh-on">
      <div class="hh-title"><span class="hh-live" aria-hidden="true"></span>${esc(L(hh.title))}</div>
      <div class="hh-deal">${esc(L(hh.now))}</div>
      <div class="hh-ends" id="hhEnds"></div>
    </div>
    <div class="note hh-off hh-note">${esc(L(hh.note))}</div>` : "");

  const brandOf = (t, f) => t.brand || Object.keys(t.brandOf || {}).find((b) => t.brandOf[b].includes(f)) || "";

  // Brand filter: one brand at a time; tapping the active brand again shows everything.
  let brand = null;
  const brandButtons = (s) => `<div class="brands" role="group" aria-label="Brands">${s.brandFilter.map((b) =>
    `<button type="button" class="brand-btn" data-brand="${esc(b)}" aria-pressed="false">${esc(b)}</button>`).join("")}</div>`;
  function applyBrand() {
    $$(".brand-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.brand === brand)));
    $$("[data-brands]").forEach((el) => el.classList.toggle("off", !!brand && !el.dataset.brands.split("|").includes(brand)));
  }

  // TEST ONLY (remove later): switch that forces happy hour on/off, overriding the clock.
  let hhTest = null;
  const hhTestSwitch = () => `
    <button type="button" class="hh-test" id="hhTest" role="switch" aria-checked="false">
      <span class="hh-test-track"><span></span></span>Happy hour test
    </button>`;

  const hookah = (s) => {
    const tiers = s.tiers.map((t) => `
      <div class="tier" data-search="${esc(fold(t.title.join(" ")))}" data-brands="${esc([t.brand, ...Object.keys(t.brandOf || {})].filter(Boolean).join("|"))}">
        <div class="tier-head"><h3>${esc(L(t.title))}</h3>${tierPrice(t.price, s.happyHour && t.hhDiscount)}</div>
        <div class="flavors">${t.flavors.map((f) => `<span class="flavor" data-search="${esc(fold(f))}" data-brands="${esc(brandOf(t, f))}">${esc(f)}</span>`).join("")}</div>
      </div>`).join("");
    return hhTestSwitch() + happyHour(s.happyHour) + tiers + s.groups.map((g) => group(g, plainRow)).join("");
  };

  // ---- drinks -------------------------------------------------------------
  // Drink cards open the same details bar as the food cards. Options picked in the bar
  // (hot/iced, flavor, size) swap the card's photo; picks survive a language switch.
  const drinkSel = {};
  let drinkList = [];
  let heroPick = 0;
  const choices = (it) => it.flavors || (it.sizes && it.sizes.map(([n]) => n));
  const selOf = (it) => drinkSel[it.name[0]] || (drinkSel[it.name[0]] = { iced: false, opt: 0 });
  const drinkPhoto = (it) => {
    if (!it.v) return it.img;
    const s = selOf(it), c = choices(it);
    const key = [s.iced ? "Iced" : "", c ? c[s.opt][0] : ""].filter(Boolean).join(" ");
    return it.v[key] || it.img;
  };
  const drinkSearch = (it) => esc(fold([...it.name, ...(it.flavors || []).flat(), ...(it.desc || []), ...(it.note || [])].join(" ")));

  const drinkCard = (it, wide) => {
    const n = drinkList.push(it) - 1;
    const tappable = it.temps || choices(it) || it.desc || it.note;
    const tag = tappable ? "button" : "div";
    const attrs = tappable
      ? `type="button" aria-expanded="false" data-drink="${n}" aria-label="${esc(`${L(it.name)}, ${it.price}, ${L(UI.details)}`)}"`
      : "";
    const photo = drinkPhoto(it);
    return `
      <${tag} class="gcard${wide ? " wide" : ""}" ${attrs} data-search="${drinkSearch(it)}">
        ${photo ? `<img src="${img(photo)}" alt="" loading="lazy"${it.focus ? ` style="object-position: ${it.focus} 50%"` : ""}>` : `<span class="dph" aria-hidden="true">${ICON.cup}</span>`}
        ${it.temps ? `<span class="dtemp" aria-hidden="true">${ICON.hot}${ICON.iced}</span>` : ""}
        ${it.flavors && it.flavors.length > 2 ? `<span class="dcount">${it.flavors.length} ${esc(L(UI.flavorCount))}</span>` : ""}
        <div class="gcard-body">
          <div class="gcard-text">
            <div class="gcard-name">${esc(L(it.name))}</div>
            <div class="gcard-price">${esc(it.price)}</div>
          </div>
          ${tappable ? `<span class="gcard-arrow" aria-hidden="true">${ICON.chevron}</span>` : ""}
        </div>
      </${tag}>`;
  };

  const drinkBar = (n) => {
    const it = drinkList[n], s = selOf(it), pick = !!it.v;
    const chip = (label, kind, val, on) => pick
      ? `<button type="button" class="dchip" data-kind="${kind}" data-val="${val}" aria-pressed="${on}">${label}</button>`
      : `<span class="dchip">${label}</span>`;
    const block = (title, chips) => `<div class="dopt"><div class="dopt-label">${esc(L(title))}</div><div class="dchips">${chips}</div></div>`;
    return `<div class="gbar-inner" data-drink="${n}">
      <div class="gbar-head"><span>${esc(L(it.name))}</span><span class="price">${esc(it.sizes ? it.sizes[s.opt][1] : it.price)}</span></div>
      ${it.desc ? `<div class="gbar-desc">${esc(L(it.desc))}</div>` : ""}
      ${it.note ? `<div class="gbar-desc">${esc(L(it.note))}</div>` : ""}
      ${it.temps ? block(UI.served, [[UI.hot, 0], [UI.iced, 1]].map(([t, v]) => chip(esc(L(t)), "temp", v, s.iced === !!v)).join("")) : ""}
      ${it.sizes ? block(UI.size, it.sizes.map(([nm, p], k) => chip(`${esc(L(nm))} <b>${esc(p)}</b>`, "opt", k, s.opt === k)).join("")) : ""}
      ${it.flavors ? block(UI.flavors, it.flavors.map((f, k) => chip(esc(L(f)), "opt", k, s.opt === k)).join("")) : ""}
      ${pick && (it.flavors || it.sizes || []).length + (it.temps ? 2 : 0) > 1 ? `<div class="dhint">${esc(L(UI.tapPreview))}</div>` : ""}
    </div>`;
  };

  // Turkish tea banner: each size tile shows its photo; the Tea Pot tile also opens the flavored option.
  const drinksHero = (h) => {
    const tiles = h.tiles.map((t, k) => {
      const more = t.more ? drinkList.push(t.more) - 1 : -1;
      if (t.wide) return `<button type="button" class="dtile wide" data-swap="${t.img}" aria-pressed="${k === heroPick}"
          aria-expanded="false" data-drink="${more}">
        <span>${esc(L(t.name))} <small>· ${esc(L(t.sub))}</small></span>
        <span class="dtile-end"><span class="dtile-plus">${t.more.flavors.length} ${esc(L(UI.flavorCount))}</span><b>${esc(t.price)}</b></span>
      </button>`;
      return `<button type="button" class="dtile" data-swap="${t.img}" aria-pressed="${k === heroPick}"
          ${more >= 0 ? `aria-expanded="false" data-drink="${more}"` : ""}>
        ${esc(L(t.name))}<b>${esc(t.price)}</b>${t.plus ? `<span class="dtile-plus">${esc(L(t.plus))}</span>` : ""}
      </button>`;
    }).join("");
    const words = [h.title].concat(...h.tiles.map((t) => [t.name, t.search, t.more && t.more.name].concat(t.more ? t.more.flavors : [])));
    return `
      <div class="dhero" data-search="${esc(fold(words.filter(Boolean).flat().join(" ")))}">
        <div class="dhero-photo"><img src="${img(h.tiles[heroPick].img)}" alt=""></div>
        <div class="dhero-body">
          <div class="kicker">${esc(L(h.kicker))}</div>
          <h3>${esc(L(h.title))}</h3>
          <div class="dtiles">${tiles}</div>
        </div>
      </div>
      <div class="dslot"></div>`;
  };

  // Grid groups use the food card grid (taller cards, or all full-width with g.wide); rail groups swipe sideways.
  const drinksGroup = (g) => `
    <div class="group">
      ${g.title ? `<h3 class="sub">${esc(L(g.title))}</h3>` : ""}
      ${g.rail
        ? `<div class="drail">${g.items.map((it) => drinkCard(it)).join("")}</div><div class="dslot"></div>`
        : `<div class="grid dgrid">${g.items.map((it, n) => drinkCard(it, g.wide || (n === 0 && g.items.length % 2 === 1))).join("")}</div>`}
      ${note(g.note)}
    </div>`;

  const drinks = (s) => { drinkList = []; return drinksHero(s.hero) + s.groups.map(drinksGroup).join(""); };

  function swapPhoto(el, slug) {
    const im = $("img", el);
    if (!im || im.getAttribute("src") === img(slug)) return;
    const next = new Image();
    next.src = img(slug);
    next.decode().catch(() => {}).then(() => {
      im.src = next.src;
      im.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
    });
  }

  function pickOption(chip) {
    const inner = chip.closest("[data-drink]");
    const n = +inner.dataset.drink, it = drinkList[n], s = selOf(it);
    if (chip.dataset.kind === "temp") s.iced = chip.dataset.val === "1";
    else s.opt = +chip.dataset.val;
    $$(".dchip", inner).forEach((c) => c.setAttribute("aria-pressed",
      String(c.dataset.kind === "temp" ? s.iced === (c.dataset.val === "1") : s.opt === +c.dataset.val)));
    if (it.sizes) $(".gbar-head .price", inner).textContent = it.sizes[s.opt][1];
    if (openCard) swapPhoto(openCard, drinkPhoto(it));
  }

  function pickTile(tile) {
    const hero = tile.closest(".dhero");
    $$(".dtile", hero).forEach((t) => t.setAttribute("aria-pressed", String(t === tile)));
    heroPick = $$(".dtile", hero).indexOf(tile);
    swapPhoto(hero, tile.dataset.swap);
    if (tile.hasAttribute("aria-expanded")) toggleCard(tile);
    else if (openCard && openCard.classList.contains("dtile")) closeBar(true);
  }

  const section = (s) => {
    let body;
    if (s.layout === "grid") body = carousel(s) + s.groups.map(gridGroup).join("") + note(s.note);
    else if (s.layout === "hookah") body = hookah(s);
    else if (s.layout === "drinks") body = drinks(s);
    else if (s.layout === "plain") body = s.groups.map((g) => group(g, plainRow)).join("");
    else body = carousel(s) + s.groups.map((g) => group(g)).join("");
    return `
      <section class="section" id="${s.id}">
        <div class="section-head"><h2>${esc(L(s.title))}</h2>${s.brandFilter ? brandButtons(s) : `<span class="section-tag">${esc(L(s.tag))}</span>`}</div>
        ${body}
      </section>`;
  };

  const featured = () => {
    const cards = M.featured.map(([sid, name]) => {
      const [it, s] = findItem(sid, name);
      return photoCard(it, L(s.tabTitle || s.title));
    });
    return `
      <section class="section" id="featured">
        <div class="section-head"><h2>${esc(L(UI.featured))}</h2><span class="section-tag">${esc(L(UI.featuredTag))}</span></div>
        ${rail(cards, "big")}
      </section>`;
  };

  const hero = () => `
    <div class="hero">
      <h1>${L(UI.ourMenu)}</h1>
      <span class="halal">${ICON.check}${esc(L(UI.halal))}</span>
    </div>`;

  const footer = () => `
    <h2>${esc(L(UI.thanks))}</h2>
    <div class="foot-contact">
      <a href="${M.info.mapsHref}" target="_blank" rel="noopener">${esc(M.info.address)}</a><br>
      <a href="${M.info.phoneHref}">${esc(M.info.phone)}</a>
    </div>
    <ul class="notices">${M.notices.map((n) => `<li>${esc(L(n))}</li>`).join("")}</ul>`;

  // The pinned section (hookah) is left out of the scrolling tab list; it has its own tab on the right.
  const PINNED = "hookah";
  const tabs = () => [{ id: "featured", label: L(UI.featured) }]
    .concat(M.sections.filter((s) => s.id !== PINNED).map((s) => ({ id: s.id, label: L(s.tabTitle || s.title) })))
    .map((t) => `<a class="tab" href="#${t.id}" data-target="${t.id}">${esc(t.label)}</a>`).join("");

  function render() {
    document.documentElement.lang = lang;
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $$("[data-i18n]").forEach((el) => (el.textContent = L(UI[el.dataset.i18n])));
    $$("[data-i18n-label]").forEach((el) => el.setAttribute("aria-label", L(UI[el.dataset.i18nLabel])));
    $$("[data-i18n-placeholder]").forEach((el) => (el.placeholder = L(UI[el.dataset.i18nPlaceholder])));

    $("#tabs").innerHTML = tabs();
    const pinned = M.sections.find((x) => x.id === PINNED);
    $("#pinnedTab").innerHTML = esc(L(pinned.title)) +
      (pinned.happyHour ? ` <span class="hh-badge hh-on">HH</span>` : "");
    $("#menu").innerHTML = hero() + featured() + M.sections.map(section).join("") +
      `<div class="empty-state" id="empty" hidden></div>`;
    $("#foot").innerHTML = footer();
    openCard = null;
    measureHeader();
    applySearch();
    activeId = null;
    updateActive();
    setupRails();
    updateHappyHour();
    applyBrand();
  }

  // ---- happy hour (Virginia time) ----------------------------------------
  function updateHappyHour() {
    const hh = M.sections.find((x) => x.layout === "hookah").happyHour;
    if (!hh) return;
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
    const hour = +parts.hour;
    const inHours = hour >= hh.opens[day] && hour < hh.until;
    // ?hh=1 / ?hh=0 forces the state, for showing the happy hour look at any time of day.
    const forced = new URLSearchParams(location.search).get("hh");
    const live = hhTest !== null ? hhTest : forced === null ? inHours : forced === "1";
    const sw = $("#hhTest"); // TEST ONLY
    if (sw) sw.setAttribute("aria-checked", String(live));
    document.body.classList.toggle("hh", live);
    const ends = $("#hhEnds");
    if (live && ends && !inHours) ends.textContent = L(hh.endsAt);
    else if (live && ends) {
      const left = hh.until * 60 - (hour * 60 + +parts.minute);
      const h = Math.floor(left / 60), m = left % 60;
      const t = lang === "tr" ? `${h ? `${h} sa ` : ""}${m} dk` : `${h ? `${h}h ` : ""}${m}m`;
      ends.textContent = L(hh.endsIn).replace("{t}", t);
    }
  }
  setInterval(updateHappyHour, 60 * 1000);

  // ---- header height & scroll spy ----------------------------------------
  let headerH = 0;
  function measureHeader() {
    headerH = $("#top").offsetHeight;
    document.documentElement.style.setProperty("--header-h", `${headerH}px`);
  }

  let activeId = null;
  function updateActive() {
    const sections = $$(".section").filter((s) => s.offsetParent !== null);
    if (!sections.length) return;
    let current = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top - headerH - 12 <= 0) current = s;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1];
    if (current.id === activeId) return;
    activeId = current.id;
    $$(".tab").forEach((t) => {
      const on = t.dataset.target === activeId;
      t.setAttribute("aria-current", String(on));
      if (on && t.parentElement.id === "tabs") {
        const bar = $("#tabs");
        bar.scrollTo({ left: t.offsetLeft - (bar.clientWidth - t.offsetWidth) / 2, behavior: "smooth" });
      }
    });
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActive();
      $("#toTop").classList.toggle("show", window.scrollY > 600);
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener("resize", () => { measureHeader(); positionCaret(); });
  document.addEventListener("scroll", (e) => { if (e.target.classList && e.target.classList.contains("drail")) positionCaret(); }, { capture: true, passive: true });

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerH + 1, behavior: "smooth" });
  }

  // ---- auto-scrolling rails ---------------------------------------------
  // Rails drift right at a slow, constant speed and wrap around. Any touch, drag,
  // wheel or manual scroll pauses that rail; it resumes RESUME_MS after the last
  // interaction.
  const SPEED = 24; // px per second
  const RESUME_MS = 9000;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let rails = [];

  function setupRails() {
    rails.forEach((r) => r.observer.disconnect());
    rails = $$(".rail").map((el) => {
      const r = { el, pos: 0, pausedUntil: 0, touching: false, visible: true, idleTimer: 0 };
      const setWidth = () => {
        const n = +el.dataset.count;
        return el.children[n].offsetLeft - el.children[0].offsetLeft;
      };
      r.wrap = () => {
        const w = setWidth();
        if (!w) return;
        if (el.scrollLeft >= 2 * w) el.scrollLeft -= w;
        else if (el.scrollLeft < w) el.scrollLeft += w;
        r.pos = el.scrollLeft;
      };
      const hold = () => { r.pausedUntil = performance.now() + RESUME_MS; };
      const gutter = parseFloat(getComputedStyle(el).paddingLeft);
      // Scroll so `card` sits flush with the left gutter.
      r.align = (card) => {
        const left = el.scrollLeft + card.getBoundingClientRect().left - el.getBoundingClientRect().left - gutter;
        if (Math.abs(left - el.scrollLeft) > 1) el.scrollTo({ left, behavior: "smooth" });
      };
      const snapNearest = () => {
        const base = el.getBoundingClientRect().left + gutter;
        const nearest = [...el.children].reduce((a, c) =>
          Math.abs(c.getBoundingClientRect().left - base) < Math.abs(a.getBoundingClientRect().left - base) ? c : a);
        r.align(nearest);
      };

      el.scrollLeft = setWidth();
      r.pos = el.scrollLeft;

      el.addEventListener("touchstart", () => { r.touching = true; hold(); }, { passive: true });
      el.addEventListener("touchend", () => { r.touching = false; hold(); }, { passive: true });
      el.addEventListener("pointerdown", hold);
      el.addEventListener("wheel", hold, { passive: true });
      el.addEventListener("scroll", () => {
        if (Math.abs(el.scrollLeft - r.pos) < 2) return; // our own autoplay step
        hold();
        r.pos = el.scrollLeft;
        clearTimeout(r.idleTimer);
        r.idleTimer = setTimeout(() => {
          if (r.touching) return;
          r.wrap();
          snapNearest();
        }, 160);
      }, { passive: true });

      r.observer = new IntersectionObserver(([e]) => { r.visible = e.isIntersecting; });
      r.observer.observe(el);
      return r;
    });
  }

  let lastFrame = 0;
  function tick(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    const idle = !reduceMotion.matches && lb.hidden && !document.body.classList.contains("searching");
    for (const r of rails) {
      if (!idle || !r.visible || r.touching || now < r.pausedUntil) continue;
      r.pos += SPEED * dt;
      r.el.scrollLeft = r.pos;
      if (r.el.scrollLeft >= 2 * (r.el.children[+r.el.dataset.count].offsetLeft - r.el.children[0].offsetLeft)) r.wrap();
    }
    requestAnimationFrame(tick);
  }

  // ---- grill grid: details bar --------------------------------------------
  let openCard = null;

  function closeBar(animate) {
    const bar = $(".gbar:not(.closing)");
    if (openCard) openCard.setAttribute("aria-expanded", "false");
    openCard = null;
    if (!bar) return;
    if (!animate) { bar.remove(); return; }
    bar.classList.add("closing");
    bar.style.height = `${bar.scrollHeight}px`;
    bar.offsetHeight; // commit the pixel height so the collapse animates from it
    bar.style.height = "0px";
    setTimeout(() => bar.remove(), 300);
  }

  function positionCaret() {
    const bar = $(".gbar:not(.closing)");
    if (!bar || !openCard) return;
    const b = bar.getBoundingClientRect(), c = openCard.getBoundingClientRect();
    const x = Math.min(Math.max(c.left + c.width / 2 - b.left, 18), b.width - 18); // card may be scrolled off in a rail
    bar.style.setProperty("--caret", `${x}px`);
  }

  function toggleCard(card) {
    if (card === openCard) { closeBar(true); return; }
    closeBar(false);
    const bar = document.createElement("div");
    bar.className = "gbar";
    if (card.dataset.drink) {
      const it = drinkList[+card.dataset.drink];
      bar.innerHTML = drinkBar(+card.dataset.drink);
      Object.values(it.v || {}).forEach((slug) => { new Image().src = img(slug); }); // warm up option photos
    } else bar.innerHTML = `<div class="gbar-inner"><div class="gbar-head"><span>${card.dataset.name}</span><span class="price">${card.dataset.price}</span></div>
      ${card.dataset.desc ? `<div class="gbar-desc">${card.dataset.desc}</div>` : ""}
      ${card.dataset.extra ? `<div class="row-extra">${card.dataset.extra}</div>` : ""}</div>`;
    // Rails and the tea banner keep their bar in the slot right below them; grids put it under the card's row.
    const host = card.closest(".drail, .dhero");
    if (host) host.nextElementSibling.append(bar);
    else {
      const visible = $$(".gcard", card.parentElement).filter((c) => !c.hidden);
      visible.filter((c) => c.offsetTop === card.offsetTop).pop().after(bar);
    }
    openCard = card;
    card.setAttribute("aria-expanded", "true");
    positionCaret();
    requestAnimationFrame(() => { bar.style.height = `${bar.scrollHeight}px`; });
    bar.addEventListener("transitionend", () => { if (bar.isConnected && card === openCard) bar.style.height = "auto"; }, { once: true });
  }

  // ---- lightbox -----------------------------------------------------------
  const lb = $("#lightbox"), lbImg = $("img", lb);
  let lbSource = null;

  function flipFrom(el) {
    const from = el.getBoundingClientRect(), to = lbImg.getBoundingClientRect();
    lbImg.style.transition = "none";
    lbImg.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  }

  async function openLightbox(trigger) {
    lbSource = trigger;
    lbImg.src = img(trigger.dataset.photo);
    lbImg.alt = trigger.dataset.name;
    $(".lb-name", lb).textContent = trigger.dataset.name;
    $(".lb-price", lb).textContent = trigger.dataset.price;
    lb.hidden = false;
    document.documentElement.classList.add("locked");
    try { await lbImg.decode(); } catch (_) {}
    flipFrom(trigger);
    lbImg.getBoundingClientRect();
    lbImg.style.transition = "";
    lbImg.style.transform = "";
    lb.classList.add("open");
  }

  function closeLightbox() {
    if (lb.hidden) return;
    lb.classList.remove("open");
    if (lbSource) {
      const from = lbSource.getBoundingClientRect(), to = lbImg.getBoundingClientRect();
      lbImg.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
    }
    setTimeout(() => {
      lb.hidden = true;
      lbImg.style.transform = "";
      document.documentElement.classList.remove("locked");
    }, 280);
  }

  // ---- search -------------------------------------------------------------
  function applySearch() {
    const q = fold($("#searchInput").value.trim());
    document.body.classList.toggle("searching", !!q);
    if (q) closeBar(false);

    $$(".row, .gcard, .dhero").forEach((el) => (el.hidden = !!q && !el.dataset.search.includes(q)));
    $$(".tier").forEach((t) => {
      const chips = $$(".flavor", t);
      chips.forEach((c) => c.classList.toggle("dim", !!q && !c.dataset.search.includes(q)));
      t.hidden = !!q && !t.dataset.search.includes(q) && chips.every((c) => c.classList.contains("dim"));
      if (!t.hidden && t.dataset.search.includes(q)) chips.forEach((c) => c.classList.remove("dim"));
    });
    $$(".group").forEach((g) => (g.hidden = !!q && $$(".row, .gcard", g).every((r) => r.hidden)));
    let any = false;
    $$("#menu .section").forEach((s) => {
      if (s.id === "featured") return;
      const hit = !q || $$(".row, .gcard, .tier, .dhero", s).some((el) => !el.hidden);
      s.hidden = !hit;
      any = any || hit;
    });
    $$(".section .note").forEach((n) => (n.hidden = !!q));
    const empty = $("#empty");
    empty.hidden = !q || any;
    if (!empty.hidden) empty.textContent = L(UI.noResults).replace("{q}", $("#searchInput").value.trim());
    activeId = null;
    updateActive();
  }

  function setSearchOpen(open) {
    $("#searchRow").hidden = !open;
    $("#searchToggle").setAttribute("aria-expanded", String(open));
    if (open) $("#searchInput").focus();
    else { $("#searchInput").value = ""; applySearch(); }
    measureHeader();
  }

  // ---- events -------------------------------------------------------------
  document.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (tab) { e.preventDefault(); scrollToSection(tab.dataset.target); return; }

    const photo = e.target.closest("[data-photo]");
    if (photo) {
      const r = rails.find((x) => x.el === photo.parentElement);
      if (r) { r.pausedUntil = performance.now() + RESUME_MS; r.align(photo); }
      openLightbox(photo);
      return;
    }

    if (e.target.closest("#hhTest")) { hhTest = !document.body.classList.contains("hh"); updateHappyHour(); return; } // TEST ONLY

    const brandBtn = e.target.closest(".brand-btn");
    if (brandBtn) { brand = brand === brandBtn.dataset.brand ? null : brandBtn.dataset.brand; applyBrand(); return; }

    const chip = e.target.closest("button.dchip");
    if (chip) { pickOption(chip); return; }

    const tile = e.target.closest(".dtile");
    if (tile) { pickTile(tile); return; }

    const card = e.target.closest(".gcard[aria-expanded]");
    if (card) { toggleCard(card); return; }

    if (e.target.closest("#lightbox")) { closeLightbox(); return; }

    const langBtn = e.target.closest("[data-lang]");
    if (langBtn && langBtn.dataset.lang !== lang) {
      const anchor = activeId;
      lang = langBtn.dataset.lang;
      try { localStorage.setItem("huqqa-lang", lang); } catch (_) {}
      const y = window.scrollY;
      render();
      if (y > 0 && anchor) {
        const el = document.getElementById(anchor);
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - headerH + 1);
      }
      return;
    }

    if (e.target.closest("#searchToggle")) { setSearchOpen($("#searchRow").hidden); return; }
    if (e.target.closest("#searchClear")) { setSearchOpen(false); return; }
    if (e.target.closest("#toTop, [data-scroll-top]")) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  $("#searchInput").addEventListener("input", () => {
    applySearch();
    if (window.scrollY > 0) window.scrollTo({ top: 0 });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!lb.hidden) closeLightbox();
    else if (!$("#searchRow").hidden) setSearchOpen(false);
  });

  render();
  requestAnimationFrame((t) => { lastFrame = t; tick(t); });
  if (document.fonts) document.fonts.ready.then(() => { measureHeader(); rails.forEach((r) => r.wrap()); });
})();
