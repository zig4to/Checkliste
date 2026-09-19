# Prijava + sinhronizacija (Supabase) — namestitev

Koda za prijavo je že vgrajena. Da začne delovati, moraš narediti nekaj korakov
v Supabase nadzorni plošči in vpisati ključe v `config.js`.

## 1. Ustvari Supabase projekt

1. Pojdi na <https://supabase.com> → **New project**.
2. Izberi regijo blizu sebe, shrani si geslo baze (ni potrebno za aplikacijo).

## 2. Ustvari tabelo + pravila (RLS)

Supabase → **SQL Editor** → prilepi in poženi:

```sql
create table public.user_checklists (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_checklists enable row level security;

create policy "select own" on public.user_checklists
  for select using (auth.uid() = user_id);

create policy "insert own" on public.user_checklists
  for insert with check (auth.uid() = user_id);

create policy "update own" on public.user_checklists
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Vse tri politike so obvezne — brez `insert` politike prvi vpis novega računa ne uspe.

## 2b. Tabela za deljenje checklist (funkcija "Deli checkliste")

Da začne delovati deljenje (gumb **Deli checkliste** v meniju računa in meni
**Deljeno z mano**), poženi v **SQL Editor** še:

```sql
create table public.shared_checklists (
  user_id      uuid primary key references auth.users on delete cascade,
  email        text,
  display_name text,          -- iz auth.users.raw_user_meta_data.display_name, ce ga uporabnik ima
  checklists   jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.shared_checklists enable row level security;

-- vsak PRIJAVLJEN uporabnik vidi vse deljene sezname (zato so e-naslovi
-- tistih, ki delijo, vidni vsem prijavljenim uporabnikom)
create policy "shared select all" on public.shared_checklists
  for select to authenticated using (true);

-- ureja / briše lahko samo svojo vrstico
create policy "shared insert own" on public.shared_checklists
  for insert to authenticated with check (auth.uid() = user_id);
create policy "shared update own" on public.shared_checklists
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "shared delete own" on public.shared_checklists
  for delete to authenticated using (auth.uid() = user_id);
```

Kako deluje:

- **Deli vse checkliste** / **Deli določene …** shrani izbrane checkliste
  (kopijo brez odkljukanj) v tvojo vrstico `shared_checklists`.
- **Nehaj deliti** izbriše vrstico.
- **Deljeno z mano** prebere vrstice vseh drugih uporabnikov; klik na osebo
  razpre imena checklist, ki jih deli.
- Deljene checkliste so **posnetek** ob deljenju — ko jih pozneje urejaš, se
  deljena kopija ne posodobi sama; ponovno klikni Deli.

## 2c. Tabela za skupinske checkliste (zavihek "Skupinske checkliste")

Da začne delovati zavihek **Skupinske checkliste** (v meniju "Deljeno") in
gumb **Ustvari skupinsko** (v Orodjih), poženi v **SQL Editor** še:

> Če si to tabelo že ustvaril prej (starejša različica te datoteke), jo najprej
> zbriši - shema se je spet spremenila (dodan stolpec `email`, drugačna RLS
> pravila, ki zdaj resnično omogočajo skupno urejanje):
> `drop table if exists public.group_checklists;`

```sql
create table public.group_checklists (
  id           text primary key,   -- isti id kot lokalna checklista (npr. "cl_xxx")
  name         text not null,
  checklist    jsonb not null,
  created_by   uuid references auth.users on delete set null,
  email        text,               -- e-posta PRAVEGA ustvarjalca (glej sprozilec spodaj)
  display_name text,               -- prikazno ime PRAVEGA ustvarjalca (isto, glej sprozilec spodaj)
  updated_at   timestamptz not null default now()
);

alter table public.group_checklists enable row level security;

-- vsak PRIJAVLJEN uporabnik vidi vse skupinske checkliste
create policy "group select all" on public.group_checklists
  for select to authenticated using (true);

-- ustvariti sme vsak prijavljen uporabnik
create policy "group insert own" on public.group_checklists
  for insert to authenticated with check (auth.uid() = created_by);

-- UREJATI (zivo posodabljati vsebino) sme VSAK prijavljen uporabnik, ne
-- samo ustvarjalec - to omogoca, da vec ljudi soureja isto checklisto.
create policy "group update any" on public.group_checklists
  for update to authenticated using (true) with check (true);

-- brisati sme samo ustvarjalec
create policy "group delete own" on public.group_checklists
  for delete to authenticated using (auth.uid() = created_by);

-- Ker lahko vsakdo posodablja vrstico, bi brez tega sprozilca vsak urejevalec
-- prepisal "created_by"/"email"/"display_name" nazaj nase - sprozilec poskrbi,
-- da ti trije stolpci po prvem vnosu ostanejo nespremenjeni (pravi ustvarjalec).
create or replace function public.group_checklists_keep_creator()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' then
    new.created_by := old.created_by;
    new.email := old.email;
    new.display_name := old.display_name;
  end if;
  return new;
end;
$$;

create trigger group_checklists_keep_creator
before insert or update on public.group_checklists
for each row execute function public.group_checklists_keep_creator();

-- Zivo posodabljanje (Realtime): brez tega aplikacija spremembe zazna sele
-- ob naslednji osvezitvi/ponovnem odprtju, ne pa takoj pri vseh, ki imajo
-- checklisto trenutno odprto.
alter publication supabase_realtime add table public.group_checklists;
```

> Če zgornji `alter publication` javi napako "already member of publication",
> je to v redu - pomeni, da je Realtime za to tabelo že vklopljen.

Kako deluje:

- **Ustvari skupinsko** (v Orodjih) trenutno aktivno checklisto naredi
  skupinsko - odslej se ob vsaki njeni spremembi (enako kot pri deljenju)
  z zamikom samodejno potisne sveža kopija v `group_checklists`, torej jo
  vsi vidijo živo, ne le kot enkratni posnetek.
- **Skupinske checkliste** (zavihek v meniju Deljeno) izpiše vse take
  checkliste, na desni strani vsake pa prikazno ime (`display_name`) tistega,
  ki jo je ustvaril, če ga ima nastavljenega, sicer e-pošto (del pred "@").
  Klik na ime jo naloži naravnost v urejevalni pogled (ne
  predogled) - doda se med uporabnikove checkliste in jo lahko takoj ureja.
  Ob prvi shrambi po odprtju postane skupinska tudi zanj - njegove spremembe
  se prav tako samodejno potiskajo naprej, ustvarjalec pa (po zaslugi
  sprozilca zgoraj) ostane isti, tudi ce jo ureja vec razlicnih ljudi.
- **Zivo posodabljanje**: dokler ima kdo skupinsko checklisto odprto kot
  aktivno, je narocen na spremembe njene vrstice (Supabase Realtime). Ko
  jo nekdo drug ureja in njegov potisk pride skozi (z istim ~1,5s zamikom
  kot sicer), se sprememba pri vseh, ki jo imajo odprto, prikaze takoj -
  brez osvezitve strani. Osebne kljukice/zlozenost pri tem ostanejo
  nedotaknjene.
- V seznamu checklist (izbirnik zgoraj) ima vsaka skupinska checklista
  modro ikonco ob imenu.
- Osebno stanje odkljukanosti elementov se NE sinhronizira med uporabniki
  (vsak ima svoje kljukice) - v `group_checklists` gre samo "cista" struktura
  (imena kategorij/elementov), enako kot pri "Deli checkliste".
- Zavihek Skupinske checkliste je samo za pregled/odpiranje - novo skupinsko
  checklisto lahko ustvariš izključno prek gumba **Ustvari skupinsko** (Orodja).

## 2d. Nadgradnja: prikazno ime namesto e-pošte (`display_name`)

Če imata tabeli `shared_checklists` in `group_checklists` že narejeni (starejša
različica te datoteke, brez stolpca `display_name`), poženi v **SQL Editor**:

```sql
alter table public.shared_checklists add column if not exists display_name text;
alter table public.group_checklists  add column if not exists display_name text;

-- sprozilec mora zdaj poleg "email" pripeti tudi "display_name"
create or replace function public.group_checklists_keep_creator()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' then
    new.created_by := old.created_by;
    new.email := old.email;
    new.display_name := old.display_name;
  end if;
  return new;
end;
$$;
```

Prikazno ime uporabnika (`raw_user_meta_data.display_name` v `auth.users`) se
samodejno vpiše v ta dva stolpca ob naslednjem potisku (deljenju / spremembi
skupinske checkliste) - ročno ga ni treba prepisovati. Za obstoječe
uporabnike, ki jim ga želiš nastaviti ročno (npr. ker se niso sami
registrirali s tem poljem), v **SQL Editor**:

```sql
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('display_name', 'Ime Priimek')
where email = 'nekdo@example.com';
```

## 3. Vklopi prijavo z e-pošto in geslom

Supabase → **Authentication → Providers → Email**:

- **Enable Email provider**: vključeno.
- **Confirm email**: **IZKLOPI**. S tem `signUp()` takoj vrne sejo in je uporabnik
  takoj prijavljen (brez potrditvene e-pošte).

> Če pustiš potrditev vključeno, aplikacija to zna — po registraciji pokaže
> sporočilo "preveri e-pošto", a uporabnik se ne more prijaviti, dokler ne klikne
> povezave v e-pošti (Supabase privzeti SMTP je omejen na nekaj sporočil/uro).

## 4. (Priporočeno) Zaščita pred zlorabo

Supabase → **Authentication → Attack Protection** → vklopi CAPTCHA ali pusti
privzete rate-limite. Anon ključ je javen, zato lahko kdorkoli kliče `signup`.

## 5. Prekopiraj ključe v `config.js`

Supabase → **Project Settings → API**:

| Polje | Kam |
|---|---|
| **Project URL** (`https://<ref>.supabase.co`) | `config.js` → `url` |
| **anon public** ključ (dolg JWT) | `config.js` → `anonKey` |

`config.js`:

```js
window.SUPABASE_CONFIG = {
  url:     "https://xxxxxxxxxxxx.supabase.co",
  anonKey: "eyJhbGciOi..."
};
```

Anon ključ je **varno objaviti** (tudi v javnem repozitoriju) — zaščiten je z RLS
pravili. **Nikoli** ne uporabi `service_role` ključa v `config.js`.

## 6. Objava

Pri naslednji objavi na GitHub Pages se zaradi dviga verzij (`CACHE_VERSION v9`,
`script.js?v=16`, `style.css?v=21`) service worker sam posodobi in stran se enkrat
osveži.

---

## Kako deluje

- **Prijava je obvezna.** Brez seje se pokaže zaslon za prijavo, aplikacija je skrita.
- **Nov račun** dobi svojo kopijo 7 privzetih checklist (shranjeno v njegovo vrstico
  v `user_checklists`). Obstoječi lokalni podatki (`checkliste.v1`) se ne prenesejo.
- **Vsak uporabnik** ima ločene checkliste (ena `jsonb` vrstica na uporabnika) +
  lokalno kopijo `checkliste.v1.<userId>` za delo brez povezave.
- **Sinhronizacija:** ob vsaki spremembi se z zamikom (~1,5 s) potisne v oblak;
  ob prijavi / vrnitvi v zavihek / vrnitvi povezave se po potrebi potegne novejše
  stanje. Konflikt = **zadnji zapis zmaga** (cel objekt naenkrat) — pri urejanju
  na dveh napravah hkrati lahko pride do izgube sprememb.
- **Ikona uporabnika** (desno zgoraj) odpre meni: e-naslov, stanje sinhronizacije,
  "Sinhroniziraj zdaj", "Odjava". Pika na ikoni: cyan = sinhroniziram,
  rdeča obroba = brez povezave.
- **Brez povezave:** ko si enkrat prijavljen, aplikacija deluje offline (seja in
  podatki so v lokalni shrambi). **Prva prijava** pa potrebuje internet.

## Testni scenariji

1. Registracija v anonimnem oknu → aplikacija pokaže 7 checklist; v SupabE se
   pojavi ena vrstica.
2. Osveži stran → ostaneš prijavljen, `updated_at` se ne spremeni.
3. Odkljukaj element → pika na ikoni pomežikne, `data` v bazi se posodobi.
4. DevTools → Network → Offline → urejaj → deluje; nazaj Online → potisne.
5. Odjava → prijava z drugim računom → svojih 7 svežih checklist (ločeno).
6. Napačno geslo → sporočilo o napaki, ostaneš na zaslonu za prijavo.

## Neobvezno pozneje

- **Ponastavitev gesla:** `sb.auth.resetPasswordForEmail(...)` + obravnava
  `type=recovery` v URL-ju. Potrebuje delujočo e-pošto (Supabase SMTP ali lasten).
- **"Izbriši moje podatke":** dodaj `delete` RLS politiko.
- **Sinhronizacija teme** (trenutno je tema shranjena na napravi, ne na računu).
