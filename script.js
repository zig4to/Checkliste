/* ================================================================
   CHECKLISTE - logika
   Vanilla JS (ES6+). Vsi podatki v LocalStorage.
   Struktura podatkov:
   store = {
     activeId: "cl_...",
     seeded: true,               // ali je bila začetna lista že uvožena
     checklists: [
       {
         id, name,
         categories: [
           { id, name, collapsed, items: [ { id, text, done } ] }
         ]
       }
     ]
   }
   ================================================================ */

"use strict";

/* ---------- Konstante in pomožne funkcije ---------- */

const STORAGE_KEY = "checkliste.v1";
const THEME_KEY   = "checkliste.theme";

/** Ustvari kratek unikaten ID. */
const uid = (p = "id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/** Globok clone (dovolj za naše navadne objekte). */
const clone = (obj) => JSON.parse(JSON.stringify(obj));

/* ---------- Začetna (privzeta) checklista ---------- */
/* Uporabnik lahko to kadarkoli uredi ali zamenja. */

const SEED_CHECKLISTS = [
  {
    name: "🏔️ Hribi Checklista",
    categories: [
      { name: "🥾 Pohodniška oprema", items: ["Gojzarji", "Pohodne palice", "Puhovka", "Jakna", "Nahrbtnik"] },
      { name: "🍔 Hrana", items: ["Sendviči", "Voda", "Energijski gel", "Proteinske"] },
      { name: "👚 Oblačila", items: ["Flis", "Nogavice rezervne", "Dolge hlače", "Gate", "Majica za preoblečt", "Kapa"] },
      { name: "⚙️ Ostalo", items: ["Čelna svetilka", "Sončna očala", "Garmin ura", "Powerbank", "Meh za vodo", "Nož"] }
    ]
  },
  {
    name: "🏂 Splitboarding Checklist",
    categories: [
      { name: "🪖 Oprema", items: ["Bord/smuče", "Vezi", "Buci/pancarji", "Plazovni trojček", "Palice", "Kože", "Čelada", "Očala", "Srenači", "Nahrbtnik", "Komplet orodja", "Čelna svetilka", "Prva pomoč"] },
      { name: "👕 Oblačila", items: ["Baselayer", "Švic majica", "Flis", "Švic hlače", "Preobleči švic majico", "Štumfi", "Buff"] },
      { name: "🌭 Hrana/pijača", items: ["Meh z vodo", "Sendvič", "Proteinske ploščice", "Energijski gel", "Energijski napitek"] },
      { name: "🧥Hardshell", items: ["Jakna/puhovka", "Zimske hlače", "Rokavice debele", "Rokavice tanke", "Kapa", "Sončna očala"] },
      { name: "👜 Za preoblečt v avtu", items: ["Štumfi", "Majica"] }
    ]
  },
  {
    name: "🌊 SUP Checklist",
    categories: [
      { name: "🏞️ Osnovno", items: ["SUP", "Baterijski kompresor", "Vodna vreča", "Nastavlki za sup", "Brusača", "Vesla", "Gajba za pir"] },
      { name: "👕 Oblačila", items: ["Kopalke", "Rezervna majica", "Papuči", "Hlače za preoblečt", "Gate"] },
      { name: "☀️ Zaščita", items: ["Sončna krema", "Vodni čevlji", "Sončna očala"] },
      { name: "Hrana in pijača", items: [] }
    ]
  },
  {
    name: "🚐 Car Camping Checklist",
    categories: [
      { name: "🏕️ Kamp oprema", items: ["Mizica", "Stoli", "Dodatna lesena mizica za razširitev", "Deka", "Piknik deka", "Viseča mreža", "Pokrivala za okna", "Toaleta", "Gajbice", "Nahrbtnik", "Nahrbtniki", "Sleep mask", "Čepki za ušesa"] },
      { name: "🍳 Kuhinja", items: ["Plinski gorilnik", "Bomba + cev", "Ključ za bombo", "Posoda za kuhanje", "Dober nož", "Deska za rezanje", "Pribor", "Šalce", "Kozarčki", "Krožniki", "Džezva", "Kava", "Juha", "Rezervoar z vodo", "Meh za vodo", "Hladilna skrinja + pingvini", "Tupperware", "Gobica (za posodo)", "Cet (za posodo)"] },
      { name: "🧼 Higiena", items: ["Brisače kopanje", "Brisače umivanje", "Gel za tuširanje", "Razkužilo za roke", "WC papir", "Kuhinjski papir", "Servieti", "Sončna krema", "Sprej proti komarjem", "Rezervne leče"] },
      { name: "🔌 Tehnika", items: ["Powerbanki", "USB kabli (USB/C)", "USB razdelilci", "Rezervne baterije", "Namizna lučka", "Čelka", "Slušalke", "Mašince"] },
      { name: "🥾 Aktivnosti", items: ["Igre", "Pohodne palice", "Odbojkarska žoga", "Balinčki"] },
      { name: "🩹 Orodje in popravila", items: ["Komplet orodja", "Plastične vrečke", "Alu folija", "Vaservaga", "Deske za uravnavanje vozila", "Štrik + klinčki", "Vezice", "Silver tape"] },
      { name: "👕 Oblačila", items: ["Jakna", "Jopa / dolgi rokavi", "Papuči", "Kopalke", "Sončna očala", "Rezervne vezalke"] },
      { name: "🛏️ Spanje", items: ["Jogi / nadvložek", "Rjuha", "Povšter", "Kovter", "Dodatna deka"] },
      { name: "🩺 Prva pomoč", items: ["Flajštri", "Nalgesin"] }
    ]
  },
  {
    name: "🐟 Morje Checklist",
    categories: [
      { name: "⚽ Rekviziti", items: ["Kitara", "Kruzer?", "Zogca za vodo", "Prisrčnca", "Beer pong kozarci", "Balinčki", "Zoga za odbojko"] },
      { name: "⚡ Elektronika", items: ["Zvočnik"] },
      { name: "🏃 To do", items: [] },
      { name: "👕 Oblačila", items: ["Japanke", "Klobuk"] },
      { name: "🫙 Ostalo", items: ["Nalgesin", "Vitamin C", "Brivnik", "Rezerve leče"] }
    ]
  },
  {
    name: "🏕️ Multiday Hiking",
    categories: [
      { name: "🥾 Pohodniška oprema", items: ["Gojzarji", "Pohodne palice", "Puhovka", "Jakna", "Nahrbtnik"] },
      { name: "🍔 Hrana", items: ["Njoki", "Sendviči", "Salama", "Voda", "Energijski gel", "Proteinske"] },
      { name: "👚 Oblačila", items: ["Flis", "Nogavice rezervne", "Dolge hlače", "Gate", "Majica za preoblečt", "Kapa", "Maska za spanje"] },
      { name: "🛌 Za spat", items: ["Blazina", "Podloga", "Spalka", "Povšter", "Tablete za spanje"] },
      { name: "🍽️ Kuhinja", items: ["Gorilnik + bomba", "Ponev / posoda", "🔪 Nož", "Pribor", "Šalca"] },
      { name: "🪥 Higiena", items: ["Za leče", "Zobna ščetka", "Vlažilni robčki / Robci"] },
      { name: "⚙️ Ostalo", items: ["Čelna svetilka", "Sončna očala", "Papuči", "Garmin ura", "Powerbank", "Meh za vodo", "Vrečka za smeti"] }
    ]
  },
  {
    name: "🧗‍♂️Ferata Checklist",
    categories: [
      { name: "Oprema", items: ["Gojzarji", "Samovarovalni komplet", "Čelada", "Plezalni pas", "Rokavice za ferato"] },
      { name: "Hrana", items: ["Voda", "Proteinske ploščice"] },
      { name: "Obleke", items: ["Rezervna majica", "Flis če je mrzlo"] },
      { name: "Ostalo", items: ["Sončna očala", "Krema za sonce", "Prva pomoč"] }
    ]
  }
];

/** Zgradi polne checkliste iz seed definicij (prva je aktivna). */
function buildSeedStore() {
  const checklists = SEED_CHECKLISTS.map((def) => ({
    id: uid("cl"),
    name: def.name,
    categories: def.categories.map((c) => ({
      id: uid("cat"),
      name: c.name,
      collapsed: false,
      items: c.items.map((t) => ({ id: uid("it"), text: t, done: false }))
    }))
  }));
  return { activeId: checklists[0].id, seeded: true, checklists };
}

/* ---------- Stanje ---------- */

let store = loadStore();

/** Naloži iz LocalStorage ali ustvari začetno stanje. */
function loadStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.checklists) && parsed.checklists.length) {
        // Ob vsakem zagonu je izbrana prva checklista na seznamu.
        parsed.activeId = parsed.checklists[0].id;
        return parsed;
      }
    } catch (e) {
      console.warn("Napaka pri branju shrambe, ustvarjam novo.", e);
    }
  }
  // Prvi zagon: uvozi začetne liste (samo enkrat).
  return buildSeedStore();
}

/** Shrani celotno stanje. Kliče se ob vsaki spremembi. */
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/* ---------- Dostop do trenutne checkliste ---------- */

const getActive = () => store.checklists.find((c) => c.id === store.activeId) || store.checklists[0];
const getCat    = (cl, catId) => cl.categories.find((c) => c.id === catId);

/* ---------- Reference na DOM ---------- */

const $ = (sel) => document.querySelector(sel);

const els = {
  select:        $("#checklistSelect"),
  categoryList:  $("#categoryList"),
  search:        $("#searchInput"),
  progressWrap:  $(".progress-wrap"),
  progressBar:   $("#progressBar"),
  progressCount: $("#progressCount"),
  progressPct:   $("#progressPercent"),
  importFile:    $("#importFile"),
  tplCategory:   $("#tplCategory"),
  tplItem:       $("#tplItem")
};

/* ================================================================
   MODAL (prompt / confirm) - vrne Promise
   ================================================================ */

const modal = {
  overlay: $("#modalOverlay"),
  title:   $("#modalTitle"),
  message: $("#modalMessage"),
  input:   $("#modalInput"),
  cancel:  $("#modalCancel"),
  confirm: $("#modalConfirm"),
  _resolve: null
};

/** Prikaže potrditveno okno. Vrne true/false. */
function confirmDialog(message, title = "Potrditev") {
  return openModal({ title, message, withInput: false });
}

/** Prikaže vnosno okno. Vrne vpisano besedilo ali null. */
function promptDialog(message, defaultValue = "", title = "Vnos") {
  return openModal({ title, message, withInput: true, defaultValue });
}

function openModal({ title, message, withInput, defaultValue = "" }) {
  modal.title.textContent = title;
  modal.message.textContent = message || "";
  modal.message.hidden = !message;
  modal.input.hidden = !withInput;
  modal.input.value = defaultValue;
  modal.overlay.hidden = false;

  if (withInput) setTimeout(() => modal.input.select(), 40);

  return new Promise((resolve) => { modal._resolve = resolve; });
}

function closeModal(result) {
  modal.overlay.hidden = true;
  if (modal._resolve) {
    modal._resolve(result);
    modal._resolve = null;
  }
}

modal.cancel.addEventListener("click", () => closeModal(modal.input.hidden ? false : null));
modal.confirm.addEventListener("click", () =>
  closeModal(modal.input.hidden ? true : modal.input.value.trim())
);
modal.overlay.addEventListener("click", (e) => {
  if (e.target === modal.overlay) closeModal(modal.input.hidden ? false : null);
});
modal.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") modal.confirm.click();
  if (e.key === "Escape") modal.cancel.click();
});

/* ================================================================
   IZRIS (render)
   ================================================================ */

/** Osveži spustni seznam checklist. */
function renderSelect() {
  els.select.innerHTML = "";
  store.checklists.forEach((cl) => {
    const opt = document.createElement("option");
    opt.value = cl.id;
    opt.textContent = cl.name;
    if (cl.id === store.activeId) opt.selected = true;
    els.select.appendChild(opt);
  });
}

/** Izračuna napredek (opravljeni / vsi) za dano checklisto. */
function countProgress(cl) {
  let done = 0, total = 0;
  cl.categories.forEach((cat) => cat.items.forEach((it) => {
    total++;
    if (it.done) done++;
  }));
  return { done, total };
}

/** Osveži zgornji progress bar. */
function renderProgress() {
  const { done, total } = countProgress(getActive());
  const pct = total ? Math.round((done / total) * 100) : 0;
  els.progressBar.style.width = pct + "%";
  els.progressCount.textContent = `${done} / ${total}`;
  els.progressPct.textContent = pct + "%";
  els.progressWrap.hidden = done === 0;
}

/** Izriše vse kategorije in elemente aktivne checkliste. */
function renderCategories() {
  const cl = getActive();
  els.categoryList.innerHTML = "";

  if (!cl.categories.length) {
    els.categoryList.innerHTML =
      `<div class="empty-state"><p>Ni kategorij.</p><p>Dodaj prvo kategorijo z gumbom «＋ Kategorija».</p></div>`;
    return;
  }

  cl.categories.forEach((cat, catIndex) => {
    const node = els.tplCategory.content.firstElementChild.cloneNode(true);
    node.dataset.catId = cat.id;
    if (cat.collapsed) node.classList.add("collapsed");

    node.querySelector(".cat-name").textContent = cat.name;

    // Napredek kategorije
    const cDone = cat.items.filter((i) => i.done).length;
    const cTot  = cat.items.length;
    const badge = node.querySelector(".cat-progress");
    badge.textContent = `${cDone}/${cTot}`;
    if (cTot && cDone === cTot) badge.classList.add("done");

    // Onemogoči puščici gor/dol na robovih
    node.querySelector(".act-up").disabled = catIndex === 0;
    node.querySelector(".act-down").disabled = catIndex === cl.categories.length - 1;

    // Elementi
    const list = node.querySelector(".item-list");
    cat.items.forEach((item, itemIndex) => {
      list.appendChild(renderItem(cat, item, itemIndex));
    });

    els.categoryList.appendChild(node);
  });
}

/** Izriše en element. */
function renderItem(cat, item, itemIndex) {
  const li = els.tplItem.content.firstElementChild.cloneNode(true);
  li.dataset.itemId = item.id;
  if (item.done) li.classList.add("done");

  li.querySelector(".chk").checked = item.done;
  li.querySelector(".item-text").textContent = item.text;
  li.querySelector(".act-item-up").disabled = itemIndex === 0;
  li.querySelector(".act-item-down").disabled = itemIndex === cat.items.length - 1;

  return li;
}

/** Popolna osvežitev prikaza + shramba. */
function renderAll({ persist = true } = {}) {
  if (persist) save();
  renderSelect();
  renderProgress();
  renderCategories();
  applySearch(); // ohrani aktivni filter
}

/* ================================================================
   AKCIJE - CHECKLISTE
   ================================================================ */

async function newChecklist() {
  const name = await promptDialog("Ime nove checkliste:", "Nova checklista", "Nova checklista");
  if (!name) return;
  const cl = { id: uid("cl"), name, categories: [] };
  store.checklists.push(cl);
  store.activeId = cl.id;
  renderAll();
}

async function renameChecklist() {
  const cl = getActive();
  const name = await promptDialog("Novo ime checkliste:", cl.name, "Preimenuj");
  if (!name) return;
  cl.name = name;
  renderAll();
}

function duplicateChecklist() {
  const cl = getActive();
  const copy = clone(cl);
  copy.id = uid("cl");
  copy.name = `${cl.name} (kopija)`;
  reassignIds(copy);
  store.checklists.push(copy);
  store.activeId = copy.id;
  renderAll();
}

async function deleteChecklist() {
  if (store.checklists.length <= 1) {
    await confirmDialog("To je zadnja checklista in je ni mogoče izbrisati.", "Ni mogoče");
    return;
  }
  const cl = getActive();
  const ok = await confirmDialog(`Res izbrišem checklisto «${cl.name}»?`, "Izbriši checklisto");
  if (!ok) return;
  store.checklists = store.checklists.filter((c) => c.id !== cl.id);
  store.activeId = store.checklists[0].id;
  renderAll();
}

/** Dodeli sveže ID-je kategorijam in elementom (po kopiranju). */
function reassignIds(cl) {
  cl.categories.forEach((cat) => {
    cat.id = uid("cat");
    cat.items.forEach((it) => (it.id = uid("it")));
  });
}

/* ================================================================
   AKCIJE - KATEGORIJE
   ================================================================ */

async function addCategory() {
  const name = await promptDialog("Ime nove kategorije:", "", "Nova kategorija");
  if (!name) return;
  getActive().categories.push({ id: uid("cat"), name, collapsed: false, items: [] });
  renderAll();
}

async function renameCategory(catId) {
  const cat = getCat(getActive(), catId);
  const name = await promptDialog("Novo ime kategorije:", cat.name, "Preimenuj kategorijo");
  if (!name) return;
  cat.name = name;
  renderAll();
}

async function deleteCategory(catId) {
  const cl = getActive();
  const cat = getCat(cl, catId);
  const ok = await confirmDialog(
    `Res izbrišem kategorijo «${cat.name}» in vseh ${cat.items.length} elementov?`,
    "Izbriši kategorijo"
  );
  if (!ok) return;
  cl.categories = cl.categories.filter((c) => c.id !== catId);
  renderAll();
}

function moveCategory(catId, dir) {
  const cats = getActive().categories;
  const i = cats.findIndex((c) => c.id === catId);
  const j = i + dir;
  if (j < 0 || j >= cats.length) return;
  [cats[i], cats[j]] = [cats[j], cats[i]];
  renderAll();
}

function toggleCollapse(catId, node) {
  const cat = getCat(getActive(), catId);
  cat.collapsed = !cat.collapsed;
  node.classList.toggle("collapsed", cat.collapsed);
  save();
}

/* ================================================================
   AKCIJE - ELEMENTI
   ================================================================ */

/** Ali element z enakim besedilom že obstaja kjerkoli v checklisti (v kateri koli kategoriji). */
function itemTextExists(cl, text, excludeItemId = null) {
  const norm = text.trim().toLowerCase();
  return cl.categories.some((cat) =>
    cat.items.some((it) => it.id !== excludeItemId && it.text.trim().toLowerCase() === norm)
  );
}

async function addItem(catId) {
  const cat = getCat(getActive(), catId);
  const text = await promptDialog(`Nov element v «${cat.name}»:`, "", "Dodaj element");
  if (!text) return;
  if (itemTextExists(getActive(), text)) {
    await confirmDialog(`Element «${text}» že obstaja na tej checklisti.`, "Podvojen element");
    return;
  }
  cat.items.push({ id: uid("it"), text, done: false });
  if (cat.collapsed) cat.collapsed = false;
  renderAll();
}

async function editItem(catId, itemId) {
  const cat = getCat(getActive(), catId);
  const item = cat.items.find((i) => i.id === itemId);
  const text = await promptDialog("Uredi element:", item.text, "Uredi element");
  if (!text) return;
  if (itemTextExists(getActive(), text, itemId)) {
    await confirmDialog(`Element «${text}» že obstaja na tej checklisti.`, "Podvojen element");
    return;
  }
  item.text = text;
  renderAll();
}

async function deleteItem(catId, itemId) {
  const cat = getCat(getActive(), catId);
  const item = cat.items.find((i) => i.id === itemId);
  const ok = await confirmDialog(`Res izbrišem element «${item.text}»?`, "Izbriši element");
  if (!ok) return;
  cat.items = cat.items.filter((i) => i.id !== itemId);
  renderAll();
}

function toggleItem(catId, itemId, checked) {
  const cat = getCat(getActive(), catId);
  const item = cat.items.find((i) => i.id === itemId);
  item.done = checked;
  renderAll();
}

function moveItem(catId, itemId, dir) {
  const cat = getCat(getActive(), catId);
  const i = cat.items.findIndex((it) => it.id === itemId);
  const j = i + dir;
  if (j < 0 || j >= cat.items.length) return;
  [cat.items[i], cat.items[j]] = [cat.items[j], cat.items[i]];
  renderAll();
}

/** Premakne element v drugo kategorijo (izbira prek modala). */
async function moveItemToCategory(catId, itemId) {
  const cl = getActive();
  const others = cl.categories.filter((c) => c.id !== catId);
  if (!others.length) {
    await confirmDialog("Ni druge kategorije, kamor bi lahko premaknila element.", "Ni mogoče");
    return;
  }
  const list = others.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  const answer = await promptDialog(
    `V katero kategorijo? Vpiši številko:\n${list}`,
    "1",
    "Premakni element"
  );
  if (!answer) return;
  const idx = parseInt(answer, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= others.length) {
    await confirmDialog("Neveljavna izbira.", "Napaka");
    return;
  }
  const cat = getCat(cl, catId);
  const item = cat.items.find((i) => i.id === itemId);
  if (itemTextExists(cl, item.text, itemId)) {
    await confirmDialog(`Element «${item.text}» že obstaja v drugi kategoriji.`, "Podvojen element");
    return;
  }
  cat.items = cat.items.filter((i) => i.id !== itemId);
  others[idx].items.push(item);
  renderAll();
}

/* ================================================================
   MASOVNE AKCIJE
   ================================================================ */

function setAll(done) {
  getActive().categories.forEach((cat) => cat.items.forEach((it) => (it.done = done)));
  renderAll();
}

/* ================================================================
   ISKANJE
   ================================================================ */

function applySearch() {
  const q = els.search.value.trim().toLowerCase();
  els.categoryList.querySelectorAll(".category").forEach((catNode) => {
    let visibleInCat = 0;
    catNode.querySelectorAll(".item").forEach((itemNode) => {
      const text = itemNode.querySelector(".item-text").textContent.toLowerCase();
      const match = !q || text.includes(q);
      itemNode.classList.toggle("hidden", !match);
      if (match) visibleInCat++;
    });
    // Med iskanjem skrij kategorije brez zadetkov
    catNode.style.display = q && visibleInCat === 0 ? "none" : "";
  });
}

/* ================================================================
   UVOZ / IZVOZ
   ================================================================ */

/** Prenese objekt kot JSON datoteko. */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Varen del imena datoteke. */
const safeName = (s) => s.replace(/[^\w\-]+/g, "_").slice(0, 40) || "checklist";

function exportActive() {
  const cl = getActive();
  downloadJSON({ type: "checklist", version: 1, checklist: cl }, `${safeName(cl.name)}.json`);
}

function exportAll() {
  downloadJSON({ type: "checklists", version: 1, checklists: store.checklists }, "vse_checkliste.json");
}

async function handleImportFile(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    await confirmDialog("Datoteka ni veljaven JSON.", "Napaka pri uvozu");
    return;
  }

  // Iz datoteke potegni seznam checklist (podpira oba formata).
  let incoming = [];
  if (data.type === "checklists" && Array.isArray(data.checklists)) incoming = data.checklists;
  else if (data.type === "checklist" && data.checklist) incoming = [data.checklist];
  else if (Array.isArray(data.checklists)) incoming = data.checklists;
  else if (data.categories) incoming = [data];
  else {
    await confirmDialog("Neprepoznana struktura datoteke.", "Napaka pri uvozu");
    return;
  }

  incoming = incoming.map(normalizeChecklist);

  // Vprašaj: združi (Potrdi) ali prepiši (Prekliči -> ponudi še eno vprašanje).
  const merge = await confirmDialog(
    `Uvažam ${incoming.length} checklist(o).\n\n«Potrdi» = združi z obstoječimi\n«Prekliči» = prepiši vse obstoječe`,
    "Uvoz"
  );

  if (merge) {
    incoming.forEach((cl) => {
      cl.id = uid("cl");
      reassignIds(cl);
      store.checklists.push(cl);
    });
  } else {
    incoming.forEach((cl) => {
      cl.id = uid("cl");
      reassignIds(cl);
    });
    store.checklists = incoming;
  }

  store.activeId = store.checklists[store.checklists.length - 1].id;
  renderAll();
}

/** Poskrbi, da ima uvožena checklista vsa potrebna polja. */
function normalizeChecklist(cl) {
  return {
    id: cl.id || uid("cl"),
    name: cl.name || "Uvožena checklista",
    categories: (cl.categories || []).map((cat) => ({
      id: cat.id || uid("cat"),
      name: cat.name || "Kategorija",
      collapsed: !!cat.collapsed,
      items: (cat.items || []).map((it) => ({
        id: it.id || uid("it"),
        text: it.text || "",
        done: !!it.done
      }))
    }))
  };
}

/* ================================================================
   TEMA
   ================================================================ */

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", cur);
  localStorage.setItem(THEME_KEY, cur);
}

/* ================================================================
   SKENIRANJE SLIKE (OCR prek Tesseract.js)
   Potek: izbira vira -> OCR -> pregled besedila -> nova checklista
   ================================================================ */

const scan = {
  overlay: $("#scanOverlay"),
  status:  $("#scanStatus"),
  name:    $("#scanName"),
  text:    $("#scanText"),
  cancel:  $("#scanCancel"),
  confirm: $("#scanConfirm"),
  fileGallery: $("#scanFileGallery"),
  fileCamera:  $("#scanFileCamera")
};

/** Ali smo na telefonu (za ponudbo kamere). */
const isMobile = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 720;

/** Sproži skeniranje: na telefonu vpraša kamera ali galerija, sicer kar galerija. */
async function startScan() {
  // Preveri, ali je Tesseract naložen (CDN morda ni dosegljiv brez interneta).
  if (typeof Tesseract === "undefined") {
    await confirmDialog(
      "Knjižnica za prepoznavo besedila se ni naložila. Preveri internetno povezavo in poskusi znova.",
      "OCR ni na voljo"
    );
    return;
  }

  if (isMobile()) {
    const useCamera = await confirmDialog(
      "«Potrdi» = zajemi s kamero\n«Prekliči» = izberi sliko iz galerije",
      "Skeniraj seznam"
    );
    if (useCamera) scan.fileCamera.click();
    else scan.fileGallery.click();
  } else {
    scan.fileGallery.click();
  }
}

/** Obdela izbrano sliko: zažene OCR in odpre modal za pregled. */
async function processScanImage(file) {
  if (!file) return;

  // Odpri modal takoj, da uporabnik vidi napredek.
  scan.name.value = "Skenirana checklista";
  scan.text.value = "";
  scan.confirm.disabled = true;
  scan.status.textContent = "Berem besedilo iz slike ... (0 %)";
  scan.overlay.hidden = false;

  try {
    const result = await Tesseract.recognize(file, "slv+eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const pct = Math.round((m.progress || 0) * 100);
          scan.status.textContent = `Berem besedilo iz slike ... (${pct} %)`;
        }
      }
    });
    const raw = (result.data.text || "").trim();
    scan.text.value = cleanScanText(raw);
    scan.status.textContent = raw
      ? "Preglej in po potrebi popravi besedilo. Prazna vrstica loči kategorije."
      : "Nisem prepoznal besedila. Lahko ga vpišeš ročno spodaj.";
  } catch (e) {
    console.error(e);
    scan.status.textContent = "Napaka pri branju slike. Besedilo lahko vpišeš ročno.";
  } finally {
    scan.confirm.disabled = false;
  }
}

/** Osnovno čiščenje OCR besedila (odstrani prazne robove, pogoste smeti). */
function cleanScanText(raw) {
  return raw
    .split("\n")
    .map((line) => line.replace(/^[\s•·\-–—*▪◦☐☑\[\]()]+/, "").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // strni več praznih vrstic v eno
    .trim();
}

/**
 * Razčleni besedilo v kategorije in elemente.
 * Pravilo: prazna vrstica loči kategorije. Znotraj bloka je prva vrstica
 * ime kategorije, ostale so elementi. Če je v bloku samo ena vrstica,
 * gre pod privzeto kategorijo "Elementi".
 */
function parseScanText(text) {
  const blocks = text
    .split(/\n\s*\n/)          // prazne vrstice ločijo bloke
    .map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length);

  const categories = [];
  blocks.forEach((lines) => {
    if (lines.length === 1) {
      // Osamljena vrstica: dodaj kot element v splošno kategorijo.
      let general = categories.find((c) => c.name === "Elementi");
      if (!general) { general = { name: "Elementi", items: [] }; categories.push(general); }
      general.items.push(lines[0]);
    } else {
      const [name, ...items] = lines;
      categories.push({ name, items });
    }
  });
  return categories;
}

/** Ustvari novo checklisto iz pregledanega besedila. */
function confirmScan() {
  const name = scan.name.value.trim() || "Skenirana checklista";
  const cats = parseScanText(scan.text.value);

  if (!cats.length) {
    scan.status.textContent = "Ni vsebine za uvoz. Vpiši vsaj eno kategorijo in element.";
    return;
  }

  const cl = {
    id: uid("cl"),
    name,
    categories: cats.map((c) => ({
      id: uid("cat"),
      name: c.name,
      collapsed: false,
      items: c.items.map((t) => ({ id: uid("it"), text: t, done: false }))
    }))
  };

  store.checklists.push(cl);
  store.activeId = cl.id;
  scan.overlay.hidden = true;
  renderAll();
}

/* ================================================================
   DOGODKI
   ================================================================ */

function bindTopbar() {
  els.select.addEventListener("change", (e) => {
    store.activeId = e.target.value;
    els.search.value = "";
    renderAll();
  });

  $("#btnNewChecklist").addEventListener("click", newChecklist);
  $("#btnRenameChecklist").addEventListener("click", renameChecklist);
  $("#btnDuplicateChecklist").addEventListener("click", duplicateChecklist);
  $("#btnDeleteChecklist").addEventListener("click", deleteChecklist);

  $("#btnCheckAll").addEventListener("click", () => setAll(true));
  $("#btnClearAll").addEventListener("click", () => setAll(false));
  $("#btnAddCategory").addEventListener("click", addCategory);
  $("#btnExportActive").addEventListener("click", exportActive);
  $("#btnExportAll").addEventListener("click", exportAll);
  $("#btnImport").addEventListener("click", () => els.importFile.click());
  $("#btnScan").addEventListener("click", startScan);
  $("#btnTheme").addEventListener("click", toggleTheme);

  // Skeniranje: obravnava izbrane slike
  scan.fileGallery.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) processScanImage(f);
    e.target.value = "";
  });
  scan.fileCamera.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) processScanImage(f);
    e.target.value = "";
  });
  scan.confirm.addEventListener("click", confirmScan);
  scan.cancel.addEventListener("click", () => { scan.overlay.hidden = true; });
  scan.overlay.addEventListener("click", (e) => {
    if (e.target === scan.overlay) scan.overlay.hidden = true;
  });

  els.importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleImportFile(file);
    e.target.value = ""; // omogoči ponovni uvoz iste datoteke
  });

  els.search.addEventListener("input", applySearch);

  // Zložljiva menija (samo telefon). Ob odprtju enega se drugi zapre.
  const panelChecklist = $("#panelChecklist");
  const panelTools = $("#panelTools");
  const trigChecklist = $("#toggleChecklistMenu");
  const trigTools = $("#toggleToolsMenu");

  function togglePanel(panel, trigger, other, otherTrig) {
    const willOpen = !panel.classList.contains("open");
    panel.classList.toggle("open", willOpen);
    trigger.setAttribute("aria-expanded", String(willOpen));
    // zapri drugega
    other.classList.remove("open");
    otherTrig.setAttribute("aria-expanded", "false");
  }

  function closeAllPanels() {
    panelChecklist.classList.remove("open");
    panelTools.classList.remove("open");
    trigChecklist.setAttribute("aria-expanded", "false");
    trigTools.setAttribute("aria-expanded", "false");
  }

  trigChecklist.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePanel(panelChecklist, trigChecklist, panelTools, trigTools);
  });
  trigTools.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePanel(panelTools, trigTools, panelChecklist, trigChecklist);
  });

  // Na namizju se menija odpreta kot spustna seznama: zapri ju ob kliku
  // zunaj njiju ali ob tipki Escape.
  document.addEventListener("click", (e) => {
    if (panelChecklist.contains(e.target) || panelTools.contains(e.target)) return;
    closeAllPanels();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllPanels();
  });
}

/**
 * Delegiran poslušalec za celoten seznam kategorij.
 * Tako ni treba vezati dogodkov na vsak gumb posebej (manj kode, hitrejše).
 */
function bindCategoryList() {
  els.categoryList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    const catNode = e.target.closest(".category");
    if (!catNode) return;
    const catId = catNode.dataset.catId;
    const itemNode = e.target.closest(".item");
    const itemId = itemNode ? itemNode.dataset.itemId : null;

    // Klik kamorkoli na glavo kategorije (razen na gumb) jo odpre/zapre.
    if (!btn && e.target.closest(".cat-head")) {
      return toggleCollapse(catId, catNode);
    }

    if (!btn) return;

    // Akcije kategorije
    if (btn.classList.contains("cat-toggle"))    return toggleCollapse(catId, catNode);
    if (btn.classList.contains("act-add-item"))  return addItem(catId);
    if (btn.classList.contains("act-rename-cat"))return renameCategory(catId);
    if (btn.classList.contains("act-up"))        return moveCategory(catId, -1);
    if (btn.classList.contains("act-down"))      return moveCategory(catId, 1);
    if (btn.classList.contains("act-del-cat"))   return deleteCategory(catId);

    // Akcije elementa
    if (!itemId) return;
    if (btn.classList.contains("act-move-item")) return moveItemToCategory(catId, itemId);
    if (btn.classList.contains("act-item-up"))   return moveItem(catId, itemId, -1);
    if (btn.classList.contains("act-item-down")) return moveItem(catId, itemId, 1);
    if (btn.classList.contains("act-edit-item")) return editItem(catId, itemId);
    if (btn.classList.contains("act-del-item"))  return deleteItem(catId, itemId);
  });

  // Odkljukanje (change na checkboxu)
  els.categoryList.addEventListener("change", (e) => {
    if (!e.target.classList.contains("chk")) return;
    const catId = e.target.closest(".category").dataset.catId;
    const itemId = e.target.closest(".item").dataset.itemId;
    toggleItem(catId, itemId, e.target.checked);
  });
}

/* ================================================================
   ZAGON
   ================================================================ */

/** Ob nalaganju strani naj bodo vse kategorije vseh checklist zložene. */
function collapseAllCategories() {
  store.checklists.forEach((cl) => cl.categories.forEach((cat) => { cat.collapsed = true; }));
}

function init() {
  // Varovalo: modala naj bosta ob zagonu vedno skrita.
  if (modal.overlay) {
    modal.overlay.hidden = true;
    modal.input.hidden = true;
  }
  if (scan.overlay) scan.overlay.hidden = true;
  initTheme();
  bindTopbar();
  bindCategoryList();
  collapseAllCategories();
  renderAll({ persist: true }); // shrani začetno stanje ob prvem zagonu
}

document.addEventListener("DOMContentLoaded", init);