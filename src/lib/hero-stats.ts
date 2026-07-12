// Deterministic filler numbers for the landing hero's social-proof line, until
// real weekly usage justifies switching to a live query. Stable within a
// calendar week (ISO week), shifts to a new value the following week.

function isoWeekKey(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return date.getUTCFullYear() * 100 + weekNo;
}

function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function inRange(salt: string, min: number, max: number, when: Date): number {
  return Math.round(min + hash01(`${isoWeekKey(when)}:${salt}`) * (max - min));
}

export function weeklyAspirantCount(when: Date = new Date()): number {
  return inRange("aspirants", 1800, 2400, when);
}

export function weeklyTopScore(when: Date = new Date()): number {
  return inRange("topscore", 78, 94, when);
}
