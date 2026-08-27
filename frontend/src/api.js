const BASE = '/api';

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Anfrage fehlgeschlagen (${res.status})`);
  }
  return res.json();
}

export function fetchSpots({ bounds, category, motorhome, truck }) {
  const params = new URLSearchParams();
  if (bounds) {
    params.set('minLat', bounds.minLat);
    params.set('minLon', bounds.minLon);
    params.set('maxLat', bounds.maxLat);
    params.set('maxLon', bounds.maxLon);
  }
  if (category) params.set('category', category);
  if (motorhome) params.set('motorhome', '1');
  if (truck) params.set('truck', '1');
  return fetch(`${BASE}/spots?${params.toString()}`).then(handle);
}

export function fetchSpot(id) {
  return fetch(`${BASE}/spots/${id}`).then(handle);
}

export function createSpot(spot) {
  return fetch(`${BASE}/spots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(spot),
  }).then(handle);
}

export function rateSpot(id, { rating, comment, author }) {
  return fetch(`${BASE}/spots/${id}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, comment, author }),
  }).then(handle);
}

export function reportSpot(id) {
  return fetch(`${BASE}/spots/${id}/report`, { method: 'POST' }).then(handle);
}
