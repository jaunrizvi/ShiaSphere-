/* ShiaSphere - Bookmarks (local persistence) */

const Bookmarks = (() => {
  const KEY = 'shiasphere_bookmarks_v1';
  let items = [];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      items = raw ? JSON.parse(raw) : [];
    } catch (e) { items = []; }
    return items;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  }

  function isBookmarked(id) {
    return items.some((i) => i.id === id);
  }

  function toggle(entry) {
    const idx = items.findIndex((i) => i.id === entry.id);
    if (idx >= 0) {
      items.splice(idx, 1);
      save();
      return false;
    } else {
      items.push(entry);
      save();
      return true;
    }
  }

  function all() { return items; }

  return { load, isBookmarked, toggle, all };
})();

Bookmarks.load();
