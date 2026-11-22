/* ShiaSphere - Qaza (missed prayer) tracker */

const Qaza = (() => {
  const KEY = 'shiasphere_qaza_v1';
  const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const LABELS = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

  let state = { remaining: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, completedTotal: 0 };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = { ...state, ...JSON.parse(raw) };
    } catch (e) {}
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function add(prayer, qty) {
    state.remaining[prayer] = (state.remaining[prayer] || 0) + qty;
    save();
  }

  function markOne(prayer) {
    if (state.remaining[prayer] > 0) {
      state.remaining[prayer] -= 1;
      state.completedTotal += 1;
      save();
    }
  }

  function totalRemaining() {
    return PRAYERS.reduce((sum, p) => sum + (state.remaining[p] || 0), 0);
  }

  function resetAll() {
    state.remaining = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    save();
  }

  function getState() { return state; }

  return { load, add, markOne, totalRemaining, resetAll, getState, PRAYERS, LABELS };
})();

Qaza.load();

function renderQazaUI() {
  const st = Qaza.getState();
  const list = document.getElementById('qaza-list');

  function refresh() {
    if (list) {
      list.innerHTML = Qaza.PRAYERS.map((p) => `
        <div class="card">
          <div class="card-row">
            <div>
              <div class="list-item__title">${Qaza.LABELS[p]}</div>
              <div class="list-item__meta">Remaining: ${st.remaining[p] || 0}</div>
            </div>
            <div class="btn-row">
              <button class="btn" data-qaza-dec="${p}">− Mark 1 Done</button>
            </div>
          </div>
        </div>
      `).join('');
    }
    const totalEl = document.getElementById('qaza-total-remaining');
    if (totalEl) totalEl.textContent = Qaza.totalRemaining();
  }

  refresh();

  list?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-qaza-dec]');
    if (btn) {
      Qaza.markOne(btn.dataset.qazaDec);
      refresh();
    }
  });

  document.getElementById('qaza-add-btn')?.addEventListener('click', () => {
    const prayer = document.getElementById('qaza-prayer-select').value;
    const qty = parseInt(document.getElementById('qaza-add-qty').value, 10) || 1;
    Qaza.add(prayer, qty);
    refresh();
  });

  document.getElementById('qaza-reset-all')?.addEventListener('click', () => {
    if (confirm('This will reset ALL your Qaza counts to zero. This cannot be undone. Continue?')) {
      Qaza.resetAll();
      refresh();
    }
  });
}

document.addEventListener('DOMContentLoaded', renderQazaUI);
