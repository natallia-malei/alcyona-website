interface MarqueeProps {
  items: string[];
}

/** Бегущая строка под шапкой: названия песен через ✦. Декоративная, экранным чтецам не видна. */
export function Marquee({ items }: MarqueeProps) {
  if (items.length === 0) return null;
  // Половина ленты должна быть шире экрана: повторяем названия минимум до 16 штук
  const copies = Math.max(2, Math.ceil(16 / items.length));
  const loop = Array.from({ length: copies }, () => items).flat();
  // Две одинаковые половины: сдвиг на -50% даёт бесшовный круг
  return (
    <div aria-hidden="true" className="overflow-hidden border-y border-line bg-bg-elevated">
      <div className="marquee-track flex w-max">
        {[...loop, ...loop].map((item, i) => (
          <span
            key={i}
            className="whitespace-nowrap py-4 font-mono text-xs uppercase tracking-[0.3em] text-accent"
          >
            {item}
            <span className="px-6 text-star">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
