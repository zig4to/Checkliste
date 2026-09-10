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

/* Stanje se napolni šele PO uspešni prijavi (glej razdelek PRIJAVA spodaj).
   Vsak uporabnik ima svojo lokalno kopijo pod ključem
   `checkliste.v1.<userId>`; stari ključ `checkliste.v1` se ne uporablja več. */
let store = null;

/** Ključ lokalne kopije za trenutno prijavljenega uporabnika (ali null). */
function userStoreKey() {
  const uid = Auth.userId();
  return uid ? `${STORAGE_KEY}.${uid}` : null;
}

/** Prebere lokalno kopijo (predpomnilnik) trenutnega uporabnika ali null. */
function loadLocalStore() {
  const key = userStoreKey();
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const data = parsed && parsed.store ? parsed.store : null;
    if (data && Array.isArray(data.checklists) && data.checklists.length) {
      data.activeId = data.checklists[0].id;
      return data;
    }
  } catch (e) {
    console.warn("Napaka pri branju lokalne kopije.", e);
  }
  return null;
}

/** Zapiše lokalno kopijo stanja za trenutnega uporabnika. */
function persistLocal(s, stamp) {
  const key = userStoreKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({ store: s, updated_at: stamp || null }));
  } catch (e) {
    console.warn("Lokalne kopije ni bilo mogoče shraniti.", e);
  }
}

/** Pretvori poljuben (npr. iz oblaka prejet) objekt v veljavno stanje. */
function normalizeStore(raw) {
  const list = raw && Array.isArray(raw.checklists) ? raw.checklists : [];
  const checklists = list.map(normalizeChecklist);
  if (!checklists.length) return buildSeedStore();
  return { activeId: checklists[0].id, seeded: true, checklists };
}

/** Shrani celotno stanje: lokalna kopija + potisk v oblak (z zamikom).
   Kliče se ob vsaki spremembi (prek renderAll). */
function save() {
  if (preview) return;               // predogled tuje checkliste se ne shranjuje
  const key = userStoreKey();
  if (!store || !key) return;
  // Nazadnje urejano (aktivno) checklisto premakni na vrh seznama. Vse poti
  // nalaganja odprejo checklists[0], zato se po osvežitvi odpre prav ta.
  const i = store.checklists.findIndex((c) => c.id === store.activeId);
  if (i > 0) store.checklists.unshift(store.checklists.splice(i, 1)[0]);
  const stamp = new Date().toISOString();
  persistLocal(store, stamp);
  Auth.queuePush(store, stamp);
  queueSharedResync();   // če kaj deliš, osveži deljeno kopijo
}

/* ---------- Dostop do trenutne checkliste ---------- */

/* Predogled deljene checkliste druge osebe (samo za ogled; se ne shranjuje). */
let preview = null; // { checklist, email }

/** Uporabnikova lastna aktivna checklista (ne glede na predogled). */
const ownActive = () => store.checklists.find((c) => c.id === store.activeId) || store.checklists[0];

const getActive = () => preview ? preview.checklist : ownActive();
const getCat    = (cl, catId) => cl.categories.find((c) => c.id === catId);

/* Kategorije, ki imajo trenutno vklopljen nacin urejanja pozicij elementov.
   Zacasno stanje (ne shranjuje se); ohrani se cez ponoven izris. */
const reorderCats = new Set();

/* ---------- Reference na DOM ---------- */

const $ = (sel) => document.querySelector(sel);

const els = {
  clPicker:      $("#clPicker"),
  clTrigger:     $("#checklistTrigger"),
  clLabel:       $("#checklistLabel"),
  clList:        $("#checklistList"),
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

/** Osveži lasten spustni meni checklist (sprožilec + seznam možnosti). */
function renderSelect() {
  const active = ownActive();
  els.clLabel.textContent = active ? active.name : "—";

  els.clList.innerHTML = "";
  store.checklists.forEach((cl) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cl-option" + (cl.id === store.activeId ? " active" : "");
    btn.textContent = cl.name;
    btn.dataset.id = cl.id;
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", cl.id === store.activeId ? "true" : "false");
    els.clList.appendChild(btn);
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

  if (preview) els.categoryList.appendChild(buildPreviewBar());

  if (!cl.categories.length) {
    els.categoryList.insertAdjacentHTML("beforeend", preview
      ? `<div class="empty-state"><p>Ta checklista nima kategorij.</p></div>`
      : `<div class="empty-state"><p>Ni kategorij.</p><p>Dodaj prvo kategorijo z gumbom «＋ Kategorija».</p></div>`);
    return;
  }

  cl.categories.forEach((cat, catIndex) => {
    const node = els.tplCategory.content.firstElementChild.cloneNode(true);
    node.dataset.catId = cat.id;
    if (cat.collapsed) node.classList.add("collapsed");

    // Ohrani vklopljen nacin urejanja pozicij elementov cez ponoven izris.
    if (reorderCats.has(cat.id)) {
      node.classList.add("reordering");
      node.querySelector(".act-reorder-items").classList.add("is-active");
      node.querySelector(".act-reorder-items").setAttribute("aria-pressed", "true");
    }

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
  reorderCats.delete(catId);
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

/** Vklopi / izklopi prikaz gumbov za pozicijo elementov (↔ ↑ ↓) pri vseh
    vnosih dane kategorije. Stanje je zacasno (se ne shranjuje). */
function toggleReorderItems(catId, node, btn) {
  const on = !reorderCats.has(catId);
  if (on) reorderCats.add(catId);
  else reorderCats.delete(catId);
  node.classList.toggle("reordering", on);
  btn.classList.toggle("is-active", on);
  btn.setAttribute("aria-pressed", on ? "true" : "false");
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
  if (preview) return;
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

/** Barva sistemske vrstice v nameščeni aplikaciji (mora ustrezati temi). */
const THEME_COLORS = { dark: "#14181a", light: "#f4f6f5" };

function applyThemeColor(theme) {
  const meta = document.getElementById("metaThemeColor");
  if (meta) meta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.dark);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  applyThemeColor(saved);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", cur);
  localStorage.setItem(THEME_KEY, cur);
  applyThemeColor(cur);
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
  // Izbirnik checkliste: lasten spustni meni (isti slog kot Checkliste / Orodja)
  els.clTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = !els.clPicker.classList.contains("open");
    els.clPicker.classList.toggle("open", willOpen);
    els.clTrigger.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) closeAllPanels();
  });
  els.clList.addEventListener("click", (e) => {
    const btn = e.target.closest(".cl-option");
    if (!btn) return;
    closePreview();
    store.activeId = btn.dataset.id;
    els.search.value = "";
    closeChecklistMenu();
    renderAll();
  });

  // Dejanja nad lastnimi checklistami najprej zapustijo morebitni predogled.
  const own = (fn) => () => { closePreview(); fn(); };
  $("#btnNewChecklist").addEventListener("click", own(newChecklist));
  $("#btnRenameChecklist").addEventListener("click", own(renameChecklist));
  $("#btnDuplicateChecklist").addEventListener("click", own(duplicateChecklist));
  $("#btnDeleteChecklist").addEventListener("click", own(deleteChecklist));

  $("#btnCheckAll").addEventListener("click", () => setAll(true));
  $("#btnClearAll").addEventListener("click", () => setAll(false));
  $("#btnAddCategory").addEventListener("click", own(addCategory));
  $("#btnExportActive").addEventListener("click", exportActive);
  $("#btnExportAll").addEventListener("click", exportAll);
  $("#btnImport").addEventListener("click", () => { closePreview(); els.importFile.click(); });
  $("#btnScan").addEventListener("click", own(startScan));
  $("#btnTheme").addEventListener("click", toggleTheme);

  // Račun (prijava / sinhronizacija)
  if (userMenu.btn) {
    userMenu.btn.addEventListener("click", (e) => { e.stopPropagation(); toggleUserMenu(); });
    userMenu.sync.addEventListener("click", async () => {
      if (userMenu.status) userMenu.status.textContent = "Sinhroniziram…";
      await Auth.syncNow();
      updateSyncBadge();
    });
    userMenu.out.addEventListener("click", () => { closeUserMenu(); Auth.signOut(); });
    bindShareMenu();
    bindSharedMenu();
    document.addEventListener("click", (e) => {
      if (userMenu.el.hidden) return;
      if (userMenu.el.contains(e.target) || userMenu.btn.contains(e.target)) return;
      closeUserMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeUserMenu();
    });
  }

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

  function closeChecklistMenu() {
    els.clPicker.classList.remove("open");
    els.clTrigger.setAttribute("aria-expanded", "false");
  }

  function togglePanel(panel, trigger, other, otherTrig) {
    const willOpen = !panel.classList.contains("open");
    panel.classList.toggle("open", willOpen);
    trigger.setAttribute("aria-expanded", String(willOpen));
    // zapri drugega
    other.classList.remove("open");
    otherTrig.setAttribute("aria-expanded", "false");
    // zapri tudi izbirnik checkliste
    if (willOpen) closeChecklistMenu();
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
  // zunaj njiju ali ob tipki Escape. Enako velja za izbirnik checkliste.
  document.addEventListener("click", (e) => {
    if (!els.clPicker.contains(e.target)) closeChecklistMenu();
    if (panelChecklist.contains(e.target) || panelTools.contains(e.target)) return;
    closeAllPanels();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeAllPanels(); closeChecklistMenu(); closePreview(); }
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

    // V predogledu tuje checkliste je dovoljeno le razpiranje/skrivanje kategorij.
    if (preview) {
      if (btn.classList.contains("cat-toggle")) toggleCollapse(catId, catNode);
      return;
    }

    // Akcije kategorije
    if (btn.classList.contains("cat-toggle"))    return toggleCollapse(catId, catNode);
    if (btn.classList.contains("act-add-item"))  return addItem(catId);
    if (btn.classList.contains("act-rename-cat"))return renameCategory(catId);
    if (btn.classList.contains("act-up"))        return moveCategory(catId, -1);
    if (btn.classList.contains("act-down"))      return moveCategory(catId, 1);
    if (btn.classList.contains("act-reorder-items")) return toggleReorderItems(catId, catNode, btn);
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
   PWA - NAMESTITEV IN OFFLINE DELOVANJE
   ================================================================ */

/** Dogodek beforeinstallprompt shranimo, da lahko namestitev sprozimo sami. */
let deferredInstallPrompt = null;

/** Ali aplikacija ze tece kot nameščena (samostojno okno)? */
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.matchMedia("(display-mode: minimal-ui)").matches ||
  window.navigator.standalone === true;

function setupInstallPrompt() {
  const btn = document.getElementById("btnInstall");
  if (!btn) return;

  // Chrome (Android/namizje) sporoci, da je aplikacijo mogoce namestiti.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (!isStandalone()) btn.hidden = false;
  });

  btn.addEventListener("click", async () => {
    // iOS/Safari nima beforeinstallprompt - pokazemo navodila.
    if (!deferredInstallPrompt) {
      alert([
        "Namestitev na telefonu:",
        "",
        "Chrome (Android): meni ⋮ → Namesti aplikacijo / Dodaj na zacetni zaslon.",
        "iPhone (Safari): Deli → Add to Home Screen."
      ].join("\n"));
      return;
    }
    btn.disabled = true;
    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } finally {
      deferredInstallPrompt = null;
      btn.disabled = false;
      btn.hidden = true;
    }
  });

  // Po uspesni namestitvi gumb ni vec potreben.
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    btn.hidden = true;
  });

  // Ce tece ze nameščena, gumb ostane skrit.
  if (isStandalone()) btn.hidden = true;
}

/* ================================================================
   PWA - PONUDBA NAMESTITVE PO PRIJAVI
   Ob prijavi (prvih 5-krat) pokaze okno z gumbom za namestitev.
   Ne kaze se, ce je (verjetno) ze namesceno ali ce ga je uporabnik zaprl.
   Ponovno uporabi deferredInstallPrompt in isStandalone() od zgoraj.
   ================================================================ */

const IP_LS_COUNT = "install-promo-login-count";
const IP_LS_DONE = "install-promo-done";
const IP_LS_INSTALLED = "install-promo-installed";
const IP_LS_IOS_OFF = "install-promo-ios-off";
const IP_SS_COUNTED = "install-promo-counted";
const IP_MAX = 5;

let ipModal = null;
let ipIosVariant = false;
let ipPending = false;

function ipLsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function ipLsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* zasebni nacin */ } }

function ipIsIOS() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

function ipProbablyInstalled() {
  return isStandalone() || ipLsGet(IP_LS_INSTALLED) === "1";
}

function ipBuildModal() {
  if (ipModal) return ipModal;
  const ic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11m0 0 4-4m-4 4-4-4"/><path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17"/></svg>';
  const style = document.createElement("style");
  style.textContent =
    ".ip-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;background:rgba(8,10,20,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}" +
    ".ip-overlay[hidden]{display:none}" +
    ".ip-box{width:100%;max-width:360px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:24px 22px;border-radius:16px;background:#12131a;color:#f4f5f7;border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 60px -12px rgba(0,0,0,.6);font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
    ".ip-box h2{margin:0;font-size:1.1rem;font-weight:600}" +
    ".ip-box p{margin:0;font-size:.9rem;line-height:1.5;color:rgba(244,245,247,.72)}" +
    ".ip-ico svg{width:32px;height:32px;display:block}" +
    ".ip-primary{margin-top:4px;display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border:0;border-radius:999px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer}" +
    ".ip-primary svg{width:17px;height:17px}" +
    ".ip-cancel{padding:6px 10px;border:0;background:none;color:rgba(244,245,247,.6);font:inherit;font-size:.8rem;cursor:pointer}" +
    ".ip-cancel:hover{color:#f4f5f7}" +
    ".ip-cancel[hidden]{display:none}" +
    "@media (prefers-color-scheme:light){.ip-box{background:#fff;color:#1a1c22;border-color:rgba(0,0,0,.12)}.ip-box p{color:rgba(26,28,34,.66)}.ip-cancel{color:rgba(26,28,34,.55)}.ip-cancel:hover{color:#1a1c22}}";
  document.head.appendChild(style);

  const ov = document.createElement("div");
  ov.className = "ip-overlay";
  ov.hidden = true;
  ov.innerHTML =
    '<div class="ip-box" role="dialog" aria-modal="true" aria-label="Namesti aplikacijo">' +
      '<span class="ip-ico">' + ic + "</span>" +
      "<h2>Namesti aplikacijo</h2>" +
      '<p class="ip-text"></p>' +
      '<button class="ip-primary" type="button">' + ic + '<span class="ip-label">Namesti</span></button>' +
      '<button class="ip-cancel" type="button">Prekliči</button>' +
    "</div>";
  document.body.appendChild(ov);
  ov.addEventListener("click", (e) => { if (e.target === ov) ipClose(); });
  ov.querySelector(".ip-cancel").addEventListener("click", ipClose);
  ov.querySelector(".ip-primary").addEventListener("click", ipPrimary);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ipModal && !ipModal.hidden) ipClose();
  });
  ipModal = ov;
  return ov;
}

function ipOpen() {
  const ov = ipBuildModal();
  ipIosVariant = !deferredInstallPrompt && ipIsIOS();
  const label = ov.querySelector(".ip-label");
  const cancel = ov.querySelector(".ip-cancel");
  if (ipIosVariant) {
    ov.querySelector(".ip-text").textContent = "V Safariju: Deli → Dodaj na začetni zaslon.";
    label.textContent = "Razumem";
    cancel.hidden = true;
  } else {
    ov.querySelector(".ip-text").textContent = "Za najboljšo izkušnjo namesti aplikacijo na svojo napravo.";
    label.textContent = "Namesti";
    cancel.hidden = false;
  }
  ov.hidden = false;
  ov.querySelector(".ip-primary").focus();
}

function ipClose() {
  if (!ipModal) return;
  ipModal.hidden = true;
  ipLsSet(IP_LS_DONE, "1");
  if (ipIosVariant) ipLsSet(IP_LS_IOS_OFF, "1");
}

function ipPrimary() {
  ipClose();
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(() => { deferredInstallPrompt = null; });
}

function ipTriggerOpen() {
  const n = (parseInt(ipLsGet(IP_LS_COUNT), 10) || 0) + 1;
  ipLsSet(IP_LS_COUNT, String(n));
  if (n > IP_MAX) { ipLsSet(IP_LS_DONE, "1"); return; }
  if (n >= IP_MAX) ipLsSet(IP_LS_DONE, "1");
  setTimeout(ipOpen, 400);
}

function maybeInstallPromoAfterLogin() {
  if (ipProbablyInstalled()) return;
  if (ipLsGet(IP_LS_DONE) === "1") return;
  if (ipIsIOS() && ipLsGet(IP_LS_IOS_OFF) === "1") return;
  try {
    if (sessionStorage.getItem(IP_SS_COUNTED)) return;
    sessionStorage.setItem(IP_SS_COUNTED, "1");
  } catch (e) { /* zasebni nacin */ }
  if (!deferredInstallPrompt && !ipIsIOS()) { ipPending = true; return; }
  ipTriggerOpen();
}

// Ce beforeinstallprompt pride sele po prijavi, takrat pokazi okno.
window.addEventListener("beforeinstallprompt", () => {
  if (!ipPending) return;
  ipPending = false;
  if (ipProbablyInstalled() || ipLsGet(IP_LS_DONE) === "1") return;
  setTimeout(() => { if (deferredInstallPrompt) ipTriggerOpen(); }, 150);
});

window.addEventListener("appinstalled", () => {
  ipLsSet(IP_LS_INSTALLED, "1");
  ipLsSet(IP_LS_DONE, "1");
  if (ipModal) ipModal.hidden = true;
});

// Ce je PWA ze namescen (Chromium), si to trajno zapomni.
if (navigator.getInstalledRelatedApps) {
  try {
    navigator.getInstalledRelatedApps().then((apps) => {
      if (apps && apps.length) ipLsSet(IP_LS_INSTALLED, "1");
    }).catch(() => {});
  } catch (e) { /* ni pomembno */ }
}

/** Registrira service worker za offline uporabo. */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // Service worker zahteva https ali localhost.
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("sw.js");

      // Ob novi razlicici jo prevzamemo in stran enkrat osvezimo.
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          // Nova razlicica je pripravljena, stara pa se vedno tece.
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            sw.postMessage("SKIP_WAITING");
          }
        });
      });
    } catch (err) {
      console.warn("[pwa] registracija service workerja ni uspela:", err);
    }
  });
}

/* ================================================================
   PRIJAVA IN SINHRONIZACIJA (Supabase)
   - Prijava je obvezna: brez seje se pokaže zaslon za prijavo.
   - Vsak uporabnik ima svojo vrstico v tabeli "user_checklists"
     (stolpec "data" tipa jsonb) + lokalno kopijo za delo brez povezave.
   - Sinhronizacija: zadnji zapis zmaga (cel objekt naenkrat).
   ================================================================ */

const SB_TABLE         = "user_checklists";
const SHARE_TABLE      = "shared_checklists";
const PUSH_DEBOUNCE_MS  = 1500;
const PUSH_RETRY_MS     = 4000;

const authGate = {
  el:     $("#authGate"),
  form:   $("#authForm"),
  email:  $("#authEmail"),
  pass:   $("#authPassword"),
  submit: $("#authSubmit"),
  toggle: $("#authToggle"),
  error:  $("#authError"),
  sub:    $("#authSub"),
  mode:   "signin"
};

const userMenu = {
  btn:    $("#btnUser"),
  el:     $("#userMenu"),
  email:  $("#userMenuEmail"),
  status: $("#userMenuStatus"),
  sync:   $("#btnSyncNow"),
  out:    $("#btnSignOut"),
  // Deljenje checklist
  shareToggle:  $("#btnShareToggle"),
  shareOptions: $("#shareOptions"),
  shareAll:     $("#btnShareAll"),
  shareSome:    $("#btnShareSome"),
  sharePicker:  $("#sharePicker"),
  shareList:    $("#sharePickerList"),
  shareConfirm: $("#btnShareSomeConfirm"),
  shareStop:    $("#btnShareStop"),
  shareStatus:  $("#shareStatus"),
  shareHint:    $("#shareHint")
};

const sharedMenu = {
  btn:  $("#btnShared"),
  el:   $("#sharedMenu"),
  list: $("#sharedUsersList")
};

const Auth = {
  client: null,
  user: null,
  _onIn: null,
  _onOut: null,
  _pushTimer: null,
  _pending: null,        // { store, stamp }
  _pushing: false,
  _ssoInProgress: false, // med izmenjavo SSO žetonov iz huba
  remoteStamp: null,

  configured() {
    const c = window.SUPABASE_CONFIG || {};
    return !!(c.url && c.anonKey &&
      !/YOUR-PROJECT/.test(c.url) && !/YOUR-ANON/.test(c.anonKey));
  },

  userId() { return this.user ? this.user.id : null; },
  email()  { return this.user ? this.user.email : null; },

  async start({ onSignedIn, onSignedOut }) {
    this._onIn = onSignedIn;
    this._onOut = onSignedOut;
    bindAuthGate();
    setAuthMode("signin");

    if (!this.configured()) {
      showAuthGate();
      setAuthError("Aplikacija ni povezana s Supabase. Uredi datoteko config.js (Project URL in anon ključ).", true);
      authGate.submit.disabled = true;
      return;
    }
    if (!window.supabase || !window.supabase.createClient) {
      showAuthGate();
      setAuthError("Knjižnice za prijavo ni bilo mogoče naložiti. Poveži se z internetom in osveži stran.", true);
      return;
    }

    try {
      this.client = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
      );
    } catch (e) {
      console.warn(e);
      showAuthGate();
      setAuthError("Napaka pri povezavi s Supabase. Preveri config.js.", true);
      return;
    }

    this.client.auth.onAuthStateChange((event, session) => {
      // Začetno prijavo iz huba obravnava start() sam (spodaj), da se
      // bootApp ne sproži dvakrat.
      if (this._ssoInProgress) return;
      const next = session ? session.user : null;
      const prevId = this.user ? this.user.id : null;
      this.user = next;
      if (event === "SIGNED_IN" && next && next.id !== prevId) {
        hideAuthGate();
        this._onIn && this._onIn();
      } else if (event === "SIGNED_OUT") {
        this._clearPush();
        this._onOut && this._onOut();
      }
    });

    window.addEventListener("online", () => {
      updateSyncBadge();
      if (this._pending) this._flush();
      else maybePull();
    });
    window.addEventListener("offline", updateSyncBadge);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") maybePull();
    });

    // Prijava iz huba (TomsStudios): naslov lahko nosi
    // #sb_at=<access_token>&sb_rt=<refresh_token>. Zamenjamo ju za sejo; med
    // tem je viden nalagalnik (glej .sso-pending v index.html in style.css).
    await this._trySsoLogin();

    let session = null;
    try {
      const { data } = await this.client.auth.getSession();
      session = data.session;
    } catch (e) { console.warn(e); }

    this.user = session ? session.user : null;
    if (this.user) {
      hideAuthGate();
      this._onIn && this._onIn();
    } else {
      showAuthGate();
    }
  },

  /** Če naslov nosi SSO žetona iz huba, ju zamenjaj za sejo (loader je že
   *  viden — postavi ga pre-paint skript v index.html). Ob neuspehu se tiho
   *  vrne in start() pokaže običajni prijavni zaslon. */
  async _trySsoLogin() {
    const root = document.documentElement;
    const stopLoader = () => root.classList.remove("sso-pending");

    let raw = "";
    try { raw = (window.location.hash || "").replace(/^#/, ""); } catch (e) {}
    if (raw.indexOf("sb_at=") === -1 || raw.indexOf("sb_rt=") === -1) {
      stopLoader();
      return;
    }

    const params = new URLSearchParams(raw);
    const accessToken = params.get("sb_at");
    const refreshToken = params.get("sb_rt");

    // Iz naslovne vrstice odstranimo le SSO parametra, ostalo pustimo.
    params.delete("sb_at");
    params.delete("sb_rt");
    const rest = params.toString();
    try {
      window.history.replaceState(
        null, "",
        window.location.pathname + window.location.search + (rest ? "#" + rest : "")
      );
    } catch (e) {}

    if (!accessToken || !refreshToken) { stopLoader(); return; }

    root.classList.add("sso-pending");
    // Varovalo, če se izmenjava nikoli ne zaključi (Supabase nedosegljiv).
    const safety = setTimeout(stopLoader, 10000);
    this._ssoInProgress = true;
    try {
      const { error } = await this.client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) console.warn("[sso] prijava iz huba ni uspela:", error);
    } catch (e) {
      console.warn("[sso] prijava iz huba ni uspela:", e);
    } finally {
      this._ssoInProgress = false;
      clearTimeout(safety);
      stopLoader();
    }
  },

  signIn(email, password) { return this.client.auth.signInWithPassword({ email, password }); },
  signUp(email, password) { return this.client.auth.signUp({ email, password }); },
  async signOut() {
    try { await this.syncNow(); } catch (e) { /* ignore */ }
    this._clearPush();
    try { return await this.client.auth.signOut(); }
    catch (e) { console.warn(e); this._onOut && this._onOut(); }
  },

  async pull() {
    const uid = this.userId();
    if (!uid) return null;
    const { data, error } = await this.client
      .from(SB_TABLE)
      .select("data, updated_at")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    this.remoteStamp = data.updated_at || null;
    return { data: data.data, updated_at: data.updated_at || null };
  },

  async push(storeObj, stamp) {
    const uid = this.userId();
    if (!uid) return;
    const updated_at = stamp || new Date().toISOString();
    const { error } = await this.client
      .from(SB_TABLE)
      .upsert({ user_id: uid, data: storeObj, updated_at }, { onConflict: "user_id" });
    if (error) throw error;
    this.remoteStamp = updated_at;
  },

  queuePush(storeObj, stamp) {
    this._pending = { store: storeObj, stamp: stamp || new Date().toISOString() };
    updateSyncBadge();
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => this._flush(), PUSH_DEBOUNCE_MS);
  },

  /* ---- Deljenje checklist ---- */

  /** Zapiše (ali posodobi) nabor deljenih checklist trenutnega uporabnika. */
  async pushShares(checklists) {
    const uid = this.userId();
    if (!uid) throw new Error("Ni prijave.");
    const updated_at = new Date().toISOString();
    const { error } = await this.client
      .from(SHARE_TABLE)
      .upsert({ user_id: uid, email: this.email(), checklists, updated_at }, { onConflict: "user_id" });
    if (error) throw error;
  },

  /** Odstrani vse deljene checkliste trenutnega uporabnika. */
  async clearShares() {
    const uid = this.userId();
    if (!uid) throw new Error("Ni prijave.");
    const { error } = await this.client.from(SHARE_TABLE).delete().eq("user_id", uid);
    if (error) throw error;
  },

  /** Trenutni deljeni nabor tega uporabnika (ali null). */
  async myShares() {
    const uid = this.userId();
    if (!uid) return null;
    const { data, error } = await this.client
      .from(SHARE_TABLE)
      .select("checklists, updated_at")
      .eq("user_id", uid)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  /** Deljeni nabori vseh drugih uporabnikov. */
  async sharedFeed() {
    const uid = this.userId();
    if (!uid) return [];
    const { data, error } = await this.client
      .from(SHARE_TABLE)
      .select("user_id, email, checklists, updated_at")
      .neq("user_id", uid)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []).filter((r) => Array.isArray(r.checklists) && r.checklists.length);
  },

  async syncNow() {
    clearTimeout(this._pushTimer);
    if (!this._pending && store && this.userId()) {
      this._pending = { store, stamp: new Date().toISOString() };
    }
    await this._flush();
  },

  async _flush() {
    if (this._pushing || !this._pending) return;
    if (!navigator.onLine) { updateSyncBadge(); return; }
    this._pushing = true;
    updateSyncBadge();
    const job = this._pending;
    try {
      await this.push(job.store, job.stamp);
      if (this._pending === job) this._pending = null;
    } catch (e) {
      console.warn("Sinhronizacija ni uspela, poskusim znova.", e);
      clearTimeout(this._pushTimer);
      this._pushTimer = setTimeout(() => this._flush(), PUSH_RETRY_MS);
    } finally {
      this._pushing = false;
      updateSyncBadge();
    }
  },

  _clearPush() {
    clearTimeout(this._pushTimer);
    this._pending = null;
    this._pushing = false;
    this.remoteStamp = null;
  }
};

/* ---------- Zaslon za prijavo ---------- */

let authGateBound = false;

function showAuthGate() {
  document.body.classList.add("auth-locked");
  if (authGate.el) authGate.el.hidden = false;
  if (authGate.email) setTimeout(() => authGate.email.focus(), 60);
}

function hideAuthGate() {
  document.body.classList.remove("auth-locked");
  if (authGate.el) authGate.el.hidden = true;
  setAuthError("", false);
}

function setAuthError(msg, show) {
  if (!authGate.error) return;
  authGate.error.textContent = msg || "";
  authGate.error.hidden = !(show && msg);
}

function setAuthMode(mode) {
  authGate.mode = mode;
  const signup = mode === "signup";
  if (!authGate.submit) return;
  authGate.submit.textContent = signup ? "Ustvari račun" : "Prijava";
  authGate.toggle.textContent = signup ? "Že imaš račun? Prijavi se" : "Nimaš računa? Registriraj se";
  authGate.sub.textContent = signup
    ? "Ustvari račun za shranjevanje svojih checklist."
    : "Prijavi se za dostop do svojih checklist.";
  authGate.pass.setAttribute("autocomplete", signup ? "new-password" : "current-password");
  setAuthError("", false);
}

function translateAuthError(error) {
  const m = ((error && error.message) || "").toLowerCase();
  if (m.includes("invalid login")) return "Napačna e-pošta ali geslo.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ta e-pošta je že registrirana. Prijavi se.";
  if (m.includes("password should be") || m.includes("password should contain")) return "Geslo mora imeti vsaj 6 znakov.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "Neveljaven e-naslov.";
  if (m.includes("email not confirmed")) return "E-naslov še ni potrjen. Preveri e-pošto.";
  if (m.includes("rate limit") || m.includes("too many")) return "Preveč poskusov. Počakaj minuto in poskusi znova.";
  return (error && error.message) || "Prijava ni uspela.";
}

function bindAuthGate() {
  if (authGateBound || !authGate.form) return;
  authGateBound = true;

  authGate.toggle.addEventListener("click", () => {
    setAuthMode(authGate.mode === "signup" ? "signin" : "signup");
  });

  authGate.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = authGate.email.value.trim();
    const password = authGate.pass.value;
    if (!email || password.length < 6) {
      setAuthError("Vpiši veljaven e-naslov in geslo (vsaj 6 znakov).", true);
      return;
    }
    if (!navigator.onLine) {
      setAuthError("Ni povezave. Za prijavo potrebuješ internet.", true);
      return;
    }
    authGate.submit.disabled = true;
    setAuthError("", false);
    try {
      const { data, error } = authGate.mode === "signup"
        ? await Auth.signUp(email, password)
        : await Auth.signIn(email, password);
      if (error) { setAuthError(translateAuthError(error), true); return; }
      if (authGate.mode === "signup" && !data.session) {
        setAuthError("Račun ustvarjen. Preveri e-pošto za potrditev, nato se prijavi.", true);
        setAuthMode("signin");
        return;
      }
      // Uspeh: onAuthStateChange sproži nadaljevanje (bootApp).
    } catch (err) {
      console.warn(err);
      setAuthError("Napaka pri prijavi. Preveri povezavo in poskusi znova.", true);
    } finally {
      authGate.submit.disabled = false;
    }
  });
}

/* ---------- Meni računa ---------- */

function openUserMenu() {
  if (!userMenu.el) return;
  closeSharedMenu();
  updateAccountUI();
  userMenu.el.hidden = false;
  userMenu.btn.setAttribute("aria-expanded", "true");
}
function closeUserMenu() {
  if (!userMenu.el) return;
  userMenu.el.hidden = true;
  userMenu.btn.setAttribute("aria-expanded", "false");
  resetShareUI();
}
function toggleUserMenu() {
  if (userMenu.el.hidden) openUserMenu(); else closeUserMenu();
}

/* ---------- Deljenje checklist ---------- */

/* ID-ji checklist, ki jih uporabnik trenutno deli (za predizbor v izbirniku). */
let mySharedIds = [];

/** Vrne odseke v zloženo (zaprto) izhodišče. */
function resetShareUI() {
  if (!userMenu.shareToggle) return;
  collapseShareSection(userMenu.shareToggle, userMenu.shareOptions);
  collapseShareSection(userMenu.shareSome, userMenu.sharePicker);
  if (userMenu.shareHint) { userMenu.shareHint.hidden = true; userMenu.shareHint.textContent = ""; }
  if (userMenu.shareStatus) userMenu.shareStatus.textContent = "";
}

function collapseShareSection(toggleBtn, panel) {
  if (panel) panel.hidden = true;
  if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
}

/** Preklopi razdelek (gumb + panel); ob odprtju izbirnika ga napolni. */
function toggleShareSection(toggleBtn, panel, onOpen) {
  if (!panel) return;
  const willOpen = panel.hidden;
  panel.hidden = !willOpen;
  toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  if (willOpen && typeof onOpen === "function") onOpen();
}

/** Prijazno sporočilo za napako pri deljenju. */
function shareErrorText(e) {
  const msg = (e && (e.message || e.hint || "")) + "";
  const code = e && e.code;
  if (code === "42P01" || code === "PGRST205" || /shared_checklists/.test(msg)) {
    return "Deljenje ni nastavljeno na strežniku (manjka tabela shared_checklists).";
  }
  if (!navigator.onLine) return "Deljenje potrebuje internetno povezavo.";
  return "Deljenje ni uspelo. Poskusi znova.";
}

/** Očisti checklisto za deljenje: brez stanja odkljukanja in zloženosti. */
function cleanChecklistForShare(cl) {
  return {
    id: cl.id,
    name: cl.name,
    categories: (cl.categories || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: (cat.items || []).map((it) => ({ id: it.id, text: it.text }))
    }))
  };
}

/** Osveži prikaz trenutnega stanja deljenja (besedilo + gumb "Nehaj deliti"). */
async function refreshShareStatus() {
  const s = userMenu.shareStatus;
  if (s) { s.textContent = "Preverjam stanje deljenja …"; s.hidden = false; }
  if (userMenu.shareStop) userMenu.shareStop.hidden = true;
  if (!Auth.configured()) {
    if (s) s.textContent = "Deljenje ni na voljo (strežnik ni nastavljen).";
    mySharedIds = [];
    return;
  }
  try {
    const mine = await Auth.myShares();
    mySharedIds = mine && Array.isArray(mine.checklists) ? mine.checklists.map((c) => c.id) : [];
    if (s) {
      s.textContent = mySharedIds.length
        ? `Trenutno deliš ${mySharedIds.length} ${plural(mySharedIds.length, "checklisto", "checklisti", "checkliste", "checklist")}.`
        : "Trenutno ne deliš ničesar.";
    }
    if (userMenu.shareStop) userMenu.shareStop.hidden = mySharedIds.length === 0;
  } catch (e) {
    console.warn("Stanja deljenja ni bilo mogoče prebrati.", e);
    mySharedIds = [];
    if (s) s.textContent = shareErrorText(e);
  }
}

/** Slovensko sklanjanje po številu (1 / 2 / 3-4 / 5+). */
function plural(n, one, two, few, many) {
  const m100 = n % 100, m10 = n % 10;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 === 2) return two;
  if (m10 === 3 || m10 === 4) return few;
  return many;
}

/** Izriše seznam checklist s kljukicami za izbor (predizbrane = trenutno deljene). */
function renderSharePicker() {
  const list = userMenu.shareList;
  if (!list || !store) return;
  list.innerHTML = "";
  store.checklists.forEach((cl) => {
    const label = document.createElement("label");
    label.className = "share-picker-item";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = cl.id;
    cb.checked = mySharedIds.includes(cl.id);
    cb.addEventListener("change", updateShareConfirm);
    const span = document.createElement("span");
    span.textContent = cl.name;
    label.append(cb, span);
    list.appendChild(label);
  });
  updateShareConfirm();
}

/** Zbrani ID-ji izbranih checklist v izbirniku. */
function selectedShareIds() {
  if (!userMenu.shareList) return [];
  return [...userMenu.shareList.querySelectorAll("input:checked")].map((c) => c.value);
}

/* ---- Samodejno osveževanje deljene kopije ob urejanju ---- */

let _sharedResyncTimer = null;

/** Ob prijavi naloži, katere svoje checkliste uporabnik trenutno deli. */
async function loadMySharedIds() {
  if (!Auth.configured()) { mySharedIds = []; return; }
  try {
    const mine = await Auth.myShares();
    mySharedIds = mine && Array.isArray(mine.checklists) ? mine.checklists.map((c) => c.id) : [];
  } catch (e) {
    mySharedIds = [];
  }
}

/** Po urejanju z zamikom potisne svežo različico deljenih checklist v oblak. */
function queueSharedResync() {
  if (!mySharedIds.length || !Auth.configured() || !navigator.onLine) return;
  clearTimeout(_sharedResyncTimer);
  _sharedResyncTimer = setTimeout(resyncShared, 1500);
}

async function resyncShared() {
  if (!store || !mySharedIds.length) return;

  // Kaj je deljeno, določa vrstica v oblaku (ne lokalno stanje). Samodejni
  // resync SAMO osvežuje vsebino - deljenja nikoli sam ne izklopi.
  let mine;
  try {
    mine = await Auth.myShares();
  } catch (e) {
    console.warn("Deljenih checklist ni bilo mogoče prebrati za osvežitev.", e);
    return;
  }
  if (!mine || !Array.isArray(mine.checklists) || !mine.checklists.length) {
    // Deljenje je bilo izklopljeno (ročno ali na drugi napravi) - ne oživljaj ga.
    mySharedIds = [];
    return;
  }

  const local = new Map(store.checklists.map((c) => [c.id, c]));
  const merged = mine.checklists.map((shared) => {
    const cur = local.get(shared.id);
    return cur ? cleanChecklistForShare(cur) : shared; // ni več lokalno -> ohrani star posnetek
  });

  try {
    await Auth.pushShares(merged);
    mySharedIds = merged.map((c) => c.id);
  } catch (e) {
    console.warn("Samodejna posodobitev deljenih checklist ni uspela.", e);
  }
}

function updateShareConfirm() {
  if (!userMenu.shareConfirm) return;
  const n = selectedShareIds().length;
  userMenu.shareConfirm.disabled = n === 0;
  userMenu.shareConfirm.textContent = n ? `Deli izbrane (${n})` : "Deli izbrane";
}

/** Dejansko deljenje: zapiše nabor v oblak, nato osveži stanje. */
async function handleShare(mode, ids) {
  const hint = userMenu.shareHint;
  if (!hint || !store) return;

  const picked = mode === "all"
    ? store.checklists.slice()
    : store.checklists.filter((c) => ids.includes(c.id));
  if (!picked.length) return;

  hint.hidden = false;
  hint.textContent = "Deljenje …";
  const btn = mode === "all" ? userMenu.shareAll : userMenu.shareConfirm;
  if (btn) btn.disabled = true;

  try {
    await Auth.pushShares(picked.map(cleanChecklistForShare));
    hint.textContent = `Deljeno: ${picked.length} ${plural(picked.length, "checklista", "checklisti", "checkliste", "checklist")}.`;
    await refreshShareStatus();
  } catch (e) {
    console.warn("Deljenje ni uspelo.", e);
    hint.textContent = shareErrorText(e);
  } finally {
    if (userMenu.shareAll) userMenu.shareAll.disabled = false;
    updateShareConfirm();
  }
}

/** Preneha deliti vse (izbriše vrstico v oblaku). */
async function handleStopSharing() {
  const hint = userMenu.shareHint;
  if (!hint) return;
  hint.hidden = false;
  hint.textContent = "Ustavljam deljenje …";
  if (userMenu.shareStop) userMenu.shareStop.disabled = true;
  try {
    await Auth.clearShares();
    hint.textContent = "Deljenje ustavljeno.";
    await refreshShareStatus();
    if (!userMenu.sharePicker.hidden) renderSharePicker();
  } catch (e) {
    console.warn("Deljenja ni bilo mogoče ustaviti.", e);
    hint.textContent = shareErrorText(e);
  } finally {
    if (userMenu.shareStop) userMenu.shareStop.disabled = false;
  }
}

function bindShareMenu() {
  if (!userMenu.shareToggle) return;
  userMenu.shareToggle.addEventListener("click", () => {
    toggleShareSection(userMenu.shareToggle, userMenu.shareOptions, refreshShareStatus);
    if (userMenu.shareOptions.hidden) collapseShareSection(userMenu.shareSome, userMenu.sharePicker);
    if (userMenu.shareHint) userMenu.shareHint.hidden = true;
  });
  userMenu.shareSome.addEventListener("click", () => {
    toggleShareSection(userMenu.shareSome, userMenu.sharePicker, renderSharePicker);
    if (userMenu.shareHint) userMenu.shareHint.hidden = true;
  });
  userMenu.shareAll.addEventListener("click", () => handleShare("all"));
  userMenu.shareConfirm.addEventListener("click", () => handleShare("some", selectedShareIds()));
  if (userMenu.shareStop) userMenu.shareStop.addEventListener("click", handleStopSharing);
}

/* ---------- Deljeno z mano ---------- */

function openSharedMenu() {
  if (!sharedMenu.el) return;
  closeUserMenu();
  sharedMenu.el.hidden = false;
  sharedMenu.btn.setAttribute("aria-expanded", "true");
  loadSharedUsers();
}
function closeSharedMenu() {
  if (!sharedMenu.el) return;
  sharedMenu.el.hidden = true;
  sharedMenu.btn.setAttribute("aria-expanded", "false");
}
function toggleSharedMenu() {
  if (sharedMenu.el.hidden) openSharedMenu(); else closeSharedMenu();
}

/** Naloži deljene nabore drugih uporabnikov in jih izriše. */
async function loadSharedUsers() {
  const box = sharedMenu.list;
  if (!box) return;
  box.innerHTML = "";
  const info = document.createElement("p");
  info.className = "shared-empty";
  box.appendChild(info);

  if (!Auth.configured()) { info.textContent = "Deljenje ni na voljo (strežnik ni nastavljen)."; return; }
  info.textContent = "Nalagam …";

  let feed;
  try {
    feed = await Auth.sharedFeed();
  } catch (e) {
    console.warn("Deljenih checklist ni bilo mogoče naložiti.", e);
    info.textContent = shareErrorText(e);
    return;
  }
  renderSharedUsers(feed);
}

/** Izrise seznam uporabnikov; klik na osebo razpre njene deljene checkliste. */
function renderSharedUsers(feed) {
  const box = sharedMenu.list;
  if (!box) return;
  box.innerHTML = "";

  if (!feed || !feed.length) {
    const p = document.createElement("p");
    p.className = "shared-empty";
    p.textContent = "Nihče še ni delil checklist s tabo.";
    box.appendChild(p);
    return;
  }

  feed.forEach((u) => {
    const wrap = document.createElement("div");
    wrap.className = "shared-user";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shared-user-btn";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
      '<span></span>' +
      '<svg class="share-caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btn.querySelector("span").textContent = u.email || "—";

    const ul = document.createElement("ul");
    ul.className = "shared-user-lists";
    ul.hidden = true;
    (u.checklists || []).forEach((cl) => {
      const li = document.createElement("li");
      const open = document.createElement("button");
      open.type = "button";
      open.className = "shared-cl-btn";
      open.textContent = cl.name;
      open.addEventListener("click", () => openPreview(cl, u.email));
      li.appendChild(open);
      ul.appendChild(li);
    });
    if (!ul.children.length) {
      const li = document.createElement("li");
      li.className = "shared-cl-empty";
      li.textContent = "Ni deljenih checklist.";
      ul.appendChild(li);
    }

    btn.addEventListener("click", () => {
      const willOpen = ul.hidden;
      ul.hidden = !willOpen;
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    wrap.append(btn, ul);
    box.appendChild(wrap);
  });
}

/* ---------- Predogled deljene checkliste ---------- */

/** Vrstica nad vsebino: čigava checklista je v predogledu + gumb za izhod. */
function buildPreviewBar() {
  const bar = document.createElement("div");
  bar.className = "preview-bar";

  const txt = document.createElement("div");
  txt.className = "preview-bar-text";
  const label = document.createElement("span");
  label.className = "preview-bar-label";
  label.textContent = "Predogled deljene checkliste";
  const meta = document.createElement("span");
  meta.className = "preview-bar-meta";
  const strong = document.createElement("strong");
  strong.textContent = preview.checklist.name;
  meta.append(strong);
  if (preview.email) meta.append(document.createTextNode(" · " + preview.email));
  txt.append(label, meta);

  const save = document.createElement("button");
  save.type = "button";
  save.className = "tool-btn primary preview-save";
  save.textContent = "Shrani checklisto";
  save.addEventListener("click", savePreviewToMyLists);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "tool-btn preview-close";
  close.textContent = "Zapri predogled";
  close.addEventListener("click", closePreview);

  bar.append(txt, save, close);
  return bar;
}

/** Shrani checklisto iz predogleda med uporabnikove lastne (in jo odpre). */
function savePreviewToMyLists() {
  if (!preview || !store) return;
  const copy = clone(preview.checklist);
  copy.id = uid("cl");
  copy.name = preview.checklist.name;
  reassignIds(copy);
  copy.categories.forEach((cat) => {
    cat.collapsed = false;
    cat.items.forEach((it) => { it.done = false; });
  });
  store.checklists.push(copy);
  store.activeId = copy.id;
  preview = null;
  document.body.classList.remove("preview-mode");
  renderAll(); // shrani lokalno + sinhronizira, premakne na vrh seznama
}

/** Odpre checklisto druge osebe kot predogled v glavnem prikazu (samo ogled). */
function openPreview(checklist, email) {
  if (!checklist) return;
  preview = { checklist: clone(checklist), email: email || "" };
  document.body.classList.add("preview-mode");
  els.search.value = "";
  closeSharedMenu();
  renderAll({ persist: false });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Zapre predogled in vrne uporabnikovo lastno aktivno checklisto. */
function closePreview() {
  if (!preview) return;
  preview = null;
  document.body.classList.remove("preview-mode");
  if (store) renderAll({ persist: false });
}

function bindSharedMenu() {
  if (!sharedMenu.btn) return;
  sharedMenu.btn.addEventListener("click", (e) => { e.stopPropagation(); toggleSharedMenu(); });
  document.addEventListener("click", (e) => {
    if (sharedMenu.el.hidden) return;
    if (sharedMenu.el.contains(e.target) || sharedMenu.btn.contains(e.target)) return;
    closeSharedMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSharedMenu();
  });
}

function updateAccountUI() {
  if (userMenu.email) userMenu.email.textContent = Auth.email() || "—";
  updateSyncBadge();
}

function updateSyncBadge() {
  if (!userMenu.btn) return;
  const offline = !navigator.onLine;
  const syncing = Auth._pushing;
  const dirty = !!Auth._pending && !syncing;
  userMenu.btn.classList.toggle("is-offline", offline);
  userMenu.btn.classList.toggle("is-syncing", syncing);
  userMenu.btn.classList.toggle("is-dirty", dirty);
  if (userMenu.status) {
    userMenu.status.textContent = offline
      ? "Brez povezave – shranjeno lokalno."
      : syncing ? "Sinhroniziram…"
      : dirty   ? "Čaka na sinhronizacijo…"
      : "Vse sinhronizirano.";
  }
}

/* ---------- Zagon aplikacije po prijavi ---------- */

let listenersBound = false;

/** Poišče stanje za uporabnika: oblak → lokalna kopija → seme. */
async function resolveUserStore() {
  try {
    const remote = await Auth.pull();
    if (remote && remote.data && Array.isArray(remote.data.checklists) && remote.data.checklists.length) {
      const s = normalizeStore(remote.data);
      persistLocal(s, remote.updated_at);
      return s;
    }
    // Prvi vpis tega računa: posej privzete checkliste in jih shrani v oblak.
    const seeded = buildSeedStore();
    persistLocal(seeded, null);
    try {
      await Auth.push(seeded);
      persistLocal(seeded, Auth.remoteStamp);
    } catch (e) {
      console.warn("Začetnega semena ni bilo mogoče shraniti v oblak; poskusim pozneje.", e);
      Auth.queuePush(seeded);
    }
    return seeded;
  } catch (e) {
    console.warn("Branje iz oblaka ni uspelo, uporabljam lokalno kopijo.", e);
    const local = loadLocalStore();
    if (local) return local;
    const seeded = buildSeedStore();
    persistLocal(seeded, null);
    Auth.queuePush(seeded);   // potisni takoj, ko bo povezava
    return seeded;
  }
}

/** Če je strežniška vrstica novejša in nimamo čakajočih sprememb, jo prenesi.
   Zaščita proti tihemu razhajanju med napravami (zadnji zapis sicer zmaga). */
async function maybePull() {
  if (!Auth.userId() || Auth._pending || Auth._pushing || !navigator.onLine || !store) return;
  const knownStamp = Auth.remoteStamp;
  try {
    const remote = await Auth.pull();   // posodobi Auth.remoteStamp kot stranski učinek
    if (!remote || !remote.data) return;
    const newer = !knownStamp || (remote.updated_at && remote.updated_at > knownStamp);
    if (newer && Array.isArray(remote.data.checklists) && remote.data.checklists.length) {
      store = normalizeStore(remote.data);
      persistLocal(store, remote.updated_at);
      renderAll({ persist: false });
      updateAccountUI();
    }
  } catch (e) { /* tiho */ }
}

async function bootApp() {
  document.body.classList.remove("auth-locked");
  store = await resolveUserStore();

  if (!listenersBound) {
    bindTopbar();
    bindCategoryList();
    listenersBound = true;
  }
  collapseAllCategories();
  renderAll({ persist: false });   // stanje je usklajeno; ne prožimo takoj potiska
  updateAccountUI();
  updateSyncBadge();
  loadMySharedIds();               // za samodejno osveževanje deljene kopije
  maybeInstallPromoAfterLogin();
}

function teardownApp() {
  store = null;
  clearTimeout(_sharedResyncTimer);
  mySharedIds = [];
  closePreview();
  closeUserMenu();
  closeSharedMenu();
  if (els.categoryList) els.categoryList.innerHTML = "";
  showAuthGate();
}

/* ================================================================
   ZAGON
   ================================================================ */

/** Ob nalaganju strani naj bodo vse kategorije vseh checklist zložene. */
function collapseAllCategories() {
  if (!store) return;
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
  setupInstallPrompt();
  registerServiceWorker();
  Auth.start({ onSignedIn: bootApp, onSignedOut: teardownApp });
}

document.addEventListener("DOMContentLoaded", init);