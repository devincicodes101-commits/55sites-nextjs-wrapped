import type { Stat } from "@/lib/types";

export default function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="stats-row">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <div className="stat-n">{stat.value}</div>
          <div className="stat-l">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
