'use client';

import { useEffect, useRef, useState } from 'react';

interface Line {
  sport: string;
  points: [number, number][];
}

/** Every approved GPX route drawn together — the school's own heat map. */
export default function HeatMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    let map: import('leaflet').Map | null = null;
    let cancelled = false;
    (async () => {
      const [L, res] = await Promise.all([
        import('leaflet').then((m) => m.default),
        fetch('/api/map/lines').then((r) => r.json()),
      ]);
      if (cancelled || !ref.current) return;
      const lines: Line[] = res.lines ?? [];
      setCount(lines.length);
      map = L.map(ref.current, { scrollWheelZoom: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      if (lines.length === 0) {
        map.setView([40.007, 140.99], 12); // Appi Kogen
        return;
      }
      const group = L.featureGroup(
        lines.map((l) =>
          L.polyline(l.points, {
            color: l.sport === 'BIKE' ? '#1465b4' : '#e8551d',
            weight: 3,
            opacity: 0.3,
          })
        )
      ).addTo(map);
      map.fitBounds(group.getBounds(), { padding: [24, 24] });
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <>
      <div ref={ref} className="map-box tall" />
      {count !== null && (
        <p className="small muted mt">
          {count === 0
            ? 'No GPX routes yet — upload one and it will glow here.'
            : `${count} routes drawn. 🟠 runs · 🔵 rides. The brighter a trail, the more the school loves it.`}
        </p>
      )}
    </>
  );
}
