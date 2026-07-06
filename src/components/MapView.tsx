'use client';

import { useEffect, useRef } from 'react';

export default function MapView({
  points,
  color = '#e8551d',
  tall,
}: {
  points: [number, number][];
  color?: string;
  tall?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || points.length < 2) return;
    let map: import('leaflet').Map | null = null;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      const line = L.polyline(points, { color, weight: 4, opacity: 0.9 }).addTo(map);
      L.circleMarker(points[0], { radius: 6, color: '#1c4d3a', fillColor: '#3f9c6d', fillOpacity: 1 }).addTo(map);
      L.circleMarker(points[points.length - 1], { radius: 6, color: '#7a1f10', fillColor: color, fillOpacity: 1 }).addTo(map);
      map.fitBounds(line.getBounds(), { padding: [24, 24] });
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points, color]);

  if (points.length < 2) return null;
  return <div ref={ref} className={`map-box${tall ? ' tall' : ''}`} />;
}
