/* ShiaSphere - Islamic (Hijri) calendar UI */

const IslamicCalendarUI = (() => {
  let viewYear, viewMonth; // Hijri year/month currently displayed

  function init() {
    const today = new Date();
    const h = HijriCalendar.gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
    viewYear = h.year;
    viewMonth = h.month;

    document.getElementById('calendar-prev-month')?.addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 1) { viewMonth = 12; viewYear -= 1; }
      render();
    });
    document.getElementById('calendar-next-month')?.addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 12) { viewMonth = 1; viewYear += 1; }
      render();
    });

    const dowRow = document.getElementById('calendar-dow-row');
    if (dowRow) {
      dowRow.innerHTML = ['S','M','T','W','T','F','S'].map((d) => `<div class="dow">${d}</div>`).join('');
    }

    render();
  }

  function render() {
    const label = document.getElementById('calendar-month-label');
    if (label) label.textContent = `${HijriCalendar.HIJRI_MONTHS[viewMonth - 1]} ${viewYear} AH`;

    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const daysInMonth = HijriCalendar.daysInHijriMonth(viewYear, viewMonth);
    const firstGregorian = HijriCalendar.hijriToGregorian(viewYear, viewMonth, 1);
    const firstDate = new Date(firstGregorian.year, firstGregorian.month - 1, firstGregorian.day);
    const firstDow = firstDate.getDay(); // 0 = Sunday

    const today = new Date();
    const todayHijri = HijriCalendar.gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());

    let cells = '';
    for (let i = 0; i < firstDow; i++) {
      cells += `<div class="calendar-cell is-empty"></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const greg = HijriCalendar.hijriToGregorian(viewYear, viewMonth, d);
      const events = getEventsForHijriDate(viewMonth, d);
      const isToday = (viewYear === todayHijri.year && viewMonth === todayHijri.month && d === todayHijri.day);
      cells += `
        <div class="calendar-cell ${isToday ? 'is-today' : ''} ${events.length ? 'has-event' : ''}" data-hijri-day="${d}">
          <span>${greg.day}</span>
          <span class="hijri-num">${d}</span>
        </div>
      `;
    }
    grid.innerHTML = cells;

    grid.querySelectorAll('[data-hijri-day]').forEach((cell) => {
      cell.addEventListener('click', () => showDayDetail(parseInt(cell.dataset.hijriDay, 10)));
    });
  }

  function showDayDetail(day) {
    const detail = document.getElementById('calendar-event-detail');
    if (!detail) return;
    const events = getEventsForHijriDate(viewMonth, day);
    const greg = HijriCalendar.hijriToGregorian(viewYear, viewMonth, day);
    const gregDate = new Date(greg.year, greg.month - 1, greg.day);

    if (!events.length) {
      detail.innerHTML = `
        <div class="card">
          <strong>${day} ${HijriCalendar.HIJRI_MONTHS[viewMonth - 1]} ${viewYear} AH</strong>
          <div style="font-size:0.78rem;color:var(--color-text-secondary);">${gregDate.toDateString()}</div>
          <p style="font-size:0.82rem;margin-top:8px;">No specially marked Islamic event on this date.</p>
        </div>
      `;
      return;
    }

    detail.innerHTML = `
      <div class="card">
        <strong>${day} ${HijriCalendar.HIJRI_MONTHS[viewMonth - 1]} ${viewYear} AH</strong>
        <div style="font-size:0.78rem;color:var(--color-text-secondary);margin-bottom:8px;">${gregDate.toDateString()}</div>
        ${events.map((e) => `
          <div style="padding:8px 0;border-top:1px dashed var(--color-border);">
            <span class="chip" style="background:${e.type === 'mourning' ? 'rgba(179,38,30,0.12)' : e.type === 'celebration' ? 'rgba(46,125,50,0.12)' : 'rgba(28,124,119,0.12)'};color:${e.type === 'mourning' ? 'var(--color-danger)' : e.type === 'celebration' ? 'var(--color-success)' : 'var(--color-accent)'};">${e.type}</span>
            <p style="margin:6px 0 0;font-size:0.88rem;">${e.title}</p>
          </div>
        `).join('')}
        <p style="font-size:0.7rem;color:var(--color-text-secondary);margin-top:10px;">Exact dates for moon-sighting-dependent events (Ramadan start, Eid, etc.) can shift by a day depending on your region and Marja. Where a date is commonly cited with variation among sources, this is noted above.</p>
      </div>
    `;
  }

  return { init, render };
})();

document.addEventListener('DOMContentLoaded', IslamicCalendarUI.init);
