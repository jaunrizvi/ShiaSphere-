/* ShiaSphere - Digital Tasbeeh tool */

const Tasbeeh = (() => {
  const KEY = 'shiasphere_tasbeeh_v1';

  const DEFAULT_PRESETS = [
    { id: 'subhanallah', ar: 'سُبْحَانَ اللّٰه', label: 'SubhanAllah' },
    { id: 'alhamdulillah', ar: 'اَلْحَمْدُ لِلّٰه', label: 'Alhamdulillah' },
    { id: 'allahuakbar', ar: 'اَللّٰهُ أَكْبَر', label: 'Allahu Akbar' },
    { id: 'salawat', ar: 'اَللّٰهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّد', label: 'Salawat' },
    { id: 'astaghfirullah', ar: 'أَسْتَغْفِرُ اللّٰه', label: 'Astaghfirullah' }
  ];

  let state = {
    presets: DEFAULT_PRESETS,
    activePresetId: 'subhanallah',
    customZikrs: [],
    count: 0,
    target: 33,
    history: [], // for undo
    sessions: [],
    haptic: true,
    sound: false
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = { ...state, ...parsed, presets: DEFAULT_PRESETS.concat(parsed.customZikrs || []) };
      }
    } catch (e) {}
  }

  function save() {
    try {
      const { presets, ...rest } = state;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch (e) {}
  }

  function allPresets() {
    return DEFAULT_PRESETS.concat(state.customZikrs);
  }

  function activePreset() {
    return allPresets().find((p) => p.id === state.activePresetId) || DEFAULT_PRESETS[0];
  }

  function setActivePreset(id) {
    state.activePresetId = id;
    save();
  }

  function addCustom(label, ar) {
    const id = 'custom-' + Date.now();
    state.customZikrs.push({ id, ar, label });
    save();
    return id;
  }

  function increment() {
    state.history.push(state.count);
    state.count += 1;
    save();
    maybeFeedback();
    return state.count;
  }

  function undo() {
    if (state.history.length) {
      state.count = state.history.pop();
      save();
    }
    return state.count;
  }

  function reset(saveSession = true) {
    if (saveSession && state.count > 0) {
      state.sessions.unshift({
        zikr: activePreset().label,
        count: state.count,
        target: state.target,
        date: new Date().toISOString()
      });
      state.sessions = state.sessions.slice(0, 50);
    }
    state.count = 0;
    state.history = [];
    save();
  }

  function setTarget(t) {
    state.target = Math.max(1, parseInt(t, 10) || 33);
    save();
  }

  function setHaptic(v) { state.haptic = v; save(); }
  function setSound(v) { state.sound = v; save(); }

  function maybeFeedback() {
    if (state.haptic && navigator.vibrate) {
      navigator.vibrate(15);
    }
    if (state.sound) {
      try {
        const ctx = window.__ssAudioCtx || (window.__ssAudioCtx = new (window.AudioContext || window.webkitAudioContext)());
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 600;
        gain.gain.value = 0.04;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    }
    if (state.count === state.target) {
      if (navigator.vibrate) navigator.vibrate([20, 60, 20]);
    }
  }

  function getState() { return state; }

  return {
    load, save, allPresets, activePreset, setActivePreset, addCustom,
    increment, undo, reset, setTarget, setHaptic, setSound, getState
  };
})();

Tasbeeh.load();

function renderTasbeehUI() {
  const st = Tasbeeh.getState();

  // Preset dropdown
  const presetSel = document.getElementById('tasbeeh-preset');
  if (presetSel) {
    presetSel.innerHTML = Tasbeeh.allPresets().map((p) =>
      `<option value="${p.id}" ${p.id === st.activePresetId ? 'selected' : ''}>${p.label}</option>`
    ).join('');
  }

  const zikrDisplay = document.getElementById('tasbeeh-zikr-display');
  const countDisplay = document.getElementById('tasbeeh-count-display');
  const progressFill = document.getElementById('tasbeeh-progress-fill');
  const targetLabel = document.getElementById('tasbeeh-target-label');

  function refreshCounter() {
    const active = Tasbeeh.activePreset();
    if (zikrDisplay) zikrDisplay.textContent = active.ar;
    if (countDisplay) countDisplay.textContent = st.count;
    if (targetLabel) targetLabel.textContent = `Target: ${st.target}`;
    if (progressFill) {
      const pct = Math.min(100, (st.count / st.target) * 100);
      progressFill.style.width = pct + '%';
    }
    renderSessions();

    // Keep Home mini-counter in sync
    const homeCount = document.getElementById('home-tasbeeh-count');
    const homeZikr = document.getElementById('home-tasbeeh-zikr');
    if (homeCount) homeCount.textContent = st.count;
    if (homeZikr) homeZikr.textContent = active.ar;
  }

  function renderSessions() {
    const list = document.getElementById('tasbeeh-sessions-list');
    if (!list) return;
    if (!st.sessions.length) {
      list.innerHTML = '<div class="empty-state">No saved sessions yet.</div>';
      return;
    }
    list.innerHTML = st.sessions.slice(0, 10).map((s) => `
      <div class="list-item">
        <div>
          <div class="list-item__title">${s.zikr}</div>
          <div class="list-item__meta">${new Date(s.date).toLocaleString()}</div>
        </div>
        <div class="chip">${s.count}/${s.target}</div>
      </div>
    `).join('');
  }

  refreshCounter();

  presetSel?.addEventListener('change', (e) => {
    Tasbeeh.setActivePreset(e.target.value);
    refreshCounter();
  });

  document.getElementById('tasbeeh-add-custom')?.addEventListener('click', () => {
    const label = prompt('Name for your custom Zikr (e.g. "Ya Ali Madad"):');
    if (!label) return;
    const ar = prompt('Arabic text for this Zikr (optional):') || label;
    const id = Tasbeeh.addCustom(label, ar);
    Tasbeeh.setActivePreset(id);
    renderTasbeehUI();
  });

  const tapZone = document.getElementById('tasbeeh-tap-zone');
  tapZone?.addEventListener('click', () => {
    Tasbeeh.increment();
    refreshCounter();
  });

  document.getElementById('tasbeeh-undo')?.addEventListener('click', () => {
    Tasbeeh.undo();
    refreshCounter();
  });

  document.getElementById('tasbeeh-reset')?.addEventListener('click', () => {
    Tasbeeh.reset(true);
    refreshCounter();
  });

  document.getElementById('tasbeeh-target-input')?.addEventListener('change', (e) => {
    Tasbeeh.setTarget(e.target.value);
    refreshCounter();
  });

  document.getElementById('tasbeeh-haptic-toggle').checked = st.haptic;
  document.getElementById('tasbeeh-haptic-toggle')?.addEventListener('change', (e) => Tasbeeh.setHaptic(e.target.checked));
  document.getElementById('tasbeeh-sound-toggle').checked = st.sound;
  document.getElementById('tasbeeh-sound-toggle')?.addEventListener('change', (e) => Tasbeeh.setSound(e.target.checked));

  document.getElementById('home-tasbeeh-tap')?.addEventListener('click', () => {
    Tasbeeh.increment();
    refreshCounter();
  });
}

document.addEventListener('DOMContentLoaded', renderTasbeehUI);
