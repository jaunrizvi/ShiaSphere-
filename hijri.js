/* ShiaSphere - Hijri (Islamic) calendar conversion
   Uses the well-known "tabular Islamic calendar" (arithmetic/civil method,
   epoch Friday 16 July 622 CE Julian = 1 Muharram 1 AH), the same base
   algorithm used by most Hijri calendar apps and libraries.
   NOTE: This is a computed approximation. Actual month start depends on
   moon sighting and can differ by ±1 day depending on region and Marja -
   this is disclosed to the user in the Calendar screen. */

const HijriCalendar = (() => {
  const HIJRI_MONTHS = [
    'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
    'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'
  ];

  // Julian Day Number from Gregorian date
  function gregorianToJDN(year, month, day) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y +
      Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  function jdnToGregorian(jdn) {
    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d) / 4);
    const m = Math.floor((5 * e + 2) / 153);
    const day = e - Math.floor((153 * m + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = 100 * b + d - 4800 + Math.floor(m / 10);
    return { year, month, day };
  }

  // Islamic (tabular, civil) epoch JDN
  const ISLAMIC_EPOCH = 1948440; // 1 Muharram 1 AH (civil/Friday epoch)

  function gregorianToHijri(year, month, day) {
    const jdn = gregorianToJDN(year, month, day);
    return jdnToHijri(jdn);
  }

  function jdnToHijri(jdn) {
    const daysSinceEpoch = jdn - ISLAMIC_EPOCH;
    const cycleLength = 10631; // 30-year cycle, 10631 days
    const cycles = Math.floor(daysSinceEpoch / cycleLength);
    let remainingDays = daysSinceEpoch % cycleLength;
    if (remainingDays < 0) remainingDays += cycleLength;

    // Leap years within a 30-year cycle (11 leap years): 2,5,7,10,13,16,18,21,24,26,29
    const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    let yearInCycle = 0;
    let daysCounted = 0;
    for (let y = 1; y <= 30; y++) {
      const yearLength = leapYears.includes(y) ? 355 : 354;
      if (daysCounted + yearLength > remainingDays) {
        yearInCycle = y;
        break;
      }
      daysCounted += yearLength;
    }
    if (yearInCycle === 0) yearInCycle = 30;

    const hijriYear = cycles * 30 + yearInCycle;
    let dayOfYear = remainingDays - daysCounted; // 0-indexed

    const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    // adjust last month length for leap year
    if (leapYears.includes(yearInCycle)) monthLengths[11] = 30;

    let hijriMonth = 0;
    for (let m = 0; m < 12; m++) {
      if (dayOfYear < monthLengths[m]) {
        hijriMonth = m;
        break;
      }
      dayOfYear -= monthLengths[m];
    }
    const hijriDay = dayOfYear + 1;

    return { year: hijriYear, month: hijriMonth + 1, day: hijriDay };
  }

  function hijriToJDN(year, month, day) {
    const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    const cycles = Math.floor((year - 1) / 30);
    const yearInCycle = year - cycles * 30;
    let days = cycles * 10631;
    const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    if (leapYears.includes(yearInCycle)) monthLengths[11] = 30;

    for (let y = 1; y < yearInCycle; y++) {
      days += leapYears.includes(y) ? 355 : 354;
    }
    for (let m = 0; m < month - 1; m++) {
      days += monthLengths[m];
    }
    days += day - 1;
    return ISLAMIC_EPOCH + days;
  }

  function hijriToGregorian(year, month, day) {
    const jdn = hijriToJDN(year, month, day);
    return jdnToGregorian(jdn);
  }

  function daysInHijriMonth(year, month) {
    const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    const yearInCycle = ((year - 1) % 30) + 1;
    const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    if (leapYears.includes(yearInCycle)) monthLengths[11] = 30;
    return monthLengths[month - 1];
  }

  function formatHijri(h) {
    return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} AH`;
  }

  return {
    HIJRI_MONTHS,
    gregorianToHijri,
    hijriToGregorian,
    daysInHijriMonth,
    formatHijri,
    gregorianToJDN,
    jdnToGregorian
  };
})();
