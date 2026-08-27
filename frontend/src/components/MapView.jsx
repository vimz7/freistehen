import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const communityIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'marker-community',
});

const draftIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -34],
  shadowSize: [49, 49],
  className: 'marker-draft',
});

function boundsOf(map) {
  const b = map.getBounds();
  return {
    minLat: b.getSouth(),
    minLon: b.getWest(),
    maxLat: b.getNorth(),
    maxLon: b.getEast(),
  };
}

function MapEvents({ onMoved, onMapClick, addMode }) {
  const map = useMapEvents({
    moveend() {
      onMoved(boundsOf(map));
    },
    click(e) {
      if (addMode) onMapClick(e.latlng);
    },
  });

  // moveend feuert nicht beim ersten Rendern - initiale Bounds separat laden,
  // sonst bleibt die Karte beim Start leer, bis der Nutzer sie manuell bewegt.
  useEffect(() => {
    onMoved(boundsOf(map));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

export default function MapView({ spots, onMoved, addMode, onMapClick, draftPosition, onSelect, center, zoom }) {
  const icons = useMemo(() => ({ osm: defaultIcon, community: communityIcon }), []);

  return (
    <MapContainer center={center} zoom={zoom} className={`map${addMode ? ' add-mode' : ''}`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onMoved={onMoved} onMapClick={onMapClick} addMode={addMode} />

      {spots.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lon]}
          icon={icons[s.source] || defaultIcon}
          eventHandlers={{ click: () => onSelect(s.id) }}
        >
          <Popup>
            <strong>{s.name || 'Unbenannter Stellplatz'}</strong>
            <br />
            {s.category} {s.avgRating ? `· ${s.avgRating}★ (${s.ratingCount})` : ''}
          </Popup>
        </Marker>
      ))}

      {draftPosition && <Marker position={draftPosition} icon={draftIcon} />}
    </MapContainer>
  );
}
