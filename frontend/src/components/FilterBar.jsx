const CATEGORIES = [
  { value: '', label: 'Alle Kategorien' },
  { value: 'parking', label: 'Parkplatz' },
  { value: 'caravan_site', label: 'Wohnmobil-Stellplatz' },
  { value: 'camp_pitch', label: 'Naturstellplatz' },
];

export default function FilterBar({ filters, onChange, addMode, onToggleAddMode }) {
  return (
    <div className="filterbar">
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={filters.motorhome}
          onChange={(e) => onChange({ ...filters, motorhome: e.target.checked })}
        />
        Wohnmobil geeignet
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={filters.truck}
          onChange={(e) => onChange({ ...filters, truck: e.target.checked })}
        />
        LKW geeignet
      </label>

      <button className={`btn ${addMode ? 'btn-active' : ''}`} onClick={onToggleAddMode}>
        {addMode ? 'Abbrechen' : '+ Platz eintragen'}
      </button>
    </div>
  );
}
