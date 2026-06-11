/** جدة — البلد (موقع على اليابسة، للنموذج والعرض التجريبي). */
export const JEDDAH_DEFAULT_LAT = "21.481000";
export const JEDDAH_DEFAULT_LNG = "39.186500";

export const JEDDAH_DEFAULT_CENTER = {
  lat: Number(JEDDAH_DEFAULT_LAT),
  lng: Number(JEDDAH_DEFAULT_LNG),
};

/** إحداثيات المثال القديمة كانت في البحر الأحمر — نُحدّثها تلقائياً. */
const LEGACY_SEA_COORDS = new Set([
  "21.5433,39.1728",
  "21.543300,39.172800",
]);

export function jeddahDefaultCoords(): { latitude: string; longitude: string } {
  return { latitude: JEDDAH_DEFAULT_LAT, longitude: JEDDAH_DEFAULT_LNG };
}

export function shouldUseJeddahDefaultCoords(
  latitude: string,
  longitude: string,
): boolean {
  const lat = latitude.trim();
  const lng = longitude.trim();
  if (!lat && !lng) return true;
  return LEGACY_SEA_COORDS.has(`${lat},${lng}`);
}
