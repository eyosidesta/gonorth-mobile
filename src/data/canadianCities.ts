export interface CanadianCity {
  name: string;
  province: string;
  lat: number;
  lng: number;
}

export const CANADIAN_CITIES: CanadianCity[] = [
  // ── Québec ────────────────────────────────────────────────────────────────
  { name: 'Montréal',                province: 'QC', lat: 45.5017,  lng: -73.5673 },
  { name: 'Québec City',             province: 'QC', lat: 46.8139,  lng: -71.2082 },
  { name: 'Laval',                   province: 'QC', lat: 45.5680,  lng: -73.6920 },
  { name: 'Gatineau',                province: 'QC', lat: 45.4768,  lng: -75.7013 },
  { name: 'Longueuil',               province: 'QC', lat: 45.5314,  lng: -73.5185 },
  { name: 'Sherbrooke',              province: 'QC', lat: 45.4042,  lng: -71.8929 },
  { name: 'Saguenay',                province: 'QC', lat: 48.4287,  lng: -71.0661 },
  { name: 'Trois-Rivières',          province: 'QC', lat: 46.3432,  lng: -72.5432 },
  { name: 'Terrebonne',              province: 'QC', lat: 45.6997,  lng: -73.6433 },
  { name: 'Saint-Jérôme',            province: 'QC', lat: 45.7745,  lng: -74.0009 },
  { name: 'Drummondville',           province: 'QC', lat: 45.8841,  lng: -72.4834 },
  { name: 'Granby',                  province: 'QC', lat: 45.4000,  lng: -72.7333 },
  { name: 'Repentigny',              province: 'QC', lat: 45.7400,  lng: -73.4667 },
  { name: 'Brossard',               province: 'QC', lat: 45.4667,  lng: -73.4667 },
  { name: 'Saint-Jean-sur-Richelieu', province: 'QC', lat: 45.3167, lng: -73.2667 },
  { name: 'Châteauguay',             province: 'QC', lat: 45.3667,  lng: -73.7333 },
  { name: 'Saint-Hyacinthe',         province: 'QC', lat: 45.6167,  lng: -72.9500 },
  { name: 'Joliette',               province: 'QC', lat: 46.0167,  lng: -73.4500 },
  { name: 'Shawinigan',              province: 'QC', lat: 46.5667,  lng: -72.7500 },
  { name: 'Victoriaville',           province: 'QC', lat: 46.0500,  lng: -71.9667 },
  { name: 'Rimouski',               province: 'QC', lat: 48.4484,  lng: -68.5200 },
  { name: 'Rouyn-Noranda',           province: 'QC', lat: 48.2333,  lng: -79.0167 },
  { name: 'Val-d\'Or',              province: 'QC', lat: 48.1000,  lng: -77.7833 },
  { name: 'Sept-Îles',              province: 'QC', lat: 50.2167,  lng: -66.3833 },

  // ── Ontario ───────────────────────────────────────────────────────────────
  { name: 'Toronto',                 province: 'ON', lat: 43.6532,  lng: -79.3832 },
  { name: 'Ottawa',                  province: 'ON', lat: 45.4215,  lng: -75.6972 },
  { name: 'Mississauga',             province: 'ON', lat: 43.5890,  lng: -79.6441 },
  { name: 'Brampton',               province: 'ON', lat: 43.7315,  lng: -79.7624 },
  { name: 'Hamilton',               province: 'ON', lat: 43.2557,  lng: -79.8711 },
  { name: 'London',                  province: 'ON', lat: 42.9849,  lng: -81.2453 },
  { name: 'Markham',                province: 'ON', lat: 43.8561,  lng: -79.3370 },
  { name: 'Vaughan',                province: 'ON', lat: 43.8361,  lng: -79.4983 },
  { name: 'Kitchener',              province: 'ON', lat: 43.4516,  lng: -80.4925 },
  { name: 'Windsor',                province: 'ON', lat: 42.3149,  lng: -83.0364 },
  { name: 'Richmond Hill',          province: 'ON', lat: 43.8828,  lng: -79.4403 },
  { name: 'Burlington',             province: 'ON', lat: 43.3255,  lng: -79.7990 },
  { name: 'Oshawa',                  province: 'ON', lat: 43.8971,  lng: -78.8658 },
  { name: 'Barrie',                  province: 'ON', lat: 44.3894,  lng: -79.6903 },
  { name: 'Guelph',                  province: 'ON', lat: 43.5448,  lng: -80.2482 },
  { name: 'Waterloo',               province: 'ON', lat: 43.4668,  lng: -80.5164 },
  { name: 'Cambridge',              province: 'ON', lat: 43.3616,  lng: -80.3144 },
  { name: 'Kingston',               province: 'ON', lat: 44.2312,  lng: -76.4860 },
  { name: 'Sudbury',                province: 'ON', lat: 46.4917,  lng: -80.9930 },
  { name: 'Thunder Bay',            province: 'ON', lat: 48.3809,  lng: -89.2477 },
  { name: 'St. Catharines',         province: 'ON', lat: 43.1594,  lng: -79.2469 },
  { name: 'Niagara Falls',          province: 'ON', lat: 43.1070,  lng: -79.0687 },
  { name: 'Peterborough',           province: 'ON', lat: 44.3091,  lng: -78.3197 },
  { name: 'Sault Ste. Marie',       province: 'ON', lat: 46.5219,  lng: -84.3461 },

  // ── British Columbia ──────────────────────────────────────────────────────
  { name: 'Vancouver',              province: 'BC', lat: 49.2827,  lng: -123.1207 },
  { name: 'Surrey',                  province: 'BC', lat: 49.1913,  lng: -122.8490 },
  { name: 'Burnaby',                province: 'BC', lat: 49.2488,  lng: -122.9805 },
  { name: 'Victoria',               province: 'BC', lat: 48.4284,  lng: -123.3656 },
  { name: 'Kelowna',                province: 'BC', lat: 49.8880,  lng: -119.4960 },
  { name: 'Abbotsford',             province: 'BC', lat: 49.0504,  lng: -122.3045 },
  { name: 'Kamloops',               province: 'BC', lat: 50.6745,  lng: -120.3273 },
  { name: 'Nanaimo',                province: 'BC', lat: 49.1659,  lng: -123.9401 },

  // ── Alberta ───────────────────────────────────────────────────────────────
  { name: 'Calgary',                province: 'AB', lat: 51.0447,  lng: -114.0719 },
  { name: 'Edmonton',               province: 'AB', lat: 53.5461,  lng: -113.4938 },
  { name: 'Red Deer',               province: 'AB', lat: 52.2681,  lng: -113.8112 },
  { name: 'Lethbridge',             province: 'AB', lat: 49.6956,  lng: -112.8451 },

  // ── Manitoba ──────────────────────────────────────────────────────────────
  { name: 'Winnipeg',               province: 'MB', lat: 49.8951,  lng: -97.1384 },
  { name: 'Brandon',                province: 'MB', lat: 49.8483,  lng: -99.9500 },

  // ── Saskatchewan ─────────────────────────────────────────────────────────
  { name: 'Saskatoon',              province: 'SK', lat: 52.1332,  lng: -106.6700 },
  { name: 'Regina',                 province: 'SK', lat: 50.4452,  lng: -104.6189 },

  // ── Nova Scotia ───────────────────────────────────────────────────────────
  { name: 'Halifax',                province: 'NS', lat: 44.6488,  lng: -63.5752 },

  // ── New Brunswick ─────────────────────────────────────────────────────────
  { name: 'Moncton',                province: 'NB', lat: 46.0878,  lng: -64.7782 },
  { name: 'Fredericton',            province: 'NB', lat: 45.9636,  lng: -66.6431 },
  { name: 'Saint John',             province: 'NB', lat: 45.2733,  lng: -66.0633 },

  // ── PEI ───────────────────────────────────────────────────────────────────
  { name: 'Charlottetown',          province: 'PE', lat: 46.2382,  lng: -63.1311 },

  // ── Newfoundland ──────────────────────────────────────────────────────────
  { name: "St. John's",             province: 'NL', lat: 47.5615,  lng: -52.7126 },
];
