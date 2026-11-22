/* ShiaSphere - Prayer Time calculation
   Implements real astronomical sun-position calculations (no hardcoded
   or sample times). Supports Shia Ithna Ashari calculation conventions:
   - Fajr angle, Isha angle (twilight-based, not fixed-interval Maghrib)
   - Maghrib requires the sun to be a set angle below the horizon
     (reflecting the Jafari view that sunset alone is not sufficient),
     with Isha similarly angle-based.
   - Midnight = midpoint between Maghrib and Fajr (Jafari convention).
   Two presets are offered, matching commonly cited Shia calculation
   parameter sets. Users should confirm against their own Marja's
   published timetable for critical worship decisions. */

const PrayerTimes = (() => {

  const METHODS = {
    jafari: { fajr: 16, isha: 14, maghrib: 4, name: 'Shia Ithna Ashari (Leva Institute, Qum)' },
    jafari_tehran: { fajr: 17.7, isha: 14, maghrib: 4.5, name: 'Institute of Geophysics, University of Tehran' }
  };

  function degToRad(d) { return d * Math.PI / 180; }
  function radToDeg(r) { return r * 180 / Math.PI; }
  function fixHour(h) { h = h % 24; return h < 0 ? h + 24 : h; }

  // Julian date
  function julianDate(year, month, day) {
    if (month <= 2) { year -= 1; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  }

  // Sun position: returns { declination, equationOfTime } in degrees/hours
  function sunPosition(jd) {
    const D = jd - 2451545.0;
    const g = fixHour(357.529 + 0.98560028 * D) ;
    const q = fixHour(280.459 + 0.98564736 * D);
    const L = fixHour(q + 1.915 * Math.sin(degToRad(g)) + 0.020 * Math.sin(degToRad(2 * g)));

    const e = 23.439 - 0.00000036 * D;
    const RA = radToDeg(Math.atan2(Math.cos(degToRad(e)) * Math.sin(degToRad(L)), Math.cos(degToRad(L)))) / 15;
    const eqt = q / 15 - fixHour(RA);
    const decl = radToDeg(Math.asin(Math.sin(degToRad(e)) * Math.sin(degToRad(L))));

    return { declination: decl, eqt };
  }

  // Compute the time (in hours, local solar time offset) at which the sun
  // reaches a given angle below the horizon (for Fajr/Isha), or standard
  // horizon angle for sunrise/sunset (angle = 0.833 with correction).
  function sunAngleTime(angle, latitude, declination, direction) {
    const lat = degToRad(latitude);
    const decl = degToRad(declination);
    const term = (-Math.sin(degToRad(angle)) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
    if (term < -1 || term > 1) return null; // sun never reaches this angle (polar regions)
    const t = radToDeg(Math.acos(term)) / 15;
    return direction === 'ccw' ? -t : t;
  }

  /**
   * Compute all prayer times for a given date/location.
   * @param {Date} date
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} timezoneOffsetHours - e.g. 5.5 for IST
   * @param {string} methodKey - 'jafari' | 'jafari_tehran'
   * @returns object of HH:mm (24h) strings
   */
  function getTimes(date, latitude, longitude, timezoneOffsetHours, methodKey) {
    const method = METHODS[methodKey] || METHODS.jafari;
    const jd = julianDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

    function computeFor(hourGuess) {
      const jdAdj = jd - longitude / (15 * 24) + hourGuess / 24;
      return sunPosition(jdAdj);
    }

    // Iterative approximation (one pass is sufficient for typical precision needs)
    const sunNoon = sunPosition(jd - longitude / (15 * 24) + 12 / 24);
    const eqt = sunNoon.eqt;
    const decl = sunNoon.declination;

    const dhuhrTime = 12 + timezoneOffsetHours - longitude / 15 - eqt;

    const fajrAngleTime = sunAngleTime(method.fajr, latitude, decl, 'ccw');
    const sunriseTime = sunAngleTime(0.833, latitude, decl, 'ccw');
    const sunsetTime = sunAngleTime(0.833, latitude, decl, 'cw');
    const maghribAngleTime = sunAngleTime(method.maghrib, latitude, decl, 'cw');
    const ishaAngleTime = sunAngleTime(method.isha, latitude, decl, 'cw');

    // Asr (Shafi'i/Jafari single-shadow factor = 1)
    const shadowFactor = 1;
    const asrLat = degToRad(latitude);
    const asrDecl = degToRad(decl);
    const asrAngle = -radToDeg(Math.atan(1 / (shadowFactor + Math.tan(Math.abs(asrLat - asrDecl)))));
    const asrTime = sunAngleTime(asrAngle, latitude, decl, 'cw');

    function toClock(dhuhrOffsetHours) {
      if (dhuhrOffsetHours === null || isNaN(dhuhrOffsetHours)) return null;
      const h = fixHour(dhuhrTime + dhuhrOffsetHours);
      const hh = Math.floor(h);
      const mm = Math.round((h - hh) * 60);
      return { hours: hh, minutes: mm === 60 ? 0 : mm, totalMinutes: hh * 60 + (mm === 60 ? 0 : mm) };
    }

    const fajr = toClock(fajrAngleTime);
    const sunrise = toClock(sunriseTime);
    const dhuhr = toClock(0);
    const asr = toClock(asrTime);
    const sunset = toClock(sunsetTime);
    const maghrib = toClock(maghribAngleTime);
    const isha = toClock(ishaAngleTime);

    // Imsak (Sehri end) ~10 min before Fajr by common convention
    let imsak = null;
    if (fajr) {
      const totalMin = fajr.totalMinutes - 10;
      imsak = { hours: Math.floor(((totalMin % 1440) + 1440) % 1440 / 60), minutes: ((totalMin % 1440) + 1440) % 1440 % 60 };
    }

    // Midnight (Jafari): midpoint between Maghrib and next day's Fajr
    let midnight = null;
    if (maghrib && fajr) {
      let diff = (fajr.totalMinutes + 1440) - maghrib.totalMinutes;
      const midMin = (maghrib.totalMinutes + diff / 2) % 1440;
      midnight = { hours: Math.floor(midMin / 60), minutes: Math.round(midMin % 60) };
    }

    return {
      method: method.name,
      imsak, fajr, sunrise, dhuhr, asr, sunset, maghrib, isha, midnight
    };
  }

  function formatTime(t, is24h) {
    if (!t) return '—';
    let h = t.hours;
    const m = String(t.minutes).padStart(2, '0');
    if (is24h) return `${String(h).padStart(2, '0')}:${m}`;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${period}`;
  }

  return { getTimes, formatTime, METHODS };
})();

/* ---------------- UI binding for the Prayer Time page ---------------- */

const PrayerTimeUI = (() => {
  const KEY = 'shiasphere_prayertime_v1';
  let state = {
    lat: null, lon: null, label: null, tz: null,
    viewDate: new Date(),
    method: 'jafari'
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = { ...state, ...parsed, viewDate: new Date() };
      }
    } catch (e) {}
  }
  function save() {
    try {
      const { viewDate, ...rest } = state;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch (e) {}
  }

  function setLocation(lat, lon, label) {
    state.lat = lat; state.lon = lon; state.label = label;
    state.tz = -new Date().getTimezoneOffset() / 60;
    save();
    render();
  }

  let countdownTimer = null;

  function render() {
    const locLabel = document.getElementById('prayertime-location-label');
    const dateLabel = document.getElementById('prayertime-date-label');
    const list = document.getElementById('prayertime-list');
    const nextName = document.getElementById('prayertime-next-name');
    const nextCountdown = document.getElementById('prayertime-next-countdown');

    if (dateLabel) {
      const h = HijriCalendar.gregorianToHijri(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, state.viewDate.getDate());
      dateLabel.textContent = `${state.viewDate.toDateString()} — ${HijriCalendar.formatHijri(h)}`;
    }

    if (state.lat === null) {
      if (locLabel) locLabel.textContent = 'No location set. Use GPS or enter a city.';
      if (list) list.innerHTML = '<div class="empty-state">Set your location to see accurate prayer times calculated for you.</div>';
      return;
    }

    if (locLabel) locLabel.textContent = `${state.label || 'Current location'} (${state.lat.toFixed(3)}, ${state.lon.toFixed(3)})`;

    const is24h = (Settings.get('timeFormat') || '12') === '24';
    const times = PrayerTimes.getTimes(state.viewDate, state.lat, state.lon, state.tz, state.method);

    const rows = [
      ['Imsak (Sehar)', times.imsak],
      ['Fajr', times.fajr],
      ['Sunrise', times.sunrise],
      ['Dhuhr', times.dhuhr],
      ['Asr', times.asr],
      ['Sunset', times.sunset],
      ['Maghrib', times.maghrib],
      ['Isha', times.isha],
      ['Midnight', times.midnight]
    ];

    if (list) {
      list.innerHTML = rows.map(([label, t]) => `
        <div class="list-item">
          <div class="list-item__title">${label}</div>
          <div class="list-item__meta" style="font-size:0.95rem;font-weight:600;color:var(--color-text-primary);">${PrayerTimes.formatTime(t, is24h)}</div>
        </div>
      `).join('');
    }

    updateCountdown(times, is24h, nextName, nextCountdown);
    updateHomeOverview(times, is24h);

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => updateCountdown(times, is24h, nextName, nextCountdown), 1000);
  }

  function updateHomeOverview(times, is24h) {
    const box = document.getElementById('home-prayer-overview');
    if (!box) return;
    const pairs = [['Fajr', times.fajr], ['Dhuhr', times.dhuhr], ['Asr', times.asr], ['Maghrib', times.maghrib], ['Isha', times.isha], ['Sunrise', times.sunrise]];
    box.innerHTML = pairs.map(([l, t]) => `
      <div style="text-align:center;">
        <div style="font-size:0.65rem;color:var(--color-text-secondary);">${l}</div>
        <div style="font-size:0.78rem;font-weight:700;">${PrayerTimes.formatTime(t, is24h)}</div>
      </div>
    `).join('');
  }

  function updateCountdown(times, is24h, nextNameEl, nextCountdownEl) {
    const order = [['Fajr', times.fajr], ['Sunrise', times.sunrise], ['Dhuhr', times.dhuhr], ['Asr', times.asr], ['Maghrib', times.maghrib], ['Isha', times.isha]];
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    let next = null;
    for (const [label, t] of order) {
      if (!t) continue;
      const totalMin = t.hours * 60 + t.minutes;
      if (totalMin > nowMin) { next = { label, totalMin }; break; }
    }
    if (!next && order[0][1]) next = { label: order[0][0], totalMin: order[0][1].hours * 60 + order[0][1].minutes + 1440 };

    if (nextNameEl) nextNameEl.textContent = next ? next.label : '—';
    const homeNext = document.getElementById('home-next-prayer-name');
    if (homeNext) homeNext.textContent = next ? next.label : '—';

    if (next) {
      const diffMin = next.totalMin - nowMin;
      const h = Math.floor(diffMin / 60);
      const m = Math.floor(diffMin % 60);
      const s = Math.floor((diffMin * 60) % 60);
      const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      if (nextCountdownEl) nextCountdownEl.textContent = str;
      const homeCountdown = document.getElementById('home-next-prayer-countdown');
      if (homeCountdown) homeCountdown.textContent = str;
    }
  }

  function init() {
    load();

    document.getElementById('prayertime-use-gps')?.addEventListener('click', () => {
      if (!('geolocation' in navigator)) { alert('Geolocation not supported on this device.'); return; }
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude, 'Current location (GPS)');
      }, (err) => {
        alert('Could not get GPS location: ' + err.message);
      }, { enableHighAccuracy: true, timeout: 10000 });
    });

    document.getElementById('prayertime-city-input')?.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;
      const city = e.target.value.trim();
      if (!city) return;
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        const data = await res.json();
        if (data.results && data.results[0]) {
          const r = data.results[0];
          setLocation(r.latitude, r.longitude, `${r.name}${r.country ? ', ' + r.country : ''}`);
        } else {
          alert('City not found. Try a different spelling, or use GPS.');
        }
      } catch (err) {
        alert('Could not look up that city (no network access to the geocoding service). Try GPS instead.');
      }
    });

    document.getElementById('prayertime-prev-day')?.addEventListener('click', () => {
      state.viewDate.setDate(state.viewDate.getDate() - 1);
      render();
    });
    document.getElementById('prayertime-next-day')?.addEventListener('click', () => {
      state.viewDate.setDate(state.viewDate.getDate() + 1);
      render();
    });

    document.getElementById('prayertime-method')?.addEventListener('change', (e) => {
      state.method = e.target.value;
      save();
      render();
    });

    document.getElementById('settings-time-format')?.addEventListener('change', render);

    render();
  }

  return { init, render, setLocation, getState: () => state };
})();

document.addEventListener('DOMContentLoaded', PrayerTimeUI.init);

