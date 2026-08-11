import type { Stats } from "./api";

interface Props {
  stats: Stats | null;
}

const SEGMENTS: { key: keyof Stats; label: string; className: string }[] = [
  { key: "open", label: "Open", className: "segment-open" },
  { key: "in_progress", label: "In progress", className: "segment-in-progress" },
  { key: "closed", label: "Closed", className: "segment-closed" },
];

export function StatsBar({ stats }: Props) {
  if (!stats) {
    return (
      <div className="console" aria-hidden="true">
        <div className="console-counters">
          {SEGMENTS.map((s) => (
            <div className="counter" key={s.key}>
              <span className="counter-label">{s.label}</span>
              <span className="counter-value counter-value-loading">···</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = stats.open + stats.in_progress + stats.closed;

  return (
    <div className="console">
      <div className="console-counters">
        {SEGMENTS.map((s) => (
          <div className="counter" key={s.key}>
            <span className="counter-label">{s.label}</span>
            <span className="counter-value">{String(stats[s.key]).padStart(2, "0")}</span>
          </div>
        ))}
      </div>
      <div className="health-bar" role="img" aria-label={`Queue status: ${stats.open} open, ${stats.in_progress} in progress, ${stats.closed} closed`}>
        {total === 0 ? (
          <div className="health-segment segment-empty" style={{ flexGrow: 1 }} />
        ) : (
          SEGMENTS.map((s) => {
            const count = stats[s.key];
            if (count === 0) return null;
            return <div key={s.key} className={`health-segment ${s.className}`} style={{ flexGrow: count }} />;
          })
        )}
      </div>
    </div>
  );
}
