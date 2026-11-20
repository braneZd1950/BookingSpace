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

function slotCapacity(item, fallbackCapacity = DEFAULT_CAPACITY) {
  const fromItem = Number(item?.serviceCapacity ?? item?.capacity);
  if (Number.isFinite(fromItem) && fromItem > 0) return fromItem;
  const fallback = Number(fallbackCapacity);
  return Math.max(1, Number.isFinite(fallback) && fallback > 0 ? fallback : DEFAULT_CAPACITY);
}

function slotKey(item) {
  const service = item?.serviceId || item?.serviceName || 'default';
  return `${service}|${item?.startTime || ''}-${item?.endTime || ''}`;
}

/**
 * Peak occupancy for a day based on the fullest slot's filled/capacity ratio.
 * Capacity comes from each booking's service (not a single studio-wide number).
 */
export function dayPeak(list, fallbackCapacity = DEFAULT_CAPACITY) {
  const fallback = Math.max(1, Number(fallbackCapacity) || DEFAULT_CAPACITY);
  if (!list?.length) {
    return { count: 0, peak: 0, ratio: 0, capacity: fallback };
  }

  const bySlot = new Map();
  for (const item of list) {
    const key = slotKey(item);
    const current = bySlot.get(key) || {
      count: 0,
      capacity: slotCapacity(item, fallback),
    };
    current.count += 1;
    current.capacity = Math.max(current.capacity, slotCapacity(item, fallback));
    bySlot.set(key, current);
  }

  let peak = 0;
  let peakCap = fallback;
  let maxRatio = 0;
  for (const slot of bySlot.values()) {
    const ratio = Math.min(1, slot.count / slot.capacity);
    if (ratio > maxRatio || (ratio === maxRatio && slot.count > peak)) {
      maxRatio = ratio;
      peak = slot.count;
      peakCap = slot.capacity;
    }
  }

  return {
    count: list.length,
    peak,
    ratio: maxRatio,
    capacity: peakCap,
  };
}

/** Group bookings into exclusive service+time slots for day detail lists. */
export function groupDaySlots(list, fallbackCapacity = DEFAULT_CAPACITY) {
  const groups = new Map();
  for (const item of list || []) {
    const key = slotKey(item);
    const current = groups.get(key) || {
      key,
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      serviceId: item.serviceId || '',
      serviceName: item.serviceName || '',
      capacity: slotCapacity(item, fallbackCapacity),
      members: [],
    };
    current.members.push(item);
    current.capacity = Math.max(current.capacity, slotCapacity(item, fallbackCapacity));
    if (item.serviceName) current.serviceName = item.serviceName;
    groups.set(key, current);
  }

  return [...groups.values()].sort((a, b) => (
    String(a.startTime).localeCompare(String(b.startTime))
    || String(a.serviceName || '').localeCompare(String(b.serviceName || ''), 'hr')
  ));
}
