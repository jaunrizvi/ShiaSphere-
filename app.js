/* ShiaSphere - Main app bootstrap: Home dashboard, content rendering for
   Rakatay, Quran, Duas, Ziyarat, Aamaal, Munaajaat, Sahifa, Baqiyaat,
   Settings bindings, and Developer page. */

function renderHome() {
  const now = new Date();
  const hour = now.getHours();
  const greetingEl = document.getElementById('home-greeting');
  if (greetingEl) {
    let greeting = 'Assalamu Alaikum';
    if (hour < 5) greeting = 'Assalamu Alaikum — Late Night';
    else if (hour < 12) greeting = 'Assalamu Alaikum — Good Morning';
    else if (hour < 17) greeting = 'Assalamu Alaikum — Good Afternoon';
    else greeting = 'Assalamu Alaikum — Good Evening';
    greetingEl.textContent = greeting;
  }

  const gregEl = document.getElementById('home-gregorian');
  const hijriEl = document.getElementById('home-hijri');
  if (gregEl) gregEl.textContent = now.toDateString();
  if (hijriEl) {
    const h = HijriCalendar.gregorianToHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
    hijriEl.textContent = HijriCalendar.formatHijri(h);

    const events = getEventsForHijriDate(h.month, h.day);
    const chip = document.getElementById('home-event-chip');
    if (chip) {
      if (events.length) {
        chip.style.display = 'inline-block';
        chip.textContent = events[0].title;
      } else {
        chip.style.display = 'none';
      }
    }
  }

  const duaArabic = document.getElementById('home-daily-dua-arabic');
  const duaUrdu = document.getElementById('home-daily-dua-urdu');
  const duaSource = document.getElementById('home-daily-dua-source');
  if (duaArabic) {
    duaArabic.textContent = 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ';
    duaUrdu.textContent = 'میں اپنے رب اللہ سے بخشش مانگتا ہوں اور اسی کی طرف توبہ کرتا ہوں';
    duaSource.textContent = 'Daily Istighfar — recommended at all times.';
  }
}

function statusChip(status) {
  if (status === 'pending') return '<span class="badge-pending">Pending</span>';
  return '<span class="chip">Verified</span>';
}

function buildEntryFromSimple(id, title, item) {
  return {
    id,
    title,
    status: item.status,
    source: item.source,
    blocks: item.status === 'verified' || item.status === 'pending' && item.arabic ? [{
      arabic: item.arabic,
      urdu: item.urdu,
      transliteration: item.transliteration
    }] : undefined
  };
}

/* ---------------- Rakatay (Namaz) ---------------- */

function renderRakatay() {
  const data = Content.get('namaz');
  const list = document.getElementById('rakatay-list');
  if (!list) return;
  if (!data) {
    list.innerHTML = '<div class="empty-state">Namaz guide content could not be loaded. Serve ShiaSphere over http(s) (e.g. GitHub Pages or a local server) for data files to load.</div>';
    return;
  }

  let html = `<h3 class="section-title">${data.overview.title}</h3><div class="card">`;
  html += data.overview.prayers.map((p) => `
    <div class="list-item">
      <div class="list-item__title">${p.name}</div>
      <div class="list-item__meta">${p.rakats} Rak'ats — ${p.timing}</div>
    </div>
  `).join('');
  html += `<p style="font-size:0.76rem;color:var(--color-text-secondary);margin-top:8px;">${data.overview.notes}</p></div>`;

  html += `<h3 class="section-title">Conditions of Prayer</h3><div class="card"><ul style="margin:0;padding-left:18px;font-size:0.85rem;line-height:1.8;">`;
  html += data.conditions.map((c) => `<li>${c}</li>`).join('');
  html += `</ul></div>`;

  html += `<h3 class="section-title">Complete Prayer Guide — Step by Step</h3>`;
  data.steps.forEach((step, i) => {
    html += `<div class="card" data-rakatay-step="${step.id}">
      <div class="card-row">
        <div class="list-item__title">${i + 1}. ${step.title}</div>
      </div>`;
    if (step.instruction_ur) html += `<div class="reader__urdu" style="font-size:0.95rem;margin-top:8px;">${step.instruction_ur}</div>`;
    if (step.arabic) html += `<div class="reader__arabic" style="margin-top:8px;">${step.arabic}</div>`;
    if (step.urdu && !step.instruction_ur) html += `<div class="reader__urdu">${step.urdu}</div>`;
    if (step.transliteration) html += `<div class="reader__translit">${step.transliteration}</div>`;
    if (step.dhikr) {
      html += `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--color-border);">
        <div class="reader__arabic">${step.dhikr.arabic}</div>
        <div class="reader__urdu">${step.dhikr.urdu}</div>
        <div class="reader__translit">${step.dhikr.transliteration}</div>
        ${step.dhikr.repeat ? `<div style="font-size:0.72rem;color:var(--color-text-secondary);margin-top:4px;">${step.dhikr.repeat}</div>` : ''}
      </div>`;
    }
    if (step.common_recitation) {
      const cr = step.common_recitation;
      html += `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--color-border);">
        <div class="reader__arabic">${cr.arabic}</div>
        <div class="reader__urdu">${cr.urdu}</div>
        <div class="reader__translit">${cr.transliteration}</div>
        <div style="font-size:0.72rem;color:var(--color-text-secondary);margin-top:4px;">${cr.source}</div>
      </div>`;
    }
    if (step.tasbihat_arbaa) {
      const ta = step.tasbihat_arbaa;
      html += `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--color-border);">
        <div class="reader__arabic">${ta.arabic}</div>
        <div class="reader__urdu">${ta.urdu}</div>
        <div class="reader__translit">${ta.transliteration}</div>
        <div style="font-size:0.72rem;color:var(--color-text-secondary);margin-top:4px;">${ta.note}</div>
      </div>`;
    }
    if (step.note) html += `<p style="font-size:0.74rem;color:var(--color-text-secondary);margin-top:8px;">${step.note}</p>`;
    if (step.ref === 'quran:1') {
      html += `<button class="btn" style="margin-top:8px;" data-open-surah="1">Open Surah Al-Fatiha →</button>`;
    }
    html += `</div>`;
  });

  html += `<h3 class="section-title">Wudu &amp; Tayammum</h3>`;
  html += `<div class="card"><strong>${data.wudu_summary.title}</strong><ul style="margin:8px 0 0;padding-left:18px;font-size:0.9rem;line-height:1.9;">`;
  html += data.wudu_summary.steps_ur.map((s) => `<li>${s}</li>`).join('');
  html += `</ul><p style="font-size:0.74rem;color:var(--color-text-secondary);margin-top:8px;">${data.wudu_summary.note}</p></div>`;
  html += `<div class="card"><strong>${data.tayammum_summary.title}</strong><p style="font-size:0.85rem;margin-top:8px;">${data.tayammum_summary.note}</p></div>`;

  list.innerHTML = html;

  list.querySelectorAll('[data-open-surah]').forEach((btn) => {
    btn.addEventListener('click', () => openSurah(btn.dataset.openSurah));
  });
}

/* ---------------- Quran ---------------- */

function renderQuranList(filter = '') {
  const data = Content.get('quran');
  const list = document.getElementById('quran-surah-list');
  if (!list) return;
  if (!data) {
    list.innerHTML = '<div class="empty-state">Quran data could not be loaded. Serve ShiaSphere over http(s) for data files to load.</div>';
    return;
  }
  const f = filter.trim().toLowerCase();
  const surahs = data.surah_list.filter((s) =>
    !f || s.name_en.toLowerCase().includes(f) || String(s.n) === f || s.name_ar.includes(f)
  );

  list.innerHTML = `<div class="card" style="padding:4px 14px;">` + surahs.map((s) => `
    <div class="list-item" data-open-surah="${s.n}">
      <div>
        <div class="list-item__title">${s.n}. ${s.name_en} <span class="rtl" style="font-family:var(--font-arabic);">${s.name_ar}</span></div>
        <div class="list-item__meta">${s.meaning} • ${s.ayahs} Ayahs</div>
      </div>
      ${s.available ? '<span class="chip">Available</span>' : '<span class="badge-pending">Pending</span>'}
    </div>
  `).join('') + `</div>`;

  list.querySelectorAll('[data-open-surah]').forEach((el) => {
    el.addEventListener('click', () => openSurah(el.dataset.openSurah));
  });
}

function openSurah(n) {
  const data = Content.get('quran');
  if (!data) return;
  const meta = data.surah_list.find((s) => String(s.n) === String(n));
  const text = data.texts[String(n)];

  if (!meta.available || !text) {
    Reader.open({ id: `surah-${n}`, title: `${meta.name_en} (${meta.name_ar})`, status: 'pending', meta: `${meta.ayahs} Ayahs` });
    return;
  }

  Reader.open({
    id: `surah-${n}`,
    title: `${meta.name_en} (${meta.name_ar})`,
    meta: `Surah ${n} • ${meta.ayahs} Ayahs • ${meta.meaning}`,
    status: 'verified',
    source: 'Standard Uthmani Quran text',
    blocks: text.ayahs.map((a) => ({
      arabic: `${a.ar} ﴿${a.n}﴾`,
      urdu: a.ur
    }))
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('quran-surah-search')?.addEventListener('input', (e) => renderQuranList(e.target.value));
});

/* ---------------- Generic group renderer (Duas / Ziyarat / Aamaal / Munaajaat / Sahifa / Baqiyaat) ---------------- */

function renderSimpleItemList(containerId, items, prefix) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = (items || []).map((item) => `
    <div class="list-item" data-open-item="${prefix}:${item.id}">
      <div class="list-item__title">${item.title}</div>
      ${statusChip(item.status)}
    </div>
  `).join('');
}

function renderDuas() {
  const data = Content.get('duas');
  const container = document.getElementById('duas-groups');
  if (!container) return;
  if (!data) { container.innerHTML = '<div class="empty-state">Duas content could not be loaded.</div>'; return; }

  let html = '';
  data.categories.forEach((cat) => {
    html += `<h3 class="section-title">${cat.title}</h3><div class="card" style="padding:4px 14px;">`;
    html += cat.items.map((item) => `
      <div class="list-item" data-open-item="dua:${cat.id}:${item.id}">
        <div class="list-item__title">${item.title}</div>
        ${statusChip(item.status)}
      </div>
    `).join('');
    html += `</div>`;
  });
  html += `<h3 class="section-title">Weekly Supplications</h3><div class="card" style="padding:4px 14px;">`;
  html += data.weekly.map((item) => `
    <div class="list-item" data-open-item="dua-weekly:${item.id}">
      <div class="list-item__title">${item.title}</div>
      ${statusChip(item.status)}
    </div>
  `).join('');
  html += `</div>`;
  container.innerHTML = html;

  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-open-item]');
    if (!el) return;
    const parts = el.dataset.openItem.split(':');
    if (parts[0] === 'dua') {
      const cat = data.categories.find((c) => c.id === parts[1]);
      const item = cat.items.find((i) => i.id === parts[2]);
      openGenericEntry(item, cat.title);
    } else if (parts[0] === 'dua-weekly') {
      const item = data.weekly.find((i) => i.id === parts[1]);
      openGenericEntry(item, 'Weekly Dua');
    }
  });
}

function renderZiyarat() {
  const data = Content.get('ziyarat');
  const container = document.getElementById('ziyarat-groups');
  if (!container) return;
  if (!data) { container.innerHTML = '<div class="empty-state">Ziyarat content could not be loaded.</div>'; return; }

  let html = '';
  data.groups.forEach((g) => {
    html += `<h3 class="section-title">${g.title}</h3><div class="card" style="padding:4px 14px;">`;
    html += g.items.map((item) => `
      <div class="list-item" data-open-item="ziyarat:${g.id}:${item.id}">
        <div class="list-item__title">${item.title}</div>
        ${statusChip(item.status)}
      </div>
    `).join('');
    html += `</div>`;
  });
  container.innerHTML = html;
  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-open-item]');
    if (!el) return;
    const [, gid, iid] = el.dataset.openItem.split(':');
    const g = data.groups.find((x) => x.id === gid);
    const item = g.items.find((x) => x.id === iid);
    openGenericEntry(item, g.title);
  });
}

function renderAamaal() {
  const data = Content.get('aamaal');
  const container = document.getElementById('aamaal-groups');
  if (!container) return;
  if (!data) { container.innerHTML = '<div class="empty-state">Aamaal content could not be loaded.</div>'; return; }

  const sections = [
    ['Daily Aamaal', data.daily], ['Weekly Aamaal', data.weekly],
    ['Monthly Aamaal', data.monthly], ['Special Occasions', data.special_occasions]
  ];
  let html = '';
  sections.forEach(([title, items]) => {
    html += `<h3 class="section-title">${title}</h3><div class="card" style="padding:4px 14px;">`;
    html += items.map((item) => `
      <div class="list-item" data-open-item="aamaal:${item.id}">
        <div class="list-item__title">${item.title}</div>
        ${statusChip(item.status)}
      </div>
    `).join('');
    html += `</div>`;
  });
  container.innerHTML = html;

  const allItems = [...data.daily, ...data.weekly, ...data.monthly, ...data.special_occasions];
  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-open-item]');
    if (!el) return;
    const id = el.dataset.openItem.split(':')[1];
    const item = allItems.find((x) => x.id === id);
    openGenericEntry(item, 'Aamaal', item.note ? [{ note: item.note }] : null);
  });
}

function renderMunaajaat() {
  const data = Content.get('munaajaat');
  renderSimpleItemList('munaajaat-list', data?.items, 'munaajaat');
  document.getElementById('munaajaat-list')?.addEventListener('click', (e) => {
    const el = e.target.closest('[data-open-item]');
    if (!el) return;
    const id = el.dataset.openItem.split(':')[1];
    const item = data.items.find((x) => x.id === id);
    openGenericEntry(item, 'Munaajaat');
  });
}

function renderSahifa() {
  const data = Content.get('sahifa');
  const container = document.getElementById('sahifa-groups');
  if (!container) return;
  if (!data) { container.innerHTML = '<div class="empty-state">Sahifa content could not be loaded.</div>'; return; }
  container.innerHTML = `<div class="card" style="padding:4px 14px;">` + data.collections.map((c) => `
    <div class="list-item" data-open-item="sahifa:${c.id}">
      <div>
        <div class="list-item__title">${c.title}</div>
        <div class="list-item__meta">${c.subtitle}</div>
      </div>
      ${statusChip(c.status)}
    </div>
  `).join('') + `</div>`;
  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-open-item]');
    if (!el) return;
    const id = el.dataset.openItem.split(':')[1];
    const item = data.collections.find((x) => x.id === id);
    openGenericEntry(item, 'Sahifa');
  });
}

function renderBaqiyaat() {
  const data = Content.get('baqiyaat');
  const container = document.getElementById('baqiyaat-list');
  if (!container) return;
  if (!data) { container.innerHTML = '<div class="empty-state">Content could not be loaded.</div>'; return; }
  container.innerHTML = `<div class="card" style="padding:4px 14px;">` + data.items.map((item) => `
    <div class="list-item" data-open-item="baqiyaat:${item.id}">
      <div class="list-item__title">${item.title}</div>
      ${statusChip(item.status)}
    </div>
  `).join('') + `</div>`;
  container.addEventListener('click', (e) => {
    const el = e.target.closest('[data-open-item]');
    if (!el) return;
    const id = el.dataset.openItem.split(':')[1];
    const item = data.items.find((x) => x.id === id);
    openGenericEntry(item, 'Baqiyaat us-Saalehaat');
  });
}

function openGenericEntry(item, categoryTitle) {
  if (!item) return;
  if (item.status !== 'verified' || (!item.arabic && !item.note)) {
    Reader.open({ id: item.id, title: item.title, meta: categoryTitle, status: 'pending' });
    return;
  }
  const blocks = [];
  if (item.arabic) blocks.push({ arabic: item.arabic, urdu: item.urdu, transliteration: item.transliteration });
  if (item.arabic_sample) blocks.push({ arabic: item.arabic_sample, urdu: item.urdu });
  if (item.note && !item.arabic) blocks.push({ urdu: item.note });

  Reader.open({
    id: item.id,
    title: item.title,
    meta: categoryTitle,
    status: 'verified',
    source: item.source,
    blocks
  });
}

/* ---------------- Settings page bindings ---------------- */

function initSettingsPage() {
  const st = {
    theme: Settings.get('theme'),
    displayMode: Settings.get('displayMode'),
    translit: Settings.get('transliteration'),
    fontSize: Settings.get('fontSize'),
    timeFormat: Settings.get('timeFormat'),
    notif: Settings.get('notifications')
  };

  function refreshSwatches() {
    document.querySelectorAll('.theme-swatch').forEach((el) => {
      el.classList.toggle('is-selected', el.dataset.themeChoice === Settings.get('theme'));
    });
  }
  refreshSwatches();

  document.querySelectorAll('.theme-swatch').forEach((el) => {
    el.addEventListener('click', () => {
      Settings.set('theme', el.dataset.themeChoice);
      refreshSwatches();
    });
  });

  const displayModeSel = document.getElementById('settings-display-mode');
  if (displayModeSel) {
    displayModeSel.value = Settings.get('displayMode');
    displayModeSel.addEventListener('change', (e) => Settings.set('displayMode', e.target.value));
  }

  const translitToggle = document.getElementById('settings-translit-toggle');
  if (translitToggle) {
    translitToggle.checked = !!Settings.get('transliteration');
    translitToggle.addEventListener('change', (e) => Settings.set('transliteration', e.target.checked));
  }

  const fontSizeSel = document.getElementById('settings-font-size');
  if (fontSizeSel) {
    fontSizeSel.value = Settings.get('fontSize');
    fontSizeSel.addEventListener('change', (e) => Settings.set('fontSize', e.target.value));
  }

  const timeFormatSel = document.getElementById('settings-time-format');
  if (timeFormatSel) {
    timeFormatSel.value = Settings.get('timeFormat');
    timeFormatSel.addEventListener('change', (e) => {
      Settings.set('timeFormat', e.target.value);
      document.getElementById('prayertime-format').value = e.target.value;
      PrayerTimeUI.render();
    });
  }
  document.getElementById('prayertime-format')?.addEventListener('change', (e) => {
    Settings.set('timeFormat', e.target.value);
    timeFormatSel.value = e.target.value;
    PrayerTimeUI.render();
  });

  const notifToggle = document.getElementById('settings-notif-toggle');
  if (notifToggle) {
    notifToggle.checked = !!Settings.get('notifications');
    notifToggle.addEventListener('change', async (e) => {
      if (e.target.checked && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') { e.target.checked = false; showToast('Notification permission denied'); return; }
      }
      Settings.set('notifications', e.target.checked);
    });
  }

  document.getElementById('settings-clear-data')?.addEventListener('click', () => {
    if (confirm('This will erase all saved settings, Tasbeeh counts, Qaza tracker data and bookmarks on this device. Continue?')) {
      Settings.clearAll();
      location.reload();
    }
  });
}

/* ---------------- Developer page ---------------- */

function initDeveloperPage() {
  // Placeholder avatar (an emoji icon) is used until the developer supplies
  // their own photo file — ShiaSphere never substitutes another person's face.
  const photo = document.getElementById('developer-photo');
  if (photo) {
    photo.title = 'Place assets/images/developer-photo.png to show the developer photo here.';
  }
}

/* ---------------- Boot ---------------- */

async function bootApp() {
  await Content.loadAll();
  renderHome();
  renderRakatay();
  renderQuranList();
  renderDuas();
  renderZiyarat();
  renderAamaal();
  renderMunaajaat();
  renderSahifa();
  renderBaqiyaat();
  initSettingsPage();
  initDeveloperPage();

  setInterval(renderHome, 60 * 1000);

  // Register service worker for offline/PWA support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // Fails silently if served from file:// or without HTTPS - that's fine for dev.
    });
  }
}

document.addEventListener('DOMContentLoaded', bootApp);
