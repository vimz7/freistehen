# freistehen

Web-App (PWA) zum Finden und Eintragen von **kostenlosen Uebernachtungsplaetzen**
fuer Wohnmobil, Van und Camper – auf einer Karte, mit Community-Bewertungen.

## Zu den Datenquellen (wichtig)

Es war urspruenglich angefragt, Stellplaetze aus park4night, Stayfree & Co. zu
scrapen. Das wird hier bewusst **nicht** gemacht:

- Die Stellplatz-Datenbanken dieser Anbieter sind Community-Inhalte, die durch
  Urheber- und (in der EU) Datenbankrecht geschuetzt sind.
- Alle drei genannten Dienste verbieten in ihren Nutzungsbedingungen explizit
  das automatisierte Auslesen (Scraping) und die Weiterverwendung der Daten in
  anderen Anwendungen.
- Ein Scraper wuerde die App selbst rechtlich angreifbar machen (Abmahnung,
  Sperrung, ggf. Schadenersatz) und ist daher keine gute Grundlage.

Stattdessen nutzt die App zwei legale, nachhaltige Quellen:

1. **OpenStreetMap** (Overpass API) – riesige, offen lizenzierte
   Community-Datenbank (ODbL), die bereits sehr viele kostenlose
   Wohnmobil-Stellplaetze und Parkplaetze mit passenden Tags enthaelt
   (`tourism=caravan_site` + `fee=no`, `amenity=parking` + `motorhome=yes`, ...).
   Nutzung ist erlaubt, solange OSM als Quelle genannt wird (siehe Karten-Footer
   und Info-Dialog in der App).
2. **Eigene Community-Eintraege** – Nutzer:innen der App koennen direkt in der
   App neue Plaetze eintragen, bewerten und melden – genau wie bei den
   Vorbildern, nur mit eigener, selbst kontrollierter Datenbasis statt fremder
   Daten.

## Architektur

```
freistehen/
  backend/    Express-API + SQLite-Datenbank + OSM-Importer
  frontend/   React + Vite PWA mit Leaflet-Karte
```

- **backend**: `GET/POST /api/spots`, `POST /api/spots/:id/ratings`,
  `POST /api/spots/:id/report`. Speichert in einer lokalen SQLite-Datei
  (`backend/data/freistehen.sqlite`, wird automatisch angelegt).
- **frontend**: Karte (Leaflet/OSM-Tiles), Filter (Kategorie, Wohnmobil/LKW
  geeignet), Formular zum Eintragen neuer Plaetze per Klick auf die Karte,
  Detail-Panel mit Bewertungen. Als PWA installierbar (Manifest + Service
  Worker via `vite-plugin-pwa`).

## Setup & lokal starten

Voraussetzung: Node.js 18+.

```bash
# Backend
cd backend
npm install
npm run start        # http://localhost:3001

# Frontend (in einem zweiten Terminal)
cd frontend
npm install
npm run dev           # http://localhost:5173 (proxied /api -> Backend)
```

Danach im Browser `http://localhost:5173` oeffnen.

### OSM-Daten importieren

Der Import laeuft ausserhalb dieser Sandbox (hier ist der Zugriff auf
`overpass-api.de` netzwerkseitig blockiert). Lokal bei dir funktioniert er
normal:

```bash
cd backend
npm run import:osm                       # Standard-BBox: DE/AT/CH/Benelux
npm run import:osm -- "47,5,55,16"       # eigene BBox: minLat,minLon,maxLat,maxLon
```

Der Import ist idempotent (Upsert ueber `osm_type`+`osm_id`) und kann
regelmaessig per Cronjob wiederholt werden, um neue/aktualisierte OSM-Eintraege
nachzuziehen.

### PWA-Icons

`frontend/public/icons/icon-192.png` und `icon-512.png` sind aktuell simple
Platzhalter (generiert via `frontend/scripts/generate-icons.mjs`, keine
externen Tools noetig). Vor einem echten Launch durch eigenes App-Icon
ersetzen.

## Roadmap / offene Punkte

- **KI-Vorschlaege aus Satellitenbildern**: angefragt wurde eine automatische
  Erkennung potenzieller, noch nicht erfasster Plaetze (z.B. groessere
  befestigte Flaechen an Feldwegen) per KI-Auswertung von Satelliten-/Luftbildern.
  Das ist bewusst noch nicht umgesetzt, weil dafuer (a) lizenzierter Zugriff auf
  aktuelle, hochaufloesende Bilddaten (z.B. Sentinel-2, Bing/Mapbox Satellite,
  Landesvermessungsaemter) und (b) ein trainiertes Objekterkennungsmodell
  noetig sind – beides sprengt den Rahmen dieses ersten Wurfs. Sinnvoller
  naechster Schritt: erst mit reinen OSM-Heuristiken arbeiten (z.B. grosse,
  ungetaggte `amenity=parking`-Flaechen ausserorts vorschlagen), danach optional
  einen externen Bilderkennungs-Dienst als separaten Baustein anbinden.
- Foto-Upload fuer Stellplaetze
- Karten-Clustering bei sehr vielen Markern
- Nutzer-Login (aktuell sind Ersteller/Bewertungen freiwillige Namensfelder,
  kein Account-System)
- Deployment-Setup (aktuell nur lokaler Dev-Betrieb; SQLite reicht fuer den
  Start, fuer Produktivbetrieb ggf. auf Postgres wechseln)

## Lizenz der Kartendaten

Kartendarstellung und importierte Basisdaten: © OpenStreetMap-Mitwirkende,
[ODbL-Lizenz](https://www.openstreetmap.org/copyright).
