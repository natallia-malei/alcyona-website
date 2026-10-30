import type { PointerEvent } from "react";
import { useReducedMotion } from "./useReducedMotion";

const MAX_TILT_DEG = 22;

/**
 * Наклон элемента за курсором: пишет CSS-переменные --rx/--ry (поворот)
 * и --gx/--gy (точка блика), остальное делает класс `.relic`.
 */
export function usePointerTilt() {
  const reduced = useReducedMotion();

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType === "touch") return;
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    el.style.transition = "transform .08s linear";
    el.style.setProperty("--ry", `${((x - 0.5) * MAX_TILT_DEG).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - y) * MAX_TILT_DEG * 0.8).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  };

  const onPointerLeave = (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.transition = "";
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--gx", "50%");
    el.style.setProperty("--gy", "30%");
  };

  return { onPointerMove, onPointerLeave };
}
