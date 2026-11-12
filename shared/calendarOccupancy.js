export const DEFAULT_CAPACITY = 12;

export function occupancyLevel(ratio, open = true) {
  if (!open) return 'closed';
  if (ratio <= 0) return 'free';
  if (ratio <= 0.25) return 'low';
  if (ratio <= 0.5) return 'mid';
  if (ratio <= 0.75) return 'high';
  return 'max';
}

export function loadLabel(level) {
  if (level === 'max') return 'Puno';
  if (level === 'high') return 'Visoko';
  if (level === 'mid') return 'Srednje';
  if (level === 'low') return 'Nisko';
  if (level === 'closed') return 'Zatvoreno';
  return 'Slobodno';
}

export function dayPeak(list, capacity) {
  if (!list?.length) return { count: 0, peak: 0, ratio: 0, capacity };
  const bySlot = new Map();
  for (const item of list) {
    const key = `${item.startTime}-${item.endTime}`;
    bySlot.set(key, (bySlot.get(key) || 0) + 1);
  }
  const peak = Math.max(...bySlot.values());
  const cap = Math.max(1, capacity || DEFAULT_CAPACITY);
  return {
    count: list.length,
    peak,
    ratio: Math.min(1, peak / cap),
    capacity: cap,
  };
}
