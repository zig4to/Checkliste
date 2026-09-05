/* ================================================================
   Nastavitve za Supabase (prijava + sinhronizacija).
   ----------------------------------------------------------------
   Nadomesti spodnji vrednosti s svojimi iz Supabase nadzorne plosce:
     Project Settings -> API -> Project URL  ......  url
     Project Settings -> API -> anon public key ...  anonKey

   Kljuc "anon" je javen in ga je varno objaviti (zascititen je z RLS
   pravili na tabeli). NE uporabi "service_role" kljuca tukaj.

   POZOR: ce to datoteko spremenis PO tem, ko je aplikacija ze objavljena,
   povecaj "?v=1" -> "?v=2" v index.html in sw.js ter CACHE_VERSION v sw.js,
   sicer service worker servira staro (predpomnjeno) razlicico.
   ================================================================ */

window.SUPABASE_CONFIG = {
  url:     "https://abjnxhfxjolwwxlckkje.supabase.co",
  anonKey: "sb_publishable_8Rl8haZMviVCMdJ-byVlGg_ZbaCk7mA"
};
