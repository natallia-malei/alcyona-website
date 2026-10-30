import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const VIEW_W = 1440;
const VIEW_H = 400;

function seededRandom(seed: number) {
  let v = seed;
  return () => {
    v = (v * 16807) % 2147483647;
    return v / 2147483647;
  };
}

/** Хребет: плавная ломаная со случайными перепадами. */
function ridge(seed: number, base: number, amp: number): string {
  const rand = seededRandom(seed);
  const points = [`0,${VIEW_H}`];
  let y = base;
  for (let x = 0; x <= VIEW_W; x += 48) {
    y = Math.min(base + amp * 0.4, Math.max(base - amp, y + (rand() - 0.5) * amp * 0.6));
    points.push(`${x},${y.toFixed(1)}`);
  }
  points.push(`${VIEW_W},${VIEW_H}`);
  return points.join(" ");
}

/** Ельник: ёлки разной высоты и ширины, ярусами. */
function forest(seed: number, base: number, minH: number, maxH: number, step: number): string {
  const rand = seededRandom(seed);
  const points = [`0,${VIEW_H}`, `0,${base}`];
  for (let x = 0; x < VIEW_W + step; x += step * (0.7 + rand() * 0.6)) {
    const h = minH + rand() * (maxH - minH);
    const w = h * (0.28 + rand() * 0.1);
    const top = base - h;
    // Три яруса веток: ступеньки по бокам ствола
    points.push(
      `${(x - w).toFixed(1)},${base}`,
      `${(x - w * 0.45).toFixed(1)},${(top + h * 0.62).toFixed(1)}`,
      `${(x - w * 0.7).toFixed(1)},${(top + h * 0.62).toFixed(1)}`,
      `${(x - w * 0.25).toFixed(1)},${(top + h * 0.3).toFixed(1)}`,
      `${(x - w * 0.45).toFixed(1)},${(top + h * 0.3).toFixed(1)}`,
      `${x.toFixed(1)},${top.toFixed(1)}`,
      `${(x + w * 0.45).toFixed(1)},${(top + h * 0.3).toFixed(1)}`,
      `${(x + w * 0.25).toFixed(1)},${(top + h * 0.3).toFixed(1)}`,
      `${(x + w * 0.7).toFixed(1)},${(top + h * 0.62).toFixed(1)}`,
      `${(x + w * 0.45).toFixed(1)},${(top + h * 0.62).toFixed(1)}`,
      `${(x + w).toFixed(1)},${base}`,
    );
  }
  points.push(`${VIEW_W},${base}`, `${VIEW_W},${VIEW_H}`);
  return points.join(" ");
}

// Считаем один раз: форма не меняется
const FAR_RIDGE = ridge(5, 200, 70);
const MID_FOREST = forest(7, 330, 60, 120, 44);
const NEAR_FOREST = forest(13, 372, 90, 170, 58);

// Насколько далеко смещается слой за весь проход секции через экран, px
const LAYER_TRAVEL = 300;

interface ParallaxDividerProps {
  /** Заголовок, который выходит из тумана */
  children: ReactNode;
}

/**
 * Перебивка между секциями: небо, луна, хребты и туман двигаются с разной скоростью,
 * заголовок поднимается из тумана. При «Уменьшить движение» — статичная картинка.
 */
export function ParallaxDivider({ children }: ParallaxDividerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-speed]"));
    const title = root.querySelector<HTMLElement>("[data-title]");
    let queued = false;

    const update = () => {
      queued = false;
      const box = root.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 — секция только показалась снизу, 1 — ушла за верх экрана
      const progress = Math.min(1, Math.max(0, (vh - box.top) / (vh + box.height)));
      for (const layer of layers) {
        const speed = Number(layer.dataset.speed);
        layer.style.transform = `translate3d(0, ${((progress - 0.5) * speed * LAYER_TRAVEL).toFixed(1)}px, 0)`;
      }
      if (title) {
        const shown = Math.min(1, Math.max(0, (progress - 0.05) / 0.25));
        title.style.opacity = (0.2 + 0.8 * shown).toFixed(2);
        title.style.transform = `translateY(${((1 - shown) * 40).toFixed(1)}px)`;
      }
    };
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className="relative h-80 overflow-hidden md:h-[460px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-bg via-[#14152c] to-[#3a2232]"
      />
      <div
        aria-hidden="true"
        data-speed="0.3"
        className="absolute left-[80%] top-[8%] size-10 will-change-transform md:left-[70%] md:top-[22%] md:size-20"
      >
        <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(236,208,147,.18),transparent_65%)]" />
        <div className="relative size-full rounded-full bg-[radial-gradient(circle_at_36%_34%,#fbf3dc_0%,#f3e6c4_35%,#c9a45c_80%,#8f6e33_100%)] shadow-[inset_-6px_-8px_14px_rgba(60,40,10,.45)]" />
      </div>
      <svg
        aria-hidden="true"
        data-speed="-0.12"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[80%] w-full will-change-transform"
      >
        <polygon fill="#1d1b33" points={FAR_RIDGE} />
      </svg>
      <div aria-hidden="true" className="fog absolute -inset-x-[10%] bottom-20 h-48" />
      <svg
        aria-hidden="true"
        data-speed="-0.25"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[62%] w-full opacity-60 will-change-transform"
      >
        <polygon fill="#14142a" points={MID_FOREST} />
      </svg>
      <svg
        aria-hidden="true"
        data-speed="-0.4"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 -bottom-1 h-[50%] w-full will-change-transform"
      >
        <polygon fill="#0a0c14" points={NEAR_FOREST} />
      </svg>
      <div
        data-title
        className="absolute inset-x-0 top-[30%] flex flex-col items-center px-4 text-center [text-shadow:0_4px_30px_rgba(0,0,0,.7)]"
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-bg to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-12 bg-linear-to-t from-bg to-transparent"
      />
    </div>
  );
}
