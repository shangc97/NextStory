import { useEffect, useRef } from 'react';
import { libraryDescription } from '@/data/libraries';

import { DEFAULT_MAP_CENTER, type LocationMapProps } from './location-map.types';

export default function LocationMap({ coordinate, libraries, onSelectLibrary }: LocationMapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const selectLibrary = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== 'select-library') return;
      if (libraries.some((library) => library.id === event.data.id)) onSelectLibrary(event.data.id);
    };
    window.addEventListener('message', selectLibrary);
    return () => window.removeEventListener('message', selectLibrary);
  }, [libraries, onSelectLibrary]);
  const data = JSON.stringify({
    center: coordinate ?? DEFAULT_MAP_CENTER,
    coordinate,
    libraries: libraries.map((library) => ({ ...library, description: libraryDescription(library) })),
  }).replace(/</g, '\\u003c');

  // A sandboxed web map supports multiple markers, unlike the OSM export embed.
  const srcDoc = `<!doctype html><html><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <style>html,body,#map{height:100%;width:100%;margin:0}.leaflet-popup-content p{white-space:pre-line}#status{position:absolute;top:12px;left:50px;z-index:1000;background:white;padding:8px;font:14px sans-serif}</style>
    </head><body><div id="map" aria-label="Toronto Public Library branches"></div><div id="status" role="status">Loading map…</div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="document.getElementById('status').textContent='Unable to load the map. Check your connection and reload.'"></script>
    <script>
      if (window.L) {
        const data = ${data};
        const map = L.map('map').setView([data.center.latitude, data.center.longitude], data.coordinate ? 14 : 12);
        const status = document.getElementById('status');
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        tiles.on('load', () => { status.hidden = true; });
        tiles.on('tileerror', () => { status.hidden = false; status.textContent = 'Some map tiles could not load. Check your connection.'; });
        const points = [];
        data.libraries.forEach(library => {
          const point = [library.coordinate.latitude, library.coordinate.longitude];
          points.push(point);
          const popup = document.createElement('div');
          const title = document.createElement('strong');
          title.textContent = library.name;
          const description = document.createElement('p');
          description.textContent = library.description;
          popup.append(title, description);
          L.circleMarker(point, { radius: 9, color: '#166534', fillColor: '#22c55e', fillOpacity: 1, weight: 2 }).addTo(map).bindPopup(popup)
            .on('click', () => parent.postMessage({ type: 'select-library', id: library.id }, '*'));
        });
        if (data.coordinate) {
          const point = [data.coordinate.latitude, data.coordinate.longitude];
          points.push(point);
          L.circleMarker(point, { radius: 9, color: '#1e40af', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }).addTo(map).bindPopup('Your last requested location');
        }
        if (points.length > 1) map.fitBounds(points, { padding: [35, 35], maxZoom: 15 });
        new ResizeObserver(() => map.invalidateSize()).observe(document.getElementById('map'));
      }
    </script></body></html>`;

  return (
    <iframe ref={frame} title="Map — OpenStreetMap" srcDoc={srcDoc} sandbox="allow-scripts"
      style={{ width: '100%', height: '100%', flex: 1, minHeight: 240, border: 0 }} />
  );
}
