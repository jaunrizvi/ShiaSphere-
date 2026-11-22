/* ShiaSphere - Global search across Duas, Ziyarat, Quran, Aamaal, Namaz, etc. */

const SearchEngine = (() => {
  function buildIndex() {
    const index = [];
    const quran = Content.get('quran');
    const duas = Content.get('duas');
    const ziyarat = Content.get('ziyarat');
    const aamaal = Content.get('aamaal');
    const munaajaat = Content.get('munaajaat');
    const sahifa = Content.get('sahifa');

    if (quran) {
      quran.surah_list.forEach((s) => {
        index.push({ type: 'Quran', title: `${s.name_en} (${s.name_ar})`, nav: 'quran', meta: s.meaning });
      });
    }
    if (duas) {
      duas.categories.forEach((cat) => {
        index.push({ type: 'Dua Category', title: cat.title, nav: 'duas' });
        (cat.items || []).forEach((item) => index.push({ type: 'Dua', title: item.title, nav: 'duas', status: item.status }));
      });
    }
    if (ziyarat) {
      ziyarat.groups.forEach((g) => {
        index.push({ type: 'Ziyarat Group', title: g.title, nav: 'ziyarat' });
        (g.items || []).forEach((item) => index.push({ type: 'Ziyarat', title: item.title, nav: 'ziyarat', status: item.status }));
      });
    }
    if (aamaal) {
      ['daily', 'weekly', 'monthly', 'special_occasions'].forEach((key) => {
        (aamaal[key] || []).forEach((item) => index.push({ type: 'Aamaal', title: item.title, nav: 'aamaal', status: item.status }));
      });
    }
    if (munaajaat) {
      munaajaat.items.forEach((item) => index.push({ type: 'Munaajaat', title: item.title, nav: 'munaajaat', status: item.status }));
    }
    if (sahifa) {
      sahifa.collections.forEach((item) => index.push({ type: 'Sahifa', title: item.title, nav: 'sahifa', status: item.status }));
    }
    index.push({ type: 'Namaz', title: 'Complete Namaz Guide', nav: 'rakatay' });
    index.push({ type: 'Tool', title: 'Tasbeeh', nav: 'tasbeeh' });
    index.push({ type: 'Tool', title: 'Qibla Compass', nav: 'qibla' });
    index.push({ type: 'Tool', title: 'Prayer Times', nav: 'prayertime' });
    index.push({ type: 'Tool', title: 'Islamic Calendar', nav: 'calendar' });
    index.push({ type: 'Tool', title: 'Qaza Tracker', nav: 'qaza' });

    return index;
  }

  let cachedIndex = null;

  function search(query) {
    if (!cachedIndex) cachedIndex = buildIndex();
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return cachedIndex.filter((entry) =>
      entry.title.toLowerCase().includes(q) ||
      (entry.meta && entry.meta.toLowerCase().includes(q))
    ).slice(0, 40);
  }

  function invalidate() { cachedIndex = null; }

  return { search, invalidate };
})();

function renderSearchResults(query) {
  const results = SearchEngine.search(query);
  const list = document.getElementById('search-results-list');
  if (!list) return;

  if (!results.length) {
    list.innerHTML = `<div class="empty-state">No results for "${query}".</div>`;
  } else {
    list.innerHTML = results.map((r) => `
      <div class="list-item" data-nav="${r.nav}">
        <div>
          <div class="list-item__title">${r.title}</div>
          <div class="list-item__meta">${r.type}</div>
        </div>
        ${r.status === 'pending' ? '<span class="badge-pending">Pending</span>' : ''}
      </div>
    `).join('');
  }
  Navigation.goTo('search-results');
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('global-search');
  let debounceTimer;
  input?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const val = e.target.value;
    debounceTimer = setTimeout(() => {
      if (val.trim().length >= 2) renderSearchResults(val);
    }, 250);
  });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) renderSearchResults(e.target.value);
  });
});
