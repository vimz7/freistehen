import { Router } from 'express';
import { db } from '../db.js';

export const router = Router();

function serialize(row) {
  return {
    id: row.id,
    source: row.source,
    name: row.name,
    description: row.description,
    lat: row.lat,
    lon: row.lon,
    category: row.category,
    fee: row.fee,
    surface: row.surface,
    maxHeightM: row.max_height_m,
    maxWeightT: row.max_weight_t,
    motorhome: !!row.motorhome,
    truck: !!row.truck,
    water: !!row.water,
    toilets: !!row.toilets,
    quiet: !!row.quiet,
    status: row.status,
    createdAt: row.created_at,
    avgRating: row.avg_rating,
    ratingCount: row.rating_count,
  };
}

// GET /api/spots?minLat=&minLon=&maxLat=&maxLon=&category=&motorhome=1
router.get('/', (req, res) => {
  const { minLat, minLon, maxLat, maxLon, category, motorhome, truck } = req.query;

  const clauses = ["status = 'active'"];
  const params = {};

  if (minLat && minLon && maxLat && maxLon) {
    clauses.push('lat BETWEEN @minLat AND @maxLat AND lon BETWEEN @minLon AND @maxLon');
    params.minLat = parseFloat(minLat);
    params.maxLat = parseFloat(maxLat);
    params.minLon = parseFloat(minLon);
    params.maxLon = parseFloat(maxLon);
  }
  if (category) {
    clauses.push('category = @category');
    params.category = category;
  }
  if (motorhome === '1') clauses.push('motorhome = 1');
  if (truck === '1') clauses.push('truck = 1');

  const sql = `
    SELECT s.*,
      (SELECT ROUND(AVG(r.rating), 1) FROM ratings r WHERE r.spot_id = s.id) AS avg_rating,
      (SELECT COUNT(*) FROM ratings r WHERE r.spot_id = s.id) AS rating_count
    FROM spots s
    WHERE ${clauses.join(' AND ')}
    LIMIT 2000
  `;
  const rows = db.prepare(sql).all(params);
  res.json(rows.map(serialize));
});

router.get('/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT s.*,
        (SELECT ROUND(AVG(r.rating), 1) FROM ratings r WHERE r.spot_id = s.id) AS avg_rating,
        (SELECT COUNT(*) FROM ratings r WHERE r.spot_id = s.id) AS rating_count
      FROM spots s WHERE s.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Stellplatz nicht gefunden' });

  const ratings = db
    .prepare('SELECT id, rating, comment, author, created_at FROM ratings WHERE spot_id = ? ORDER BY created_at DESC')
    .all(req.params.id);

  res.json({ ...serialize(row), ratings });
});

// POST /api/spots  -> von Community angelegter Stellplatz
router.post('/', (req, res) => {
  const b = req.body || {};
  if (typeof b.lat !== 'number' || typeof b.lon !== 'number') {
    return res.status(400).json({ error: 'lat und lon (Zahlen) sind erforderlich' });
  }
  if (b.lat < -90 || b.lat > 90 || b.lon < -180 || b.lon > 180) {
    return res.status(400).json({ error: 'lat/lon ausserhalb des gueltigen Bereichs' });
  }

  const stmt = db.prepare(`
    INSERT INTO spots (
      source, name, description, lat, lon, category, fee, surface,
      max_height_m, max_weight_t, motorhome, truck, water, toilets, quiet,
      created_by, status
    ) VALUES (
      'community', @name, @description, @lat, @lon, @category, @fee, @surface,
      @max_height_m, @max_weight_t, @motorhome, @truck, @water, @toilets, @quiet,
      @created_by, 'active'
    )
  `);

  const info = stmt.run({
    name: b.name || null,
    description: b.description || null,
    lat: b.lat,
    lon: b.lon,
    category: b.category || 'parking',
    fee: 'no',
    surface: b.surface || null,
    max_height_m: b.maxHeightM ?? null,
    max_weight_t: b.maxWeightT ?? null,
    motorhome: b.motorhome ? 1 : 0,
    truck: b.truck ? 1 : 0,
    water: b.water ? 1 : 0,
    toilets: b.toilets ? 1 : 0,
    quiet: b.quiet ? 1 : 0,
    created_by: (b.createdBy || 'anonym').slice(0, 80),
  });

  const row = db.prepare('SELECT * FROM spots WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(serialize(row));
});

// POST /api/spots/:id/ratings
router.post('/:id/ratings', (req, res) => {
  const spot = db.prepare('SELECT id FROM spots WHERE id = ?').get(req.params.id);
  if (!spot) return res.status(404).json({ error: 'Stellplatz nicht gefunden' });

  const { rating, comment, author } = req.body || {};
  const r = parseInt(rating, 10);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: 'rating muss eine Ganzzahl zwischen 1 und 5 sein' });
  }

  const info = db
    .prepare('INSERT INTO ratings (spot_id, rating, comment, author) VALUES (?, ?, ?, ?)')
    .run(req.params.id, r, (comment || '').slice(0, 1000) || null, (author || 'anonym').slice(0, 80));

  const created = db.prepare('SELECT id, rating, comment, author, created_at FROM ratings WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// POST /api/spots/:id/report -> markiert einen Platz zur Pruefung (z.B. nicht mehr existent / falsch)
router.post('/:id/report', (req, res) => {
  const spot = db.prepare('SELECT id FROM spots WHERE id = ?').get(req.params.id);
  if (!spot) return res.status(404).json({ error: 'Stellplatz nicht gefunden' });
  db.prepare("UPDATE spots SET status = 'reported', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
