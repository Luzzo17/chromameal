export type TimedSegment<T> = T & { start: number; end: number };

export const scheduleEventLabel = (event: { type: "work" | "commitment" }) =>
  event.type === "work" ? "Lavoro" : "Impegno";

export function layoutEvents<T extends { start: number; end: number }>(
  segments: T[],
) {
  const groups: { end: number; items: (T & { lane: number })[] }[] = [];

  for (const segment of [...segments].sort(
    (a, b) => a.start - b.start || a.end - b.end,
  )) {
    let group = groups.at(-1);
    if (!group || segment.start >= group.end) {
      group = { end: segment.end, items: [] };
      groups.push(group);
    } else {
      group.end = Math.max(group.end, segment.end);
    }

    let lane = 0;
    while (
      group.items.some((item) => item.lane === lane && item.end > segment.start)
    )
      lane++;
    group.items.push({ ...segment, lane });
  }

  return groups.flatMap((group) => {
    const laneCount = Math.max(1, ...group.items.map((item) => item.lane + 1));
    return group.items.map((item) => ({ ...item, laneCount }));
  });
}

export function hourHeight(hour: number, days: TimedSegment<unknown>[][]) {
  return days.some((day) =>
    day.some((segment) => segment.start < hour + 1 && segment.end > hour),
  )
    ? 56
    : 18;
}

export function hourPosition(hour: number, heights: number[]) {
  const whole = Math.min(24, Math.floor(hour));
  return (
    heights.slice(0, whole).reduce((sum, height) => sum + height, 0) +
    (whole < 24 ? (hour - whole) * heights[whole] : 0)
  );
}
