"use client";

import { useEffect, useRef } from "react";

const CELL = 16; // px, marching-squares grid spacing
const LEVELS = 7; // contour bands
const DOT_SPACING = 5; // px between stipple dots along a contour
const REDRAW_INTERVAL = 140; // ms, deliberately slow/glacial motion

type Point = [number, number];

function makeNoise3() {
  function hash(x: number, y: number, z: number): number {
    const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
    return s - Math.floor(s);
  }
  function fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  return function noise3(x: number, y: number, z: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const u = fade(x - xi);
    const v = fade(y - yi);
    const w = fade(z - zi);

    const x00 = lerp(hash(xi, yi, zi), hash(xi + 1, yi, zi), u);
    const x10 = lerp(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u);
    const x01 = lerp(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u);
    const x11 = lerp(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u);

    const y0 = lerp(x00, x10, v);
    const y1 = lerp(x01, x11, v);

    return lerp(y0, y1, w);
  };
}

function fbm(
  noise3: (x: number, y: number, z: number) => number,
  x: number,
  y: number,
  t: number
): number {
  const a = noise3(x * 0.004, y * 0.004, t * 0.01);
  const b = noise3(x * 0.009 + 100, y * 0.009 + 100, t * 0.017);
  return a * 0.7 + b * 0.3;
}

function stipple(ctx: CanvasRenderingContext2D, a: Point, b: Point) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.floor(len / DOT_SPACING));
  for (let s = 0; s <= steps; s++) {
    const px = a[0] + (dx * s) / steps;
    const py = a[1] + (dy * s) / steps;
    ctx.fillRect(px - 0.5, py - 0.5, 1, 1);
  }
}

export function SiteBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const noise3 = makeNoise3();
    const startTime = performance.now();

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let lastDraw = 0;

    function resize() {
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t: number) {
      const color =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--muted")
          .trim() || "#9a9385";

      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = color;
      ctx!.globalAlpha = 0.22;

      const cols = Math.ceil(width / CELL) + 1;
      const rows = Math.ceil(height / CELL) + 1;
      const values = new Float32Array(cols * rows);

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          values[j * cols + i] = fbm(noise3, i * CELL, j * CELL, t);
        }
      }

      const val = (i: number, j: number) => values[j * cols + i];

      for (let lvl = 1; lvl <= LEVELS; lvl++) {
        const threshold = lvl / (LEVELS + 1);

        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const tl = val(i, j);
            const tr = val(i + 1, j);
            const br = val(i + 1, j + 1);
            const bl = val(i, j + 1);

            const caseIdx =
              (tl >= threshold ? 8 : 0) |
              (tr >= threshold ? 4 : 0) |
              (br >= threshold ? 2 : 0) |
              (bl >= threshold ? 1 : 0);

            if (caseIdx === 0 || caseIdx === 15) continue;

            const x0 = i * CELL;
            const y0 = j * CELL;

            const N: Point = [x0 + ((threshold - tl) / (tr - tl)) * CELL, y0];
            const E: Point = [x0 + CELL, y0 + ((threshold - tr) / (br - tr)) * CELL];
            const S: Point = [x0 + ((threshold - bl) / (br - bl)) * CELL, y0 + CELL];
            const W: Point = [x0, y0 + ((threshold - tl) / (bl - tl)) * CELL];

            switch (caseIdx) {
              case 1:
                stipple(ctx!, W, S);
                break;
              case 2:
                stipple(ctx!, S, E);
                break;
              case 3:
                stipple(ctx!, W, E);
                break;
              case 4:
                stipple(ctx!, N, E);
                break;
              case 5:
                stipple(ctx!, N, E);
                stipple(ctx!, W, S);
                break;
              case 6:
                stipple(ctx!, N, S);
                break;
              case 7:
                stipple(ctx!, N, W);
                break;
              case 8:
                stipple(ctx!, N, W);
                break;
              case 9:
                stipple(ctx!, N, S);
                break;
              case 10:
                stipple(ctx!, N, W);
                stipple(ctx!, S, E);
                break;
              case 11:
                stipple(ctx!, N, E);
                break;
              case 12:
                stipple(ctx!, W, E);
                break;
              case 13:
                stipple(ctx!, S, E);
                break;
              case 14:
                stipple(ctx!, W, S);
                break;
            }
          }
        }
      }

      ctx!.globalAlpha = 1;
    }

    function tick(now: number) {
      if (now - lastDraw >= REDRAW_INTERVAL) {
        lastDraw = now;
        draw((now - startTime) / 1000);
      }
      if (!prefersReducedMotion) {
        animationFrame = requestAnimationFrame(tick);
      }
    }

    function handleResize() {
      resize();
      draw((performance.now() - startTime) / 1000);
    }

    resize();
    draw(0);
    if (!prefersReducedMotion) {
      animationFrame = requestAnimationFrame(tick);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="sm-site-canvas" aria-hidden="true" />;
}
