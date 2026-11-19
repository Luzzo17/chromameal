import Week from "../Week";
import DayEventList from "./DayEventList";
import type { ScheduleEvent } from "../../lib/schedule";
import type { TimedSegment } from "../../lib/scheduleLayout";

type Segment = TimedSegment<{ event: ScheduleEvent }>;

type Props = {
  days: { id: string; title: string; dateLabel?: string }[];
  segments: Segment[][];
  heights: number[];
  timelineHeight: number;
  busy: boolean;
  onEdit: (event: ScheduleEvent, date: string) => void;
};

export default function WeekTimeline({
  days,
  segments,
  heights,
  timelineHeight,
  busy,
  onEdit,
}: Props) {
  return (
    <div className="planner-calendar">
      <div className="planner-hours" aria-label="Ore del giorno">
        {heights.map((height, hour) => (
          <span key={hour} style={{ height }}>
            {hour}
          </span>
        ))}
      </div>
      <Week
        days={days}
        renderDay={(date) => {
          const index = days.findIndex((day) => day.id === date);
          return (
            <DayEventList
              date={date}
              segments={segments[index]}
              heights={heights}
              timelineHeight={timelineHeight}
              busy={busy}
              onEdit={onEdit}
            />
          );
        }}
      />
    </div>
  );
}
