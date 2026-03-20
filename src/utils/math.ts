export interface Vec2 {
  x: number;
  y: number;
}

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const remap = (v: number, inMin: number, inMax: number, outMin: number, outMax: number): number =>
  outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);

export const dist = (a: Vec2, b: Vec2): number =>
  Math.hypot(b.x - a.x, b.y - a.y);

export const norm = (v: Vec2): Vec2 => {
  const m = Math.hypot(v.x, v.y);
  return m > 0 ? { x: v.x / m, y: v.y / m } : { x: 0, y: 0 };
};

export const dot = (a: Vec2, b: Vec2): number =>
  a.x * b.x + a.y * b.y;

// Scratch vectors to avoid allocations in hot path
export const _v0: Vec2 = { x: 0, y: 0 };
export const _v1: Vec2 = { x: 0, y: 0 };
