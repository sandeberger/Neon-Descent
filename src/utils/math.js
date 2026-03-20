export const clamp = (v, min, max) => v < min ? min : v > max ? max : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const remap = (v, inMin, inMax, outMin, outMax) => outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
export const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
export const norm = (v) => {
    const m = Math.hypot(v.x, v.y);
    return m > 0 ? { x: v.x / m, y: v.y / m } : { x: 0, y: 0 };
};
export const dot = (a, b) => a.x * b.x + a.y * b.y;
// Scratch vectors to avoid allocations in hot path
export const _v0 = { x: 0, y: 0 };
export const _v1 = { x: 0, y: 0 };
