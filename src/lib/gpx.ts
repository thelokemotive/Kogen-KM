import { XMLParser } from 'fast-xml-parser';

export type Sport = 'RUN' | 'BIKE';

export interface GpxStats {
  distanceM: number;
  elevationM: number;
  durationS: number | null;
  movingS: number | null;
  avgKmh: number | null;
  startedAt: string | null; // ISO timestamp of first point
  polyline: [number, number][]; // simplified [lat, lng] for map display
  pointCount: number;
}

export interface CheatCheck {
  status: 'APPROVED' | 'FLAGGED';
  reasons: string[];
}

interface Pt {
  lat: number;
  lon: number;
  ele: number | null;
  time: number | null; // epoch ms
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

const EARTH_R = 6371000;

function haversine(a: Pt, b: Pt): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la = (a.lat * Math.PI) / 180;
  const lb = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

/** Parse a GPX file and compute distance, elevation gain, time and a display polyline. */
export function parseGpx(xml: string): GpxStats {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    removeNSPrefix: true,
  });
  const doc = parser.parse(xml);
  const gpx = doc?.gpx;
  if (!gpx) throw new Error('Not a GPX file');

  const points: Pt[] = [];
  for (const trk of toArray<any>(gpx.trk)) {
    for (const seg of toArray<any>(trk.trkseg)) {
      for (const p of toArray<any>(seg.trkpt)) {
        const lat = parseFloat(p['@_lat']);
        const lon = parseFloat(p['@_lon']);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const ele = p.ele !== undefined ? parseFloat(p.ele) : null;
        const t = p.time ? Date.parse(p.time) : NaN;
        points.push({
          lat,
          lon,
          ele: Number.isFinite(ele as number) ? (ele as number) : null,
          time: Number.isFinite(t) ? t : null,
        });
      }
    }
  }
  // Some devices export routes rather than tracks.
  if (points.length === 0) {
    for (const rte of toArray<any>(gpx.rte)) {
      for (const p of toArray<any>(rte.rtept)) {
        const lat = parseFloat(p['@_lat']);
        const lon = parseFloat(p['@_lon']);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const ele = p.ele !== undefined ? parseFloat(p.ele) : null;
        points.push({ lat, lon, ele: Number.isFinite(ele as number) ? (ele as number) : null, time: null });
      }
    }
  }
  if (points.length < 2) throw new Error('GPX file contains no track points');

  let distance = 0;
  let moving = 0;
  for (let i = 1; i < points.length; i++) {
    const d = haversine(points[i - 1], points[i]);
    const dt =
      points[i].time !== null && points[i - 1].time !== null
        ? (points[i].time! - points[i - 1].time!) / 1000
        : null;
    // Ignore GPS teleports: a jump implying > 40 m/s (144 km/h) between fixes.
    if (dt !== null && dt > 0 && d / dt > 40) continue;
    if (dt === null && d > 500) continue;
    distance += d;
    if (dt !== null && dt > 0 && d / dt > 0.5) moving += dt;
  }

  // Elevation gain with 3 m hysteresis so GPS noise doesn't inflate climbing.
  let gain = 0;
  let anchor: number | null = null;
  for (const p of points) {
    if (p.ele === null) continue;
    if (anchor === null) {
      anchor = p.ele;
      continue;
    }
    const diff = p.ele - anchor;
    if (diff >= 3) {
      gain += diff;
      anchor = p.ele;
    } else if (diff <= -3) {
      anchor = p.ele;
    }
  }

  const times = points.map((p) => p.time).filter((t): t is number => t !== null);
  const durationS = times.length >= 2 ? Math.round((times[times.length - 1] - times[0]) / 1000) : null;
  const movingS = times.length >= 2 ? Math.round(moving) : null;
  const avgKmh =
    movingS && movingS > 0 ? (distance / movingS) * 3.6 : durationS && durationS > 0 ? (distance / durationS) * 3.6 : null;

  // Downsample for storage/display (max ~400 points).
  const step = Math.max(1, Math.floor(points.length / 400));
  const polyline: [number, number][] = [];
  for (let i = 0; i < points.length; i += step) {
    polyline.push([round5(points[i].lat), round5(points[i].lon)]);
  }
  const last = points[points.length - 1];
  polyline.push([round5(last.lat), round5(last.lon)]);

  return {
    distanceM: Math.round(distance),
    elevationM: Math.round(gain),
    durationS,
    movingS,
    avgKmh: avgKmh !== null ? Math.round(avgKmh * 10) / 10 : null,
    startedAt: times.length ? new Date(times[0]).toISOString() : null,
    polyline,
    pointCount: points.length,
  };
}

function round5(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

/**
 * Honesty checks. We never silently reject — suspicious uploads are FLAGGED
 * and go to the staff review queue, where the GPX can be inspected.
 */
export function checkForCheating(stats: GpxStats, sport: Sport): CheatCheck {
  const reasons: string[] = [];
  const kmh = stats.avgKmh;

  if (stats.durationS === null) {
    reasons.push('The GPX file has no time data, so pace cannot be checked.');
  }
  if (kmh !== null) {
    if (sport === 'RUN') {
      if (kmh > 16) reasons.push(`Average moving speed ${kmh} km/h is very fast for running.`);
      if (kmh < 5.5 && stats.distanceM > 1500)
        reasons.push(`Average moving speed ${kmh} km/h looks like walking, not running.`);
    } else {
      if (kmh > 45) reasons.push(`Average moving speed ${kmh} km/h is very fast for a bike ride.`);
      if (kmh < 5 && stats.distanceM > 2000)
        reasons.push(`Average moving speed ${kmh} km/h looks like walking, not riding.`);
    }
  }
  const maxKm = sport === 'RUN' ? 80 : 200;
  if (stats.distanceM > maxKm * 1000)
    reasons.push(`Distance ${(stats.distanceM / 1000).toFixed(1)} km is unusually long for one ${sport === 'RUN' ? 'run' : 'ride'}.`);
  if (stats.elevationM > 4500)
    reasons.push(`Elevation gain ${stats.elevationM} m is unusually large for one activity.`);
  if (stats.pointCount < 10)
    reasons.push('Very few GPS points — the recording may be hand-made.');

  return { status: reasons.length ? 'FLAGGED' : 'APPROVED', reasons };
}
