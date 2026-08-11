import type { Stats } from "./api";

interface Props {
  stats: Stats | null;
}

export function StatsBar({ stats }: Props) {
  if (!stats) return null;

  return (
    <div className="stats-bar">
      <span className="stat">Open: {stats.open}</span>
      <span className="stat">In progress: {stats.in_progress}</span>
      <span className="stat">Closed: {stats.closed}</span>
    </div>
  );
}
