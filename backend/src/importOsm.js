// Importiert kostenlose Stellplaetze aus OpenStreetMap (Overpass API) in die lokale DB.
// Datenquelle: (c) OpenStreetMap-Mitwirkende, Lizenz ODbL (https://www.openstreetmap.org/copyright).
// Es wird bewusst NICHT von park4night / Stayfree o.ae. gescraped, da deren Community-Daten
// urheber-/datenbankrechtlich geschuetzt sind und ihre Nutzungsbedingungen ein Auslesen verbieten.
// OSM-Daten sind dagegen offen lizenziert und duerfen unter Namensnennung weiterverwendet werden.

import { db } from './db.js';

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';

// Standard-Bounding-Box: Deutschland, Oesterreich, Schweiz, Benelux (grob).
// Ueberschreibbar per CLI-Argument: `npm run import:osm -- "47,5,55,16"`
const DEFAULT_BBOX = '45.5,4.5,55.5,17.0';
const bbox = process.argv[2] || process.env.OSM_BBOX || DEFAULT_BBOX;

const query = `
[out:json][timeout:120];
(
  nwr["tourism"="caravan_site"]["fee"~"^(no|0)$"](${bbox});
  nwr["amenity"="parking"]["motorhome"="yes"]["fee"!~"^(yes|1)$"](${bbox});
  nwr["amenity"="parking"]["caravan"="yes"]["fee"!~"^(yes|1)$"](${bbox});
  nwr["tourism"="camp_pitch"]["fee"~"^(no|0)$"](${bbox});
);
out center tags;
`;

function toBool(v) {
  return v === 'yes' || v === '1' || v === 'true' ? 1 : 0;
}

function toNumber(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function categoryFor(tags) {
  if (tags.tourism === 'caravan_site') return 'caravan_site';
  if (tags.tourism === 'camp_pitch') return 'camp_pitch';
  if (tags.amenity === 'parking') return 'parking';
  return 'parking';
}

async function fetchOverpass() {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'freistehen-app/1.0 (kostenlose-uebernachtungsplaetze; contact via GitHub repo)',
    },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) {
    throw new Error(`Overpass-Anfrage fehlgeschlagen: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

const upsert = db.prepare(`
  INSERT INTO spots (
    source, osm_type, osm_id, name, description, lat, lon, category, fee, surface,
    max_height_m, max_weight_t, motorhome, truck, water, toilets, quiet, tags_json,
    created_by, status, updated_at
  ) VALUES (
    'osm', @osm_type, @osm_id, @name, @description, @lat, @lon, @category, @fee, @surface,
    @max_height_m, @max_weight_t, @motorhome, @truck, @water, @toilets, 0, @tags_json,
    'osm-import', 'active', datetime('now')
  )
  ON CONFLICT(osm_type, osm_id) DO UPDATE SET
    name=excluded.name,
    description=excluded.description,
    lat=excluded.lat,
    lon=excluded.lon,
    category=excluded.category,
    fee=excluded.fee,
    surface=excluded.surface,
    max_height_m=excluded.max_height_m,
    max_weight_t=excluded.max_weight_t,
    motorhome=excluded.motorhome,
    truck=excluded.truck,
    water=excluded.water,
    toilets=excluded.toilets,
    tags_json=excluded.tags_json,
    updated_at=datetime('now')
  WHERE spots.source = 'osm'
`);

async function main() {
  console.log(`Frage Overpass API fuer BBox [${bbox}] ab ...`);
  const data = await fetchOverpass();
  const elements = data.elements || [];
  console.log(`${elements.length} Objekte von OSM erhalten. Importiere ...`);

  const insertMany = db.transaction((els) => {
    let count = 0;
    for (const el of els) {
      const tags = el.tags || {};
      const lat = el.type === 'node' ? el.lat : el.center?.lat;
      const lon = el.type === 'node' ? el.lon : el.center?.lon;
      if (lat == null || lon == null) continue;

      upsert.run({
        osm_type: el.type,
        osm_id: el.id,
        name: tags.name || null,
        description: tags.description || tags.note || null,
        lat,
        lon,
        category: categoryFor(tags),
        fee: tags.fee || 'no',
        surface: tags.surface || null,
        max_height_m: toNumber(tags.maxheight),
        max_weight_t: toNumber(tags.maxweight),
        motorhome: toBool(tags.motorhome) || (tags.tourism === 'caravan_site' ? 1 : 0),
        truck: toBool(tags.hgv),
        water: toBool(tags.drinking_water) || toBool(tags.water),
        toilets: toBool(tags.toilets),
        tags_json: JSON.stringify(tags),
      });
      count++;
    }
    return count;
  });

  const imported = insertMany(elements);
  console.log(`Fertig. ${imported} Stellplaetze aus OSM importiert/aktualisiert.`);
}

main().catch((err) => {
  console.error('Import fehlgeschlagen:', err);
  process.exit(1);
});
