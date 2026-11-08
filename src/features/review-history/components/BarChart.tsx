import type { CSSProperties } from 'react';
export type ChartPoint = {
  key: string;
  label: string;
  value: number;
  description: string;
  special?: boolean;
};

export function BarChart({
  label,
  points,
  unit,
  selected,
  onSelect,
}: {
  label: string;
  points: ChartPoint[];
  unit: string;
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  const max = Math.max(
    1,
    ...points.filter((p) => !p.special).map((p) => p.value),
  );
  return (
    <div
      className="admin-chart-scroll"
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      <div
        className={`admin-chart${points[0]?.special ? ' admin-chart-daily' : ''}`}
        style={
          {
            '--columns': points.length,
            ...(points[0]?.special
              ? {
                  gridTemplateColumns: `64px repeat(${points.length - 1}, minmax(28px, 1fr))`,
                }
              : {}),
          } as CSSProperties
        }
      >
        {points.map((point) => (
          <button
            key={point.key}
            className={`admin-bar${point.special ? ' admin-bar-special' : ''}`}
            aria-label={`${point.label}: ${point.value} ${unit}`}
            title={point.description}
            aria-pressed={selected === point.key}
            onClick={() => onSelect(point.key)}
          >
            <span className="admin-bar-plot">
              <span
                className="admin-bar-fill"
                style={{
                  height: `${point.special ? (point.value > 0 ? 100 : 0) : (point.value / max) * 100}%`,
                }}
              />
              <strong>{point.value}</strong>
            </span>
            <span className="admin-bar-label">{point.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
