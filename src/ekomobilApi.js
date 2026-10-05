import { fetchWithSecurity } from './security';

/**
 * Parses buses from the searchBusesontheRoute HTML response.
 * Filters out metadata elements like #busOnStopData.
 */
export function parseBusesFromHtml(htmlText) {
  if (!htmlText) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  // Select all input elements except the hidden busOnStopData
  const inputs = Array.from(doc.querySelectorAll('li:not(#busOnStopData) input'));

  const buses = [];
  for (const input of inputs) {
    const val = input.value || '';
    const parts = val.split('+');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        buses.push({
          lat,
          lng,
          plate: parts[2] ? parts[2].trim() : '',
          direction: parts[3] ? parts[3].trim() : '0',
          position: [lat, lng],
        });
      }
    }
  }
  return buses;
}

/**
 * Fetch live buses on a given route and direction.
 * @param {string} routeCode e.g. "490"
 * @param {number} direction 0 for outbound (gidiş), 1 for inbound (dönüş)
 */
export async function fetchBusesOnRoute(routeCode, direction = 0) {
  const endpoint = `/yolcu_bilgilendirme_operations.php?cmd=searchBusesontheRoute&route_code=${encodeURIComponent(routeCode)}&direction=${direction}`;
  const response = await fetchWithSecurity(endpoint);
  const text = await response.text();
  return parseBusesFromHtml(text);
}

/**
 * Fetch route coordinate points (polyline).
 * @param {string} routeCode e.g. "490"
 * @param {number} direction 0 or 1
 */
export async function fetchRouteCoordinates(routeCode, direction = 0) {
  const endpoint = `/yolcu_bilgilendirme_operations.php?cmd=searchRouteCoordPoints&route_code=${encodeURIComponent(routeCode)}&direction=${direction}`;
  const response = await fetchWithSecurity(endpoint);
  const json = await response.json();

  if (!Array.isArray(json)) return [];

  return json
    .map((pt) => [parseFloat(pt.Latitude), parseFloat(pt.Longitude)])
    .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0);
}

/**
 * Fetch direction names (e.g. direct0, direct1).
 * @param {string} routeCode e.g. "490"
 */
export async function fetchRouteDirections(routeCode) {
  const endpoint = `/yolcu_bilgilendirme_operations.php?cmd=searchRouteDirections&route_code=${encodeURIComponent(routeCode)}`;
  const response = await fetchWithSecurity(endpoint);
  const data = await response.json();
  return {
    direct0: data?.direct0 ? data.direct0.replace(/-/g, ' > ') : 'Gidiş Yönü',
    direct1: data?.direct1 ? data.direct1.replace(/-/g, ' > ') : 'Dönüş Yönü',
  };
}

/**
 * Fetch route timetable schedule HTML.
 * @param {string} routeCode
 * @param {number} direction
 */
export async function fetchRouteSchedule(routeCode, direction = 0) {
  const endpoint = `/yolcu_bilgilendirme_operations.php?cmd=searchRouteSchedule&route_code=${encodeURIComponent(routeCode)}&direction=${direction}`;
  const response = await fetchWithSecurity(endpoint);
  return await response.text();
}

/**
 * Autocomplete / search routes by term.
 * @param {string} term
 */
export async function searchRoutes(term) {
  if (!term || term.trim().length < 2) return [];
  const endpoint = `/yolcu_bilgilendirme_operations.php?cmd=searchRoute&term=${encodeURIComponent(term.trim())}`;
  try {
    const response = await fetchWithSecurity(endpoint);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Search routes error:', err);
    return [];
  }
}

export default {
  parseBusesFromHtml,
  fetchBusesOnRoute,
  fetchRouteCoordinates,
  fetchRouteDirections,
  fetchRouteSchedule,
  searchRoutes,
};
