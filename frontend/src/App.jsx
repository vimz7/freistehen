import { useCallback, useEffect, useState } from 'react';
import MapView from './components/MapView.jsx';
import FilterBar from './components/FilterBar.jsx';
import AddSpotForm from './components/AddSpotForm.jsx';
import SpotPanel from './components/SpotPanel.jsx';
import { fetchSpots, createSpot } from './api.js';

const DEFAULT_CENTER = [51.1657, 10.4515]; // Deutschland
const DEFAULT_ZOOM = 6;

export default function App() {
  const [spots, setSpots] = useState([]);
  const [bounds, setBounds] = useState(null);
  const [filters, setFilters] = useState({ category: '', motorhome: false, truck: false });
  const [addMode, setAddMode] = useState(false);
  const [draftPosition, setDraftPosition] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const reload = useCallback(() => {
    if (!bounds) return;
    fetchSpots({ bounds, ...filters }).then(setSpots).catch((e) => setError(e.message));
  }, [bounds, filters]);

  useEffect(() => {
    reload();
  }, [reload]);

  function handleToggleAddMode() {
    setAddMode((v) => !v);
    setDraftPosition(null);
  }

  function handleMapClick(latlng) {
    setDraftPosition(latlng);
  }

  async function handleCreateSpot(payload) {
    setSubmitting(true);
    try {
      await createSpot(payload);
      setAddMode(false);
      setDraftPosition(null);
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>freistehen</h1>
        <p className="tagline">Kostenlose Uebernachtungsplaetze fuer Camper &amp; Van</p>
        <button className="btn btn-ghost" onClick={() => setShowInfo((v) => !v)}>
          ⓘ Info
        </button>
      </header>

      <FilterBar filters={filters} onChange={setFilters} addMode={addMode} onToggleAddMode={handleToggleAddMode} />

      {addMode && !draftPosition && <div className="hint-banner">Tippe auf die Karte, um die Position des Platzes zu setzen.</div>}
      {error && <div className="hint-banner error">{error}</div>}

      <div className="content">
        <MapView
          spots={spots}
          onMoved={setBounds}
          addMode={addMode}
          onMapClick={handleMapClick}
          draftPosition={draftPosition}
          onSelect={setSelectedId}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
        />

        {draftPosition && (
          <AddSpotForm
            position={draftPosition}
            submitting={submitting}
            onCancel={() => {
              setDraftPosition(null);
              setAddMode(false);
            }}
            onSubmit={handleCreateSpot}
          />
        )}

        {!draftPosition && selectedId && (
          <SpotPanel spotId={selectedId} onClose={() => setSelectedId(null)} onChanged={reload} />
        )}

        {showInfo && (
          <div className="panel">
            <button className="close" onClick={() => setShowInfo(false)} aria-label="Schliessen">
              ×
            </button>
            <h2>Ueber freistehen</h2>
            <p>
              freistehen zeigt kostenlose Uebernachtungsplaetze fuer Wohnmobil, Van und Camper. Die Basisdaten
              (Wohnmobil-Stellplaetze, Parkplaetze ohne Gebuehr) stammen aus{' '}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                OpenStreetMap
              </a>{' '}
              (&copy; OpenStreetMap-Mitwirkende, ODbL-Lizenz). Zusaetzlich koennen alle Nutzer:innen eigene Plaetze
              eintragen und bewerten.
            </p>
            <p>
              Bewusst <strong>nicht</strong> eingebunden werden Daten aus park4night, Stayfree o.ae.: deren
              Community-Eintraege sind urheber- und datenbankrechtlich geschuetzt und die Nutzungsbedingungen
              dieser Dienste verbieten das automatisierte Auslesen und die Weiterverwendung in anderen Apps.
            </p>
            <p className="hint">
              Geplant (noch nicht umgesetzt): automatische Vorschlaege moeglicher Plaetze anhand von offenen
              Satelliten-/Luftbildern (z.B. grosse befestigte Flaechen an Feld- und Waldwegen). Das braucht ein
              trainiertes Bilderkennungsmodell und lizenzierte Bilddaten und ist als naechster Ausbauschritt
              vorgesehen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
