# ShiaSphere

A complete Shia Islamic companion — daily prayers, Quran, Duas, Ziyarat, Aamaal, Islamic calendar, Qibla and Tasbeeh — built as a free, installable, mobile-first PWA.

**Developer:** Mohd Jaun Rizvi — Founder & Developer of ShiaSphere

## Status: Phase 1–2 complete (working app shell + core tools)

What is fully functional right now:

- ✅ App shell, bottom navigation (8 tabs), Home dashboard
- ✅ Golden / Silver themes, persisted across reloads
- ✅ Digital Tasbeeh (tap counter, undo, reset, target, presets, custom zikr, saved sessions, haptic/sound)
- ✅ Qaza Namaz tracker (per-prayer counts, add quantity, reset-with-confirmation)
- ✅ Qibla compass (real geolocation + device-orientation bearing calculation to the Kaaba — no fake direction)
- ✅ Prayer Times (real astronomical sun-position calculation for Fajr/Dhuhr/Asr/Maghrib/Isha/Sunrise/Sunset/Imsak/Midnight, GPS or manual city, Shia Jafari-style calculation parameters, 12/24h toggle, day navigation, live countdown)
- ✅ Islamic (Hijri) calendar (tabular calendar algorithm, month navigation, date tap for event detail, color-coded Shia occasions, explicit moon-sighting-variance disclaimer)
- ✅ Complete step-by-step Shia Namaz guide (Rakatay) with real Arabic + Urdu for every fixed recitation (Takbir, Ruku/Sajdah dhikr, Tashahhud, Salam, Tasbihat Arba'a) and a Qunoot example
- ✅ Holy Quran section: full 114-surah navigable list; Al-Fatiha, Al-Ikhlas, Al-Falaq, An-Nas, Al-Kafirun, Al-Asr and Al-Qadr included with complete, verified Arabic + Urdu text; remaining surahs clearly marked "Pending" (scaffolded, not fabricated)
- ✅ Duas, Ziyarat, Aamaal, Munaajaat, Sahifa, Baqiyaat — full category/library structure per the spec, with a handful of short universally-fixed texts (Istighfar, Salawat, Qur'anic duas, Tasbih of Fatima Zahra, short Dua-e-Faraj) filled in, and every other entry honestly marked **"Verified text pending"** rather than invented
- ✅ Global search across all sections
- ✅ Bookmarks, Reader (Arabic-only / Urdu-only / both, font size, copy, share, bookmark)
- ✅ Settings: theme, display mode, transliteration toggle (UI-ready), font size, time format, notification permission, clear-all-data
- ✅ Developer page (placeholder avatar until a real photo is supplied)
- ✅ Local-only persistence (localStorage) for Tasbeeh, Qaza, bookmarks and settings — nothing leaves the device
- ✅ Installable PWA (manifest + service worker, offline app-shell caching)

## Why some religious texts say "Verified text pending"

This is a large Shia religious library (Mafatih al-Jinan alone runs hundreds of pages). Rather than inventing Arabic text, fabricating Urdu translations, or guessing at long supplications like Dua-e-Kumayl or Ziyarat Ashura from memory — which risks introducing errors into sacred text — ShiaSphere ships with the **complete navigational structure** for every category the spec requested, and fills each entry in with verified text as it is sourced and checked against a cited edition. Entries already filled in (short Quran surahs, the fixed Namaz recitations, a few short duas) are texts that are extremely standardized and were included with high confidence; longer or more variable texts are intentionally left as "Pending" rather than risk inaccuracy in content people will use in worship.

**To continue populating the library:** add verified Arabic + Urdu into the relevant file under `data/` (see Project Structure below) — each entry already has the right shape (`id`, `title`, `status: "verified"`, `arabic`, `urdu`, `transliteration`, `source`).

## Running locally

Data files are loaded with `fetch()`, which browsers block on `file://` pages. Serve the folder over HTTP:

```bash
# Python
python3 -m http.server 8080
# then open http://localhost:8080
```

Or use the VS Code "Live Server" extension, or any static file server.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. Repo Settings → Pages → Deploy from branch → select `main` (or `master`) and `/ (root)`.
3. Your app will be live at `https://<username>.github.io/<repo>/`.
4. On Android Chrome, visiting the URL will offer "Add to Home Screen" (installable PWA).

## Developer photo

Place a photo at `assets/images/developer-photo.png` and update the Developer page's `<div id="developer-photo">` in `index.html` to use an `<img>` tag pointing to it. No placeholder face has been substituted — the page currently shows a generic icon until a real photo is supplied.

## Project Structure

```
ShiaSphere/
├── index.html              # App shell + all page markup
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline caching
├── css/
│   ├── main.css            # Core layout/components
│   ├── golden-theme.css    # Golden theme variables
│   ├── silver-theme.css    # Silver theme variables
│   ├── arabic.css          # RTL / Arabic & Urdu font rules
│   └── responsive.css      # Mobile breakpoints, safe-area insets
├── js/
│   ├── hijri.js             # Tabular Hijri<->Gregorian calendar math
│   ├── content-loader.js    # Fetches data/*.json, Islamic events list
│   ├── bookmarks.js         # Bookmark persistence
│   ├── settings.js          # Theme/display/font persistence
│   ├── navigation.js        # Page routing
│   ├── tasbeeh.js           # Digital Tasbeeh logic + UI
│   ├── qaza.js              # Qaza tracker logic + UI
│   ├── qibla.js             # Geolocation + orientation Qibla bearing
│   ├── prayer-times.js      # Astronomical prayer time calculation + UI
│   ├── calendar.js          # Hijri calendar UI
│   ├── search.js            # Global search
│   ├── reader.js            # Immersive text reader
│   └── app.js                # Home dashboard, content rendering, settings/dev pages
└── data/
    ├── namaz/guide.json
    ├── quran/surahs.json
    ├── duas/duas.json
    ├── ziyarat/ziyarat.json
    ├── aamaal/aamaal.json, baqiyaat.json
    ├── munaajaat/munaajaat.json
    └── sahifa/sahifa.json
```

## Next phases (not yet built)

- Populate remaining Quran surahs, full Duas/Ziyarat/Aamaal/Munaajaat/Sahifa texts from a verified source with edition citation
- Audio recitation integration (lawful/licensed sources only)
- Push notifications for prayer times (currently only requests permission; scheduling logic not yet wired)
- Marja-specific ruling variants beyond the current placeholders in the Namaz guide
