/* ShiaSphere - Generic immersive reader for Duas / Ziyarat / Quran / Namaz texts */

const Reader = (() => {
  let currentEntry = null; // { id, title, meta, blocks: [{arabic, urdu, transliteration}], source }

  function open(entry) {
    currentEntry = entry;
    document.getElementById('reader-title').textContent = entry.title;
    document.getElementById('reader-meta').textContent = entry.meta || '';

    const content = document.getElementById('reader-content');
    if (entry.status === 'pending') {
      content.innerHTML = `
        <div class="card" style="text-align:center;">
          <span class="badge-pending">Verified text pending</span>
          <p style="font-size:0.85rem;margin-top:10px;color:var(--color-text-secondary);">
            This text has not yet been added to ShiaSphere from a verified source. We deliberately do not fill this page
            with invented Arabic or translation. It will be added once sourced and checked against a reliable edition
            (e.g. Mafatih al-Jinan or another cited reference).
          </p>
        </div>
      `;
    } else {
      content.innerHTML = (entry.blocks || []).map((b) => `
        <div class="reader__block">
          ${b.arabic ? `<div class="reader__arabic">${b.arabic}</div>` : ''}
          ${b.urdu ? `<div class="reader__urdu">${b.urdu}</div>` : ''}
          ${b.transliteration ? `<div class="reader__translit">${b.transliteration}</div>` : ''}
        </div>
      `).join('') + (entry.source ? `<div class="reader__meta" style="margin-top:4px;">Source: ${entry.source}</div>` : '');
    }

    updateBookmarkBtn();
    Navigation.goTo('reader');
  }

  function updateBookmarkBtn() {
    const btn = document.getElementById('reader-bookmark-btn');
    if (!btn || !currentEntry) return;
    const bookmarked = Bookmarks.isBookmarked(currentEntry.id);
    btn.textContent = bookmarked ? '★ Bookmarked' : '☆ Bookmark';
  }

  function plainText() {
    if (!currentEntry || !currentEntry.blocks) return currentEntry?.title || '';
    const mode = document.documentElement.getAttribute('data-display-mode') || 'both';
    return currentEntry.blocks.map((b) => {
      const parts = [];
      if (mode !== 'urdu-only' && b.arabic) parts.push(b.arabic);
      if (mode !== 'arabic-only' && b.urdu) parts.push(b.urdu);
      return parts.join('\n');
    }).join('\n\n');
  }

  function init() {
    document.querySelectorAll('[data-reader-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Settings.set('displayMode', btn.dataset.readerMode);
        document.getElementById('settings-display-mode').value = btn.dataset.readerMode;
      });
    });

    document.getElementById('reader-font-smaller')?.addEventListener('click', () => {
      const order = ['small', 'medium', 'large', 'xlarge'];
      const idx = Math.max(0, order.indexOf(Settings.get('fontSize')) - 1);
      Settings.set('fontSize', order[idx]);
    });
    document.getElementById('reader-font-larger')?.addEventListener('click', () => {
      const order = ['small', 'medium', 'large', 'xlarge'];
      const idx = Math.min(order.length - 1, order.indexOf(Settings.get('fontSize')) + 1);
      Settings.set('fontSize', order[idx]);
    });

    document.getElementById('reader-bookmark-btn')?.addEventListener('click', () => {
      if (!currentEntry) return;
      Bookmarks.toggle({ id: currentEntry.id, title: currentEntry.title });
      updateBookmarkBtn();
      showToast(Bookmarks.isBookmarked(currentEntry.id) ? 'Bookmarked' : 'Bookmark removed');
    });

    document.getElementById('reader-copy-btn')?.addEventListener('click', async () => {
      const text = plainText();
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
      } catch (e) {
        showToast('Could not copy (clipboard unavailable)');
      }
    });

    document.getElementById('reader-share-btn')?.addEventListener('click', async () => {
      const text = plainText();
      if (navigator.share) {
        try { await navigator.share({ title: currentEntry?.title, text }); } catch (e) {}
      } else {
        try {
          await navigator.clipboard.writeText(text);
          showToast('Share not supported here — copied instead');
        } catch (e) {
          showToast('Sharing is not supported on this device/browser');
        }
      }
    });
  }

  return { open, init };
})();

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(window.__ssToastTimer);
  window.__ssToastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

document.addEventListener('DOMContentLoaded', Reader.init);
