/* ShiaSphere - Settings & persistence */

const Settings = (() => {
  const STORAGE_KEY = 'shiasphere_settings_v1';

  const defaults = {
    theme: 'golden',
    displayMode: 'both',
    transliteration: false,
    fontSize: 'medium',
    timeFormat: '12',
    notifications: false,
    calcMethod: 'jafari',
    location: null // { lat, lon, label, source: 'gps'|'manual' }
  };

  let state = { ...defaults };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = { ...defaults, ...JSON.parse(raw) };
    } catch (e) { /* ignore corrupt storage */ }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage full / unavailable */ }
  }

  function get(key) { return state[key]; }
  function set(key, value) {
    state[key] = value;
    save();
    applyToDOM();
  }

  function applyToDOM() {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.documentElement.setAttribute('data-display-mode', state.displayMode);
    document.documentElement.setAttribute('data-font-size', state.fontSize);
  }

  function clearAll() {
    localStorage.clear();
    state = { ...defaults };
    applyToDOM();
  }

  return { load, save, get, set, applyToDOM, clearAll, defaults };
})();

Settings.load();
Settings.applyToDOM();
