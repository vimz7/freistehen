import { useState } from 'react';

const initial = {
  name: '',
  description: '',
  category: 'parking',
  surface: '',
  maxHeightM: '',
  maxWeightT: '',
  motorhome: true,
  truck: false,
  water: false,
  toilets: false,
  quiet: false,
  createdBy: '',
};

export default function AddSpotForm({ position, onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState(initial);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      lat: position.lat,
      lon: position.lng,
      maxHeightM: form.maxHeightM ? parseFloat(form.maxHeightM) : null,
      maxWeightT: form.maxWeightT ? parseFloat(form.maxWeightT) : null,
    });
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Neuen Platz eintragen</h2>
      <p className="hint">
        Position: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
      </p>

      <label>
        Name
        <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="z.B. Wanderparkplatz am See" />
      </label>

      <label>
        Beschreibung
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Untergrund, Ruhe, Zufahrt, Besonderheiten ..."
        />
      </label>

      <label>
        Kategorie
        <select value={form.category} onChange={(e) => set('category', e.target.value)}>
          <option value="parking">Parkplatz</option>
          <option value="caravan_site">Wohnmobil-Stellplatz</option>
          <option value="camp_pitch">Naturstellplatz</option>
        </select>
      </label>

      <div className="grid2">
        <label>
          Max. Hoehe (m)
          <input type="number" step="0.1" value={form.maxHeightM} onChange={(e) => set('maxHeightM', e.target.value)} />
        </label>
        <label>
          Max. Gewicht (t)
          <input type="number" step="0.1" value={form.maxWeightT} onChange={(e) => set('maxWeightT', e.target.value)} />
        </label>
      </div>

      <div className="checkbox-grid">
        <label className="checkbox">
          <input type="checkbox" checked={form.motorhome} onChange={(e) => set('motorhome', e.target.checked)} />
          Wohnmobil geeignet
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={form.truck} onChange={(e) => set('truck', e.target.checked)} />
          LKW geeignet
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={form.water} onChange={(e) => set('water', e.target.checked)} />
          Trinkwasser
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={form.toilets} onChange={(e) => set('toilets', e.target.checked)} />
          Toilette
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={form.quiet} onChange={(e) => set('quiet', e.target.checked)} />
          Ruhige Lage
        </label>
      </div>

      <label>
        Dein Name (optional)
        <input value={form.createdBy} onChange={(e) => set('createdBy', e.target.value)} placeholder="anonym" />
      </label>

      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Speichere ...' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}
