/* ShiaSphere - Navigation between pages */

const Navigation = (() => {
  let currentPage = 'home';
  const history = [];

  function goTo(pageId, opts = {}) {
    const allPages = document.querySelectorAll('.page');
    allPages.forEach((p) => p.classList.remove('is-active'));
    const target = document.getElementById(`page-${pageId}`);
    if (!target) return;
    target.classList.add('is-active');

    if (!opts.isBack) history.push(currentPage);
    currentPage = pageId;

    // Update bottom nav highlighting (only for nav-bar pages)
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.nav === pageId);
    });

    window.scrollTo(0, 0);

    document.dispatchEvent(new CustomEvent('ss:pagechange', { detail: { pageId } }));
  }

  function back() {
    const prev = history.pop();
    if (prev) goTo(prev, { isBack: true });
    else goTo('home');
  }

  function current() { return currentPage; }

  function init() {
    document.body.addEventListener('click', (e) => {
      const navEl = e.target.closest('[data-nav]');
      if (navEl) {
        goTo(navEl.dataset.nav);
      }
    });

    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) settingsBtn.addEventListener('click', () => goTo('settings'));

    const readerBack = document.getElementById('reader-back-btn');
    if (readerBack) readerBack.addEventListener('click', () => back());
  }

  return { goTo, back, current, init };
})();

document.addEventListener('DOMContentLoaded', Navigation.init);
