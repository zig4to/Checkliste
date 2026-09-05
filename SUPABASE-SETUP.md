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
