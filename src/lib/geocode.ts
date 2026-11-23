export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeCity(query: string): Promise<GeoResult | null> {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ca,us`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'GoNorth-Carpooling-App/1.0' },
  });

  if (!res.ok) return null;

  const results = await res.json();
  if (!results.length) return null;

  const parts = results[0].display_name.split(',');
  const displayName = parts.slice(0, 2).join(',').trim();

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
    displayName,
  };
}
