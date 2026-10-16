export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** normalized 0..1 progress of p inside [a,b] */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: number[], b: number[], t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Piecewise keyframes: [[p, value[]], ...] → eased interpolation. Deterministic & reversible. */
export function keyframes(p: number, frames: [number, number[]][]): [number, number, number] {
  if (p <= frames[0][0]) return frames[0][1] as [number, number, number];
  for (let i = 0; i < frames.length - 1; i++) {
    const [p0, v0] = frames[i];
    const [p1, v1] = frames[i + 1];
    if (p <= p1) return lerp3(v0, v1, ease(seg(p, p0, p1)));
  }
  return frames[frames.length - 1][1] as [number, number, number];
}
