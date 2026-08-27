import { useEffect, useState } from 'react';
import { fetchSpot, rateSpot, reportSpot } from '../api.js';

const CATEGORY_LABELS = {
  parking: 'Parkplatz',
  caravan_site: 'Wohnmobil-Stellplatz',
  camp_pitch: 'Naturstellplatz',
};

export default function SpotPanel({ spotId, onClose, onChanged }) {
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSpot(spotId)
      .then((s) => !cancelled && setSpot(s))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [spotId]);

  async function submitRating(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await rateSpot(spotId, { rating, comment, author });
      const updated = await fetchSpot(spotId);
      setSpot(updated);
      setComment('');
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReport() {
    if (!confirm('Diesen Platz zur Pruefung melden (z.B. existiert nicht mehr)?')) return;
    await reportSpot(spotId);
    onChanged?.();
    onClose();
  }

  return (
    <div className="panel">
      <button className="close" onClick={onClose} aria-label="Schliessen">
        ×
      </button>

      {loading && <p>Lade ...</p>}
      {error && <p className="error">{error}</p>}

      {spot && (
        <>
          <h2>{spot.name || 'Unbenannter Stellplatz'}</h2>
          <p className="meta">
            {CATEGORY_LABELS[spot.category] || spot.category}
            {' · '}
            {spot.source === 'osm' ? 'aus OpenStreetMap' : 'von der Community'}
            {spot.avgRating ? ` · ${spot.avgRating}★ (${spot.ratingCount})` : ' · noch keine Bewertung'}
          </p>

          {spot.description && <p>{spot.description}</p>}

          <ul className="facts">
            {spot.motorhome && <li>🚐 Wohnmobil geeignet</li>}
            {spot.truck && <li>🚚 LKW geeignet</li>}
            {spot.water && <li>🚰 Trinkwasser</li>}
            {spot.toilets && <li>🚻 Toilette</li>}
            {spot.quiet && <li>🌙 Ruhige Lage</li>}
            {spot.maxHeightM && <li>Max. Hoehe: {spot.maxHeightM} m</li>}
            {spot.maxWeightT && <li>Max. Gewicht: {spot.maxWeightT} t</li>}
            {spot.surface && <li>Untergrund: {spot.surface}</li>}
          </ul>

          <h3>Bewertungen</h3>
          {spot.ratings?.length ? (
            <ul className="ratings">
              {spot.ratings.map((r) => (
                <li key={r.id}>
                  <strong>{'★'.repeat(r.rating)}</strong> {r.author || 'anonym'}
                  {r.comment && <p>{r.comment}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">Noch keine Bewertungen.</p>
          )}

          <form onSubmit={submitRating} className="rating-form">
            <label>
              Bewertung
              <select value={rating} onChange={(e) => setRating(parseInt(e.target.value, 10))}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              placeholder="Kommentar (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
            <input placeholder="Dein Name (optional)" value={author} onChange={(e) => setAuthor(e.target.value)} />
            <div className="actions">
              <button type="button" className="btn" onClick={handleReport}>
                Melden
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sende ...' : 'Bewertung abschicken'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
