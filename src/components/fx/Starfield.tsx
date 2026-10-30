import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface Star {
  x: number;
  y: number;
  depth: number;
  radius: number;
  phase: number;
  speed: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

// Скопление Плеяд относительно Альционы: [dx, dy, яркость]
const PLEIADES: [number, number, number][] = [
  [0, 0, 2.8],
  [-0.24, 0.04, 1.7],
  [-0.23, -0.01, 1.3],
  [0.12, 0.1, 1.6],
  [0.3, -0.02, 1.7],
  [0.24, -0.14, 1.5],
  [0.32, -0.26, 1.4],
];
const METEOR_CHANCE_PER_FRAME = 0.012;
// Полоса под прозрачной шапкой: метеоры там не рисуем, чтобы не пролетали через меню
const HEADER_CLEARANCE = 84;
// Уже этой ширины скопление Плеяд не показываем — на телефоне оно ложится на обложку
const PLEIADES_MIN_WIDTH = 768;
const MAX_DPR = 2;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

interface StarfieldProps {
  className?: string;
}

/**
 * Ночное небо на canvas: мерцающие звёзды в три глубины, Плеяды с подписанной Альционой,
 * редкие метеоры. Клик по небу — звездопад. Вне экрана и в фоновой вкладке не рисует,
 * при «Уменьшить движение» остаётся статичной картинкой.
 */
export function Starfield({ className = "" }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const { t } = useTranslation();
  const label = `η Tau · ${t("stars.alcyone")} · ${t("stars.magnitude")}`;
  // Подпись читаем из ref, чтобы смена языка не пересобирала всю сцену
  const labelRef = useRef(label);
  useEffect(() => {
    labelRef.current = label;
  }, [label]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let pointerX = 0.5;
    let pointerY = 0.5;
    let raf = 0;
    let onScreen = true;
    let alive = true;
    const timers: number[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rand = seededRandom(11);
      const count = Math.min(440, Math.round((width * height) / (width < 640 ? 3600 : 2400)));
      stars = Array.from({ length: count }, () => ({
        x: rand() * width,
        y: rand() * height,
        depth: rand() * 0.8 + 0.2,
        radius: rand() * 1.1 + 0.25,
        phase: rand() * Math.PI * 2,
        speed: 0.4 + rand() * 1.4,
      }));
    };

    const spawn = (x?: number, y?: number) => {
      meteors.push({
        x: x ?? width * 0.25 + Math.random() * width * 0.85,
        y: y ?? -10,
        vx: -(2.2 + Math.random() * 2.4),
        vy: 2.6 + Math.random() * 2.6,
        life: 0,
        maxLife: 55 + Math.random() * 45,
      });
    };

    // Скопление в правом верхнем углу, подпись — под ним, справа: так оно не задевает текст
    const drawPleiades = (t: number, px: number, py: number) => {
      if (width < PLEIADES_MIN_WIDTH) return;
      const scale = Math.min(width, height) * 0.32;
      const cx = width - Math.min(260, width * 0.2) + px * 24;
      const cy = 150 + py * 16;
      PLEIADES.forEach(([dx, dy, brightness], i) => {
        const x = cx + dx * scale;
        const y = cy + dy * scale;
        const pulse = reduced ? 1 : 1 + 0.12 * Math.sin(t * 0.0016 + i);
        const glowRadius = brightness * 9 * pulse;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        glow.addColorStop(0, "rgba(210,225,255,.55)");
        glow.addColorStop(1, "rgba(210,225,255,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f4f7ff";
        ctx.beginPath();
        ctx.arc(x, y, brightness * 0.75, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#c9a45c";
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.textAlign = "right";
      ctx.fillText(labelRef.current, cx + 0.34 * scale, cy + 0.1 * scale + 28);
      ctx.textAlign = "left";
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      const px = pointerX - 0.5;
      const py = pointerY - 0.5;

      ctx.fillStyle = "#dce6ff";
      for (const s of stars) {
        const twinkle = reduced ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.speed + s.phase);
        ctx.globalAlpha = twinkle * s.depth;
        ctx.beginPath();
        ctx.arc(
          s.x + px * s.depth * 22,
          s.y + py * s.depth * 14,
          s.radius * s.depth,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      drawPleiades(t, px, py);
      ctx.globalAlpha = 1;

      if (!reduced && Math.random() < METEOR_CHANCE_PER_FRAME) spawn();
      meteors = meteors.filter((m) => m.life < m.maxLife);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, HEADER_CLEARANCE, width, height - HEADER_CLEARANCE);
      ctx.clip();
      for (const m of meteors) {
        m.life++;
        m.x += m.vx;
        m.y += m.vy;
        const alpha = 1 - m.life / m.maxLife;
        const tailX = m.x - m.vx * 16;
        const tailY = m.y - m.vy * 16;
        const trail = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        trail.addColorStop(0, `rgba(255,238,196,${alpha})`);
        trail.addColorStop(1, "rgba(255,238,196,0)");
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }
      ctx.restore();
    };

    const loop = (t: number) => {
      draw(t);
      raf = onScreen && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (reduced) {
        draw(0);
        return;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const handleResize = () => {
      resize();
      if (reduced) draw(0);
    };
    const handlePointerMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointerX = (e.clientX - box.left) / box.width;
      pointerY = (e.clientY - box.top) / box.height;
    };
    // Клик по пустому небу (не по ссылке или кнопке) — звездопад
    const handleClick = (e: MouseEvent) => {
      if (reduced || (e.target as HTMLElement).closest("a, button")) return;
      const box = canvas.getBoundingClientRect();
      for (let i = 0; i < 7; i++) {
        const id = window.setTimeout(
          () =>
            spawn(
              e.clientX - box.left + 120 + Math.random() * 120,
              e.clientY - box.top - 160 - Math.random() * 60,
            ),
          i * 90,
        );
        timers.push(id);
      }
    };
    const handleVisibility = () => {
      if (!document.hidden) start();
    };

    resize();
    start();
    // Подпись рисуется шрифтом JetBrains Mono — перерисовываем, когда он загрузится
    document.fonts?.ready.then(() => {
      if (alive && reduced) draw(0);
    });

    const host = canvas.parentElement;
    host?.addEventListener("pointermove", handlePointerMove);
    host?.addEventListener("click", handleClick);
    // Следим за размером самого холста: первый экран меняет высоту, когда грузятся шрифты
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
    });
    observer.observe(canvas);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      observer.disconnect();
      resizeObserver.disconnect();
      host?.removeEventListener("pointermove", handlePointerMove);
      host?.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 size-full ${className}`}
    />
  );
}
