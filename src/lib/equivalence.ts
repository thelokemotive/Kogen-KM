/**
 * Turns raw kilometres and metres into things Appi students actually know:
 * the campus, the gondola, Hachimantai, Iwate-san, Morioka — and, at the
 * far end, Harrow in London and the whole planet.
 */

export interface Milestone {
  at: number; // km for distance, m for elevation
  emoji: string;
  name: string;
  blurb: string;
}

export const DISTANCE_JOURNEY: Milestone[] = [
  { at: 0.4, emoji: '🏟️', name: 'One lap of the track', blurb: 'The journey starts with a single lap.' },
  { at: 2, emoji: '🏫', name: 'Around the whole campus', blurb: 'A full loop of school grounds.' },
  { at: 8, emoji: '🌲', name: 'Down to Appi Kogen village', blurb: 'Out of the school gates and into the forest.' },
  { at: 16, emoji: '♨️', name: 'To Hachimantai city', blurb: 'Far enough for an onsen stop.' },
  { at: 45, emoji: '🚉', name: 'To Morioka', blurb: 'You could have run to Morioka Station instead of taking the train.' },
  { at: 110, emoji: '🍜', name: 'To Hanamaki and back to Morioka', blurb: 'Wanko soba is earned, not given.' },
  { at: 225, emoji: '🐄', name: 'To Sendai', blurb: 'Half of Tōhoku is behind you.' },
  { at: 600, emoji: '🗼', name: 'To Tokyo', blurb: 'The Hayabusa does it in 3 hours. You did it on your own legs.' },
  { at: 1150, emoji: '⛩️', name: 'To Kyoto', blurb: 'A pilgrimage worthy of the name.' },
  { at: 1950, emoji: '🌋', name: 'To Kagoshima', blurb: 'The far end of the mainland.' },
  { at: 3000, emoji: '🗾', name: 'The whole length of Japan', blurb: 'Cape Sōya to Cape Sata — every prefecture in between.' },
  { at: 9600, emoji: '🇬🇧', name: 'To Harrow, London', blurb: 'All the way to the mother school. Believe it.' },
  { at: 40075, emoji: '🌍', name: 'Around the Earth', blurb: 'Once around the entire planet. Legend status.' },
];

export const ELEVATION_LADDER: Milestone[] = [
  { at: 828, emoji: '🚡', name: 'The APPI Gondola, bottom to top', blurb: 'You climbed what the gondola carries you up.' },
  { at: 1613, emoji: '🌿', name: 'Mt Hachimantai from the sea', blurb: 'Sea level to the summit plateau.' },
  { at: 2038, emoji: '⛰️', name: 'Iwate-san', blurb: 'The mountain that watches over every run you do.' },
  { at: 3776, emoji: '🗻', name: 'Mt Fuji', blurb: 'Sea to summit of Japan’s highest.' },
  { at: 4810, emoji: '🇫🇷', name: 'Mont Blanc', blurb: 'The roof of Western Europe.' },
  { at: 5895, emoji: '🦁', name: 'Kilimanjaro', blurb: 'The roof of Africa.' },
  { at: 8849, emoji: '🏔️', name: 'Mt Everest', blurb: 'The big one. Sea level to the highest point on Earth.' },
  { at: 17698, emoji: '🏔️', name: 'Everest — twice', blurb: 'Up, down, and up again.' },
  { at: 26547, emoji: '🚀', name: 'Everest — three times', blurb: 'Higher than any mountain there is to climb.' },
  { at: 100000, emoji: '🛰️', name: 'The edge of space', blurb: 'The Kármán line, 100 km up. Officially an astronaut.' },
  { at: 408000, emoji: '👨‍🚀', name: 'The International Space Station', blurb: 'Climbing at running pace, you have reached orbit.' },
];

export interface Progress {
  done: Milestone | null;
  next: Milestone | null;
  pctToNext: number; // 0-100 progress from previous milestone to next
  remaining: number; // units left to next milestone
}

function progressAlong(value: number, ladder: Milestone[]): Progress {
  let done: Milestone | null = null;
  let next: Milestone | null = null;
  for (const m of ladder) {
    if (value >= m.at) done = m;
    else {
      next = m;
      break;
    }
  }
  if (!next) return { done, next: null, pctToNext: 100, remaining: 0 };
  const base = done ? done.at : 0;
  const pct = Math.max(0, Math.min(100, ((value - base) / (next.at - base)) * 100));
  return { done, next, pctToNext: Math.round(pct), remaining: next.at - value };
}

export function distanceProgress(km: number): Progress {
  return progressAlong(km, DISTANCE_JOURNEY);
}

export function elevationProgress(m: number): Progress {
  return progressAlong(m, ELEVATION_LADDER);
}

/** Short fun lines for profiles and the journey page. */
export function distanceLines(km: number): string[] {
  const lines: string[] = [];
  if (km <= 0) return lines;
  const track = km / 0.4;
  if (km < 45) lines.push(`That’s ${track.toFixed(0)} laps of the school track.`);
  if (km >= 45) lines.push(`You could have run to Morioka ${(km / 45).toFixed(1)} times.`);
  if (km >= 600) lines.push(`That’s the whole way to Tokyo${km >= 1200 ? ' — and back' : ''}.`);
  if (km >= 3000) lines.push('You have covered the entire length of Japan.');
  if (km >= 9600) lines.push('You have run all the way to Harrow, London.');
  return lines;
}

export function elevationLines(m: number): string[] {
  const lines: string[] = [];
  if (m <= 0) return lines;
  if (m < 2038) {
    lines.push(`That’s ${((m / 828) * 100).toFixed(0)}% of the APPI gondola’s vertical.`);
  } else if (m < 8849) {
    lines.push(`You have climbed Iwate-san ${(m / 2038).toFixed(1)} times.`);
  } else {
    lines.push(`You have climbed Everest ${(m / 8849).toFixed(1)} times. 🏔️`);
  }
  return lines;
}

/** A one-line comparison for a single activity. */
export function activityComparison(distanceM: number, elevationM: number): string | null {
  const km = distanceM / 1000;
  if (elevationM >= 828) return `You climbed more than the APPI gondola’s full vertical (828 m) in one go. 🚡`;
  if (km >= 42.195) return 'Further than a marathon. 🏅';
  if (km >= 21.1) return 'That’s a half marathon. 💪';
  if (km >= 10) return 'Double-digit kilometres — a serious outing. 🔥';
  if (km >= 5) return `That’s ${(km / 0.4).toFixed(0)} laps of the school track.`;
  if (km > 0) return `That’s ${(km / 0.4).toFixed(0)} laps of the track — every lap counts.`;
  return null;
}
