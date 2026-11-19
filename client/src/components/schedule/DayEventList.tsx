import type { ScheduleEvent } from "../../lib/schedule";
import type { TimedSegment } from "../../lib/scheduleLayout";
import {
  hourPosition,
  layoutEvents,
  scheduleEventLabel,
} from "../../lib/scheduleLayout";
import { italianDateTime, shortDate } from "../../lib/scheduleDates";

type Segment = TimedSegment<{ event: ScheduleEvent }>;

type Props = {
  date: string;
  segments: Segment[];
  heights: number[];
  timelineHeight: number;
  busy: boolean;
  onEdit: (event: ScheduleEvent, date: string) => void;
};

export default function DayEventList({
  date,
  segments,
  heights,
  timelineHeight,
  busy,
  onEdit,
}: Props) {
  const placed = layoutEvents(segments);

  return (
    <div className="planner-timeline" style={{ height: timelineHeight }}>
      {placed.map(({ event, start, end, lane, laneCount }) => (
        <button
          type="button"
          key={event.id}
          disabled={busy}
          className={`planner-shift shadow ${event.type === "work" ? "bg-secondary" : "bg-accent"}`}
          style={{
            top: hourPosition(start, heights),
            height: Math.max(
              18,
              hourPosition(end, heights) - hourPosition(start, heights),
            ),
            width: `${100 / laneCount}%`,
            left: `${(lane * 100) / laneCount}%`,
          }}
          title={`${scheduleEventLabel(event)}${event.title ? `: ${event.title}` : ""} · ${italianDateTime(event.starts_at).replace("T", " ")} – ${italianDateTime(event.ends_at).replace("T", " ")}`}
          aria-label={`Modifica ${event.title || scheduleEventLabel(event)} del ${shortDate(date)}`}
          onClick={() => onEdit(event, date)}
        >
          <strong className="planner-event-label">
            {scheduleEventLabel(event)}
          </strong>
          <span className="planner-event-time">
            {start === 0 ? "00:00" : italianDateTime(event.starts_at).slice(11)}{" "}
            – {end >= 24 ? "24:00" : italianDateTime(event.ends_at).slice(11)}
          </span>
        </button>
      ))}
    </div>
  );
}
