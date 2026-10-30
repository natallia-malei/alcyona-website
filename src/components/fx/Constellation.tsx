import { useTranslation } from "react-i18next";

// Плеяды: Альциона в центре, Атлас и Плейона слева, Меропа, Электра, Майя и Тайгета справа
const STARS: { x: number; y: number; r: number }[] = [
  { x: 0, y: 0, r: 6 },
  { x: -96, y: 16, r: 4 },
  { x: -92, y: -4, r: 2.6 },
  { x: 48, y: 40, r: 3.8 },
  { x: 120, y: -8, r: 4.2 },
  { x: 96, y: -56, r: 3.6 },
  { x: 128, y: -104, r: 3.4 },
];

interface ConstellationProps {
  className?: string;
}

/** Созвездие Плеяд: линии прорисовываются при прокрутке, звёзды мерцают. */
export function Constellation({ className = "" }: ConstellationProps) {
  const { t } = useTranslation();
  return (
    <svg
      viewBox="-150 -140 340 230"
      aria-hidden="true"
      className={`constellation pointer-events-none overflow-visible ${className}`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1" className="text-accent/60">
        <polyline
          className="constellation-line"
          pathLength={1}
          points="-92,-4 -96,16 0,0 48,40 120,-8 96,-56 0,0"
        />
        <polyline className="constellation-line" pathLength={1} points="96,-56 128,-104" />
      </g>
      <circle r="18" className="fill-star/15" />
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          className="twinkle fill-star"
          style={{ animationDelay: `${(i * 0.7) % 2.8}s` }}
        />
      ))}
      <text
        x="-14"
        y="-12"
        textAnchor="end"
        className="fill-accent font-mono text-[9px] tracking-[0.12em]"
      >
        {t("stars.alcyone").toUpperCase()} · η TAU
      </text>
    </svg>
  );
}
