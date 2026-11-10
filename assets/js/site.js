/* Huqqa Lounge — shared D-site behavior. No external runtime dependencies. */
(function () {
 "use strict";
 var doc=document;
 doc.documentElement.classList.add("js");
 var reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
 var burger=doc.querySelector(".d-burger"),nav=doc.getElementById("d-nav");
 if(burger&&nav){
  var narrow=window.matchMedia("(max-width: 899.98px)");
  function setNav(open,back){nav.classList.toggle("open",open);burger.setAttribute("aria-expanded",String(open));burger.setAttribute("aria-label",open?"Close navigation":"Open navigation");nav.inert=narrow.matches&&!open;if(back)burger.focus();}
  setNav(false);
  burger.addEventListener("click",function(e){var open=burger.getAttribute("aria-expanded")!=="true";setNav(open);if(open&&e.detail===0)nav.querySelector("a").focus();});
  doc.addEventListener("keydown",function(e){if(e.key==="Escape"&&nav.classList.contains("open"))setNav(false,true);});
  doc.addEventListener("click",function(e){if(nav.classList.contains("open")&&!nav.contains(e.target)&&!burger.contains(e.target))setNav(false,nav.contains(doc.activeElement));});
  nav.addEventListener("click",function(e){if(e.target.closest("a"))setNav(false);});
  nav.addEventListener("focusout",function(){setTimeout(function(){if(narrow.matches&&!nav.contains(doc.activeElement)&&doc.activeElement!==burger)setNav(false);},0);});
  narrow.addEventListener("change",function(){setNav(false);});
 }
  /* Open now. data-hours: weekday(s):open-close, 25 = 1 AM next day. Falls Church time. */
  var TZ = "America/New_York", DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function parseHours(str) {
    var out = {};
    str.split(";").forEach(function (part) {
      var p = part.split(":"), t = p[1].split("-"), d = p[0].split("-");
      for (var i = +d[0]; i <= (d.length > 1 ? +d[1] : +d[0]); i++) out[i] = [+t[0], +t[1]];
    });
    return out;
  }
  function fmt(h) { h = h % 24; return (h % 12 || 12) + " " + (h < 12 ? "AM" : "PM"); }
  // Local-only clock override for reproducible overnight and DST checks.
  var clockOverride = null;
  if (["localhost", "127.0.0.1"].indexOf(window.location.hostname) > -1) {
    var clockParam = new URLSearchParams(window.location.search).get("now");
    if (clockParam && Number.isFinite(Date.parse(clockParam))) clockOverride = new Date(clockParam);
  }
  function nowLocal() {
    var o = {};
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(clockOverride || new Date()).forEach(function (p) { o[p.type] = p.value; });
    return { day: DAYS.indexOf(o.weekday), min: (+o.hour % 24) * 60 + +o.minute };
  }
  function compute(h) {
    var n = nowLocal(), d = n.day, m = n.min, prev = h[(d + 6) % 7], today = h[d];
    if (prev && prev[1] > 24 && m < (prev[1] - 24) * 60) return { state: "open", day: (d + 6) % 7, close: prev[1] - 24, left: (prev[1] - 24) * 60 - m };
    if (m >= today[0] * 60 && m < today[1] * 60) return { state: "open", day: d, close: today[1], left: today[1] * 60 - m };
    if (m < today[0] * 60) return { state: "closed", day: d, opens: today[0], when: "today" };
    return { state: "closed", day: d, opens: h[(d + 1) % 7][0], when: "tomorrow" };
  }
  var statuses = [].slice.call(doc.querySelectorAll("[data-status]"));
  function renderStatus() {
    var biz = nowLocal().day;
    statuses.forEach(function (el) {
      var hours = el._h || (el._h = parseHours(el.getAttribute("data-hours")));
      var s = compute(hours), t = el.querySelector("[data-status-title]"), sub = el.querySelector("[data-status-sub]"), td = el.querySelector("[data-status-today]");
      biz = s.day;
      if (s.state === "open") {
        var soon = s.left <= 60;
        el.setAttribute("data-state", soon ? "closing-soon" : "open");
        t.textContent = soon ? "Closing soon" : "Open now";
        sub.textContent = "Until " + fmt(s.close) + (soon ? " · Kitchen closed for tonight" : " · Kitchen until " + fmt(s.close - 1));
      } else {
        el.setAttribute("data-state", "closed");
        t.textContent = "Closed now";
        sub.textContent = "Opens " + fmt(s.opens) + " " + s.when;
      }
      if (td) { var h = hours[s.day]; td.innerHTML = DAYS[s.day] + " <b>" + fmt(h[0]) + " – " + fmt(h[1]) + "</b>"; }
    });
    doc.querySelectorAll("table[data-hours-table] tr[data-days]").forEach(function (tr) {
      var on = tr.getAttribute("data-days").split(",").map(Number).indexOf(biz) > -1;
      tr.classList.toggle("today", on);
      var tag = tr.querySelector(".sr-today"); if (tag) tag.hidden = !on;
    });
  }
  if (statuses.length) {
    renderStatus();
    setInterval(renderStatus, 60000);
    doc.addEventListener("visibilitychange", function () { if (!doc.hidden) renderStatus(); });
  }


 // TODO(Can): real best-seller list
 // Placeholder selection only: not presented as a verified sales ranking.
 // Names and photo slugs read from assets/js/menu-data.js. All image paths use the site image prefix.
 var BEST_SELLERS=[
  {
    "name": "Huqqa Mix Kebab",
    "image": "assets/site-img/huqqa-mix-kebap-md.webp"
  },
  {
    "name": "Lahmacun",
    "image": "assets/site-img/lahmacun-md.webp"
  },
  {
    "name": "Baklava",
    "image": "assets/site-img/baklava-md.webp"
  }
];
 // A selection from hookah.tiers, not a sales ranking. Display names only.
 var HOOKAH_FLAVORS=[
  {
    "name": "Double Apple"
  },
  {
    "name": "Double Apple Mint"
  },
  {
    "name": "Mint"
  },
  {
    "name": "Orange"
  },
  {
    "name": "Orange Mint"
  },
  {
    "name": "Gum Mint"
  },
  {
    "name": "Grape"
  },
  {
    "name": "Grape Mint"
  },
  {
    "name": "Grapefruit Mint"
  },
  {
    "name": "Lemon Mint"
  },
  {
    "name": "Citrus Mint"
  },
  {
    "name": "Watermelon"
  },
  {
    "name": "Watermelon Mint"
  },
  {
    "name": "Gum and Cinnamon"
  },
  {
    "name": "Blueberry Mint"
  },
  {
    "name": "Peach"
  },
  {
    "name": "Peach Mint"
  },
  {
    "name": "Cappuccino"
  },
  {
    "name": "Berry Mix"
  },
  {
    "name": "Rose"
  },
  {
    "name": "Mango"
  },
  {
    "name": "Pineapple"
  },
  {
    "name": "Cherry Mint"
  },
  {
    "name": "Kiwi"
  },
  {
    "name": "Guava"
  },
  {
    "name": "Melon"
  },
  {
    "name": "Vanilla"
  },
  {
    "name": "Wild Berry Mint"
  },
  {
    "name": "Mint Cream"
  },
  {
    "name": "Chewing Gum"
  },
  {
    "name": "Blue Mist"
  },
  {
    "name": "Blue Mist Mint"
  },
  {
    "name": "Pink"
  },
  {
    "name": "Tropicool"
  },
  {
    "name": "Tropicool Mint"
  },
  {
    "name": "Code 69"
  },
  {
    "name": "Melon Blue"
  },
  {
    "name": "Safari Melon Dew"
  },
  {
    "name": "Irish Peach"
  },
  {
    "name": "Beach"
  },
  {
    "name": "White Peach"
  },
  {
    "name": "Skyfall"
  },
  {
    "name": "Love 66"
  },
  {
    "name": "Lady Killer"
  },
  {
    "name": "Baku Nights"
  },
  {
    "name": "Berlin Nights"
  },
  {
    "name": "Mi Amor"
  },
  {
    "name": "Ice Lemon Mint"
  },
  {
    "name": "Ice Orange"
  },
  {
    "name": "Ice Blueberry"
  },
  {
    "name": "Istanbul Nights"
  },
  {
    "name": "Lime Spice Peach"
  },
  {
    "name": "Toasted Berry"
  },
  {
    "name": "Marbella"
  },
  {
    "name": "Pan"
  }
];
 // Same flavor across different brands appears only once in the rotation pool.
 HOOKAH_FLAVORS=HOOKAH_FLAVORS.filter(function(item,index,all){return all.findIndex(function(other){return other.name.trim().toLowerCase()===item.name.trim().toLowerCase();})===index;});
 var flavorCard=doc.querySelector(".d-flavors"),lastFlavorSwap=-Infinity,lastDishSwap=-Infinity;
 if(flavorCard){
  var flavorWords=[].slice.call(flavorCard.querySelectorAll("[data-flavor-word]")),flavorPause=flavorCard.querySelector("[data-flavor-pause]");
  var flavorColumns=[0,1,2],flavorIndices=[0,30,43],lastFlavorSlot=-1,flavorTimer=null,flavorSwap=null,flavorSettle=null,flavorPaused=false,flavorHover=false;
  function flavorLetters(slot){
   var word=flavorWords[slot],item=HOOKAH_FLAVORS[flavorIndices[slot]];
   word.setAttribute("data-column",String(flavorColumns[slot]));
   word.replaceChildren();
   Array.from(item.name).forEach(function(char){var letter=doc.createElement("span");letter.className="d-flavor-letter";letter.textContent=char;word.appendChild(letter);});
  }
  function flavorStopped(){return reduce.matches||flavorPaused||flavorHover||doc.hidden||flavorCard.contains(doc.activeElement);}
  function flavorSchedule(delay){clearTimeout(flavorTimer);if(!flavorStopped())flavorTimer=setTimeout(flavorNext,delay||1200+Math.random()*600);}
  function flavorNext(){
   if(flavorStopped())return;
   // Avoid simultaneous dish/flavor transitions, including manual dish changes.
   if(performance.now()-lastDishSwap<900){flavorSchedule(950);return;}
   var slots=flavorWords.map(function(_,i){return i;}).filter(function(i){return i!==lastFlavorSlot;});
   var slot=slots[Math.floor(Math.random()*slots.length)],word=flavorWords[slot];
   var available=HOOKAH_FLAVORS.map(function(_,i){return i;}).filter(function(i){return flavorIndices.indexOf(i)<0;});
   var next=available[Math.floor(Math.random()*available.length)];
   var columns=[0,1,2].filter(function(column){return column!==flavorColumns[slot];});
   var nextColumn=columns[Math.floor(Math.random()*columns.length)];
   lastFlavorSlot=slot;lastFlavorSwap=performance.now();word.classList.add("is-leaving");
   flavorSwap=setTimeout(function(){
    flavorIndices[slot]=next;flavorColumns[slot]=nextColumn;word.classList.remove("is-leaving");word.classList.add("is-entering");flavorLetters(slot);
    void word.offsetWidth;word.classList.remove("is-entering");
   },275);
   flavorSettle=setTimeout(function(){flavorSwap=null;flavorSettle=null;},550);
   flavorSchedule();
  }
  function flavorSync(){
   clearTimeout(flavorTimer);clearTimeout(flavorSwap);clearTimeout(flavorSettle);
   flavorWords.forEach(function(word){word.classList.remove("is-leaving","is-entering");});
   flavorPause.hidden=reduce.matches;flavorPause.setAttribute("aria-pressed",String(flavorPaused));flavorPause.textContent=flavorPaused?"Resume flavors":"Pause flavors";
   if(reduce.matches){flavorColumns=[0,1,2];flavorIndices=[0,30,43];flavorWords.forEach(function(_,slot){flavorLetters(slot);});}
   flavorSchedule();
  }
  // Shuffle distinct initial anchors instead of starting every row at the left.
  if(!reduce.matches){for(var c=flavorColumns.length-1;c>0;c--){var j=Math.floor(Math.random()*(c+1)),saved=flavorColumns[c];flavorColumns[c]=flavorColumns[j];flavorColumns[j]=saved;}}
  flavorWords.forEach(function(_,slot){flavorLetters(slot);});flavorPause.hidden=reduce.matches;
  flavorPause.addEventListener("click",function(){flavorPaused=!flavorPaused;flavorSync();});
  flavorCard.addEventListener("mouseenter",function(){flavorHover=true;flavorSync();});
  flavorCard.addEventListener("mouseleave",function(){flavorHover=false;flavorSync();});
  flavorCard.addEventListener("focusin",flavorSync);flavorCard.addEventListener("focusout",function(){setTimeout(flavorSync,0);});
  reduce.addEventListener("change",flavorSync);doc.addEventListener("visibilitychange",flavorSync);
  flavorSchedule();
 }
 // The schedule endpoint is optional; static fight-night information remains on failure.
 var eventNext=doc.querySelector("[data-event-next]");
 if(eventNext){
  fetch("/api/events",{cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json"}}).then(function(response){if(!response.ok)return null;return response.json();}).then(function(data){
   if(!data||!Array.isArray(data.events))return;
   var event=data.events.find(function(item){return item&&typeof item.name==="string"&&typeof item.headline==="string"&&Number.isFinite(Date.parse(item.start))&&Date.parse(item.start)>Date.now()&&typeof item.url==="string"&&/^https:\/\/(www\.)?ufc\.com\/event\//.test(item.url);});
   if(!event)return;
   var start=new Date(event.start),date=new Intl.DateTimeFormat("en-US",{timeZone:TZ,weekday:"short",month:"short",day:"numeric"}).format(start),clock=new Intl.DateTimeFormat("en-US",{timeZone:TZ,hour:"numeric",minute:"2-digit",hour12:true}).format(start).replace(":00","");
   var fight=Array.isArray(event.fights)?event.fights[0]:null;
   var hasFight=fight&&typeof fight.red==="string"&&fight.red.trim()&&typeof fight.blue==="string"&&fight.blue.trim();
   eventNext.querySelector("[data-event-main]").textContent=hasFight?fight.red.trim()+" vs "+fight.blue.trim():event.headline;
   var weight=eventNext.querySelector("[data-event-weight]");
   if(hasFight&&typeof fight.weight==="string"&&fight.weight.trim()){weight.textContent=fight.weight.trim();weight.hidden=false;}
   eventNext.querySelector("[data-event-name]").textContent=event.name;
   var time=eventNext.querySelector("[data-event-time]");time.dateTime=start.toISOString();time.textContent=date+" · "+clock+" ET";
   eventNext.querySelector("[data-event-source]").href=event.url;eventNext.hidden=false;
  }).catch(function(){/* No schedule is preferable to an unverified event. */});
 }
 var featured=doc.querySelector(".d-featured");
 if(featured){
  var controls=featured.querySelector("[data-feature-controls]"),link=featured.querySelector("[data-feature-link]"),image=featured.querySelector("[data-feature-img]"),name=featured.querySelector("[data-feature-name]"),count=featured.querySelector("[data-feature-count]"),pause=featured.querySelector("[data-feature-pause]"),announcement=featured.querySelector("[data-feature-announcement]");
  var index=0,paused=reduce.matches,hovered=false,timer=null,swap=null;
  controls.hidden=false;
  function sync(){clearInterval(timer);pause.hidden=reduce.matches;pause.setAttribute("aria-pressed",String(paused));pause.textContent=paused?"Resume rotation":"Pause rotation";if(!paused&&!reduce.matches&&!hovered&&!doc.hidden&&!featured.contains(doc.activeElement))timer=setInterval(function(){if(performance.now()-lastFlavorSwap>=900)show(index+1,false);},6500);}
  function show(next,manual){
   clearTimeout(swap);lastDishSwap=performance.now();index=(next+BEST_SELLERS.length)%BEST_SELLERS.length;
   var item=BEST_SELLERS[index];
   function put(){image.src=item.image;image.alt=item.name;name.textContent=item.name;count.textContent=(index+1)+" / "+BEST_SELLERS.length;link.classList.remove("is-changing");if(manual)announcement.textContent=item.name+", "+(index+1)+" of "+BEST_SELLERS.length;}
   if(reduce.matches)put();else{link.classList.add("is-changing");swap=setTimeout(put,275);}
  }
  featured.querySelector("[data-feature-prev]").addEventListener("click",function(){paused=true;show(index-1,true);sync();});
  featured.querySelector("[data-feature-next]").addEventListener("click",function(){paused=true;show(index+1,true);sync();});
  pause.addEventListener("click",function(){paused=!paused;sync();});
  featured.addEventListener("mouseenter",function(){hovered=true;sync();});featured.addEventListener("mouseleave",function(){hovered=false;sync();});
  featured.addEventListener("focusin",sync);featured.addEventListener("focusout",function(){setTimeout(sync,0);});
  doc.addEventListener("visibilitychange",sync);reduce.addEventListener("change",function(){if(reduce.matches)paused=true;sync();});sync();
 }
  /* Gallery: filter chips + photo viewer (acts on the photos currently shown) */
  var grid = doc.querySelector(".d-masonry");
  var all = [].slice.call(doc.querySelectorAll(".d-masonry > li"));
  var chips = [].slice.call(doc.querySelectorAll(".d-chip-btn"));
  var live = doc.querySelector("[data-count]");
  var visible = function () { return all.filter(function (li) { return !li.hidden; }).map(function (li) { return li.querySelector("a"); }); };
  if (grid && chips.length) {
    chips.forEach(function (c) {
      var n = c.getAttribute("data-filter") === "all" ? all.length : all.filter(function (li) { return li.getAttribute("data-cat") === c.getAttribute("data-filter"); }).length;
      c.querySelector("span").textContent = n;
    });
    var apply = function (f) {
      all.forEach(function (li) { li.hidden = !(f === "all" || li.getAttribute("data-cat") === f); });
      if (live) live.textContent = visible().length + " photos shown";
    };
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        if (c.getAttribute("aria-pressed") === "true") return;
        chips.forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
        var f = c.getAttribute("data-filter");
        if (reduce.matches) { apply(f); return; }
        grid.classList.add("is-filtering");
        setTimeout(function () { apply(f); grid.classList.remove("is-filtering"); }, 230);
      });
    });
  }

  var lb = doc.getElementById("lightbox");
  if (lb && all.length && typeof lb.showModal === "function") {
    var img = lb.querySelector("img"), cap = lb.querySelector("[data-cap]"), tag = lb.querySelector("[data-tag]"), count = lb.querySelector(".d-lb-count");
    var list = [], idx = 0, opener = null, tx = null;
    var show = function (i, instant) {
      idx = (i + list.length) % list.length;
      var a = list[idx], th = a.querySelector("img");
      var put = function () {
        img.src = a.getAttribute("href"); img.alt = th.alt; cap.textContent = th.alt;
        tag.textContent = a.getAttribute("data-label"); count.textContent = (idx + 1) + " of " + list.length; img.classList.remove("swap");
      };
      if (instant || reduce.matches) put(); else { img.classList.add("swap"); setTimeout(put, 180); }
      [idx + 1, idx - 1].forEach(function (j) { new Image().src = list[(j + list.length) % list.length].getAttribute("href"); });
    };
    all.forEach(function (li) {
      var a = li.querySelector("a");
      a.setAttribute("aria-haspopup", "dialog");
      a.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault(); opener = a; list = visible(); show(list.indexOf(a), true); lb.showModal(); lb.querySelector(".d-lb-close").focus();
      });
    });
    lb.addEventListener("close", function () { if (opener) { opener.focus(); opener = null; } });
    lb.querySelector(".d-lb-close").addEventListener("click", function () { lb.close(); });
    lb.querySelector(".d-lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".d-lb-next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); }
    });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.tagName === "FIGURE") lb.close(); });
    lb.addEventListener("touchstart", function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }


 doc.querySelectorAll("[data-year]").forEach(function(el){el.textContent=new Date().getFullYear();});
})();
