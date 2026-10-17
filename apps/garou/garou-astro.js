/* Garou lunisolar calendar and true topocentric sky. MIT Astronomy Engine is vendored separately. */
(function (root) {
  "use strict";
  const A = root.Astronomy;
  if (!A) throw new Error("The Astronomy Engine script must load before garou-astro.js.");
  const cache = new Map();
  const MS_DAY = 86400000;
  const SIGNS = [
    "Nerigal", "Eshtarra", "Mitanu", "Sokhta", "Katanka-Sonnak", "Hakahe",
    "Tambiyah", "Meros", "Zarok", "Lu-Bat", "Ruatma", "Shantar"
  ];

  // Rage Across the Heavens, chapter 2: first full moon after the northern
  // vernal equinox starts each year; exactly 12 named full-to-full months.
  // Some solar years contain a 13th lunation that the book does not name.
  function calendarYear(year) {
    if (cache.has(year)) return cache.get(year);
    if (!Number.isInteger(year) || year < 1600 || year > 2400) {
      throw new RangeError("Calendar supports astronomical years 1600 through 2400.");
    }
    const equinox = A.SearchSunLongitude(0, new Date(Date.UTC(year, 1, 15)), 60);
    if (!equinox) throw new Error("Unable to find the March equinox.");
    const moons = [];
    let cursor = equinox.date;
    for (let i = 0; i < 13; i++) {
      const full = A.SearchMoonPhase(180, cursor, 40);
      if (!full) throw new Error("Unable to find a full moon.");
      moons.push(full.date);
      cursor = new Date(full.date.getTime() + 60 * 1000);
    }
    const answer = { year, equinox: equinox.date, moons, start: moons[0] };
    cache.set(year, answer);
    return answer;
  }

  function calendarAt(date) {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
      throw new TypeError("A valid Date is required.");
    }
    let y = date.getUTCFullYear();
    if (y < 1600 || y > 2400) throw new RangeError("Date outside supported range.");
    if (date < calendarYear(y).start) y -= 1;
    const current = calendarYear(y);
    const nextStart = calendarYear(y + 1).start;
    const index = current.moons.findIndex((start, i) =>
      i < 12 && date >= start && date < current.moons[i + 1]);
    const intercalary = index === -1;
    return {
      year: y,
      start: current.start,
      equinox: current.equinox,
      nextYearStart: nextStart,
      months: SIGNS.map((name, i) => ({ name, index: i + 1, start: current.moons[i], end: current.moons[i + 1] })),
      index,
      sign: intercalary ? null : SIGNS[index],
      intercalary,
      monthStart: intercalary ? current.moons[12] : current.moons[index],
      monthEnd: intercalary ? nextStart : current.moons[index + 1]
    };
  }

  function lunarPhase(date) {
    const phase = A.MoonPhase(date);
    const sector = Math.round(phase / 45) % 8;
    const phases = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
      "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
    const auspices = ["Ragabash", "Theurge", "Philodox", "Galliard", "Ahroun",
      "Galliard", "Philodox", "Theurge"];
    return {
      angle: phase,
      label: phases[sector],
      auspice: auspices[sector],
      illumination: (1 - Math.cos(phase * Math.PI / 180)) / 2
    };
  }

  function nextFullMoon(date) {
    const moon = A.SearchMoonPhase(180, new Date(date.getTime() + 1000), 40);
    return moon ? moon.date : null;
  }

  function observer(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new RangeError("Latitude must be -90..90 and longitude -180..180.");
    }
    return new A.Observer(latitude, longitude, 0);
  }

  function skyBody(name, date, observerLocation) {
    const eq = A.Equator(name, date, observerLocation, true, true);
    const h = A.Horizon(date, observerLocation, eq.ra, eq.dec, "normal");
    return { name, ra: eq.ra, dec: eq.dec, az: h.azimuth, alt: h.altitude };
  }

  function skyStar(star, date, observerLocation) {
    // Reuse a user-defined star slot; Astronomy Engine converts J2000 to
    // equator-of-date and applies the same horizon correction as planets.
    A.DefineStar(A.Body.Star1, star.ra, star.dec, 1000);
    const pos = skyBody(A.Body.Star1, date, observerLocation);
    return { ...pos, name: star.name, key: star.key, mag: star.mag };
  }

  const api = { SIGNS, calendarYear, calendarAt, lunarPhase, nextFullMoon,
    observer, skyBody, skyStar };
  root.GarouAstro = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
