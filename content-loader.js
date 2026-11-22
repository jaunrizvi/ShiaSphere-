/* ShiaSphere - Content loader
   Fetches the JSON content files from /data and exposes them synchronously
   once loaded. Falls back gracefully (empty structures) if a fetch fails,
   e.g. when opened directly via file:// without a local server. */

const Content = (() => {
  const store = {
    namaz: null,
    quran: null,
    duas: null,
    ziyarat: null,
    aamaal: null,
    baqiyaat: null,
    munaajaat: null,
    sahifa: null
  };

  const FILES = {
    namaz: 'data/namaz/guide.json',
    quran: 'data/quran/surahs.json',
    duas: 'data/duas/duas.json',
    ziyarat: 'data/ziyarat/ziyarat.json',
    aamaal: 'data/aamaal/aamaal.json',
    baqiyaat: 'data/aamaal/baqiyaat.json',
    munaajaat: 'data/munaajaat/munaajaat.json',
    sahifa: 'data/sahifa/sahifa.json'
  };

  async function loadAll() {
    const entries = Object.entries(FILES);
    await Promise.all(entries.map(async ([key, path]) => {
      try {
        const res = await fetch(path);
        store[key] = await res.json();
      } catch (e) {
        console.warn(`ShiaSphere: could not load ${path} (serve over http/https, e.g. via GitHub Pages or a local server, for data files to load).`, e);
        store[key] = null;
      }
    }));
    return store;
  }

  function get(key) { return store[key]; }

  return { loadAll, get };
})();

const ISLAMIC_EVENTS = [
  // { month, day } in Hijri calendar. month 1 = Muharram.
  { month: 1, day: 1, title: "Islamic New Year", type: "general" },
  { month: 1, day: 9, title: "Tasu'a", type: "mourning" },
  { month: 1, day: 10, title: "Ashura — Martyrdom of Imam Hussain (a.s.)", type: "mourning" },
  { month: 1, day: 25, title: "Martyrdom of Imam Zain-ul-Abideen (a.s.) (commonly commemorated)", type: "mourning" },
  { month: 2, day: 20, title: "Arbaeen", type: "mourning" },
  { month: 2, day: 28, title: "Martyrdom of Prophet Muhammad (s.a.w.) and Imam Hasan (a.s.) (commonly commemorated)", type: "mourning" },
  { month: 2, day: 29, title: "Martyrdom of Imam Ali Ridha (a.s.) (commonly commemorated)", type: "mourning" },
  { month: 3, day: 17, title: "Birth of Prophet Muhammad (s.a.w.) and Imam Jafar Sadiq (a.s.) (Shia dating)", type: "celebration" },
  { month: 5, day: 5, title: "Birth of Bibi Fatima Zahra (s.a.) (per some narrations — dates vary)", type: "celebration" },
  { month: 6, day: 3, title: "Martyrdom of Bibi Fatima Zahra (s.a.) (date disputed among sources)", type: "mourning" },
  { month: 6, day: 20, title: "Birth of Bibi Fatima Zahra (s.a.) (alternate dating)", type: "celebration" },
  { month: 7, day: 13, title: "Birth of Imam Ali (a.s.)", type: "celebration" },
  { month: 7, day: 27, title: "Mab'ath — Prophetic Mission of Prophet Muhammad (s.a.w.)", type: "celebration" },
  { month: 8, day: 3, title: "Birth of Imam Hussain (a.s.)", type: "celebration" },
  { month: 8, day: 4, title: "Birth of Abbas ibn Ali (a.s.)", type: "celebration" },
  { month: 8, day: 5, title: "Birth of Imam Zain-ul-Abideen (a.s.)", type: "celebration" },
  { month: 8, day: 15, title: "Birth of Imam Mahdi (a.j.)", type: "celebration" },
  { month: 9, day: 1, title: "Start of Ramadan (subject to moon sighting)", type: "general" },
  { month: 9, day: 19, title: "Ramadan 19 — possible night of Laylat al-Qadr", type: "worship" },
  { month: 9, day: 21, title: "Martyrdom of Imam Ali (a.s.)", type: "mourning" },
  { month: 9, day: 23, title: "Ramadan 23 — possible night of Laylat al-Qadr", type: "worship" },
  { month: 10, day: 1, title: "Eid al-Fitr (subject to moon sighting)", type: "celebration" },
  { month: 12, day: 9, title: "Day of Arafah", type: "worship" },
  { month: 12, day: 10, title: "Eid al-Adha (subject to moon sighting)", type: "celebration" },
  { month: 12, day: 18, title: "Eid al-Ghadir", type: "celebration" }
];

function getEventsForHijriDate(month, day) {
  return ISLAMIC_EVENTS.filter((e) => e.month === month && e.day === day);
}
