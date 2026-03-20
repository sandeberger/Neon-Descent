import type { AABB } from '@entities/Entity';
import { SPATIAL_CELL_SIZE } from '@core/Constants';

export class CollisionSystem {
  private cellSize: number;
  private grid = new Map<number, number[]>(); // cell key → entity indices
  private boundsCache: AABB[] = [];

  constructor(cellSize: number = SPATIAL_CELL_SIZE) {
    this.cellSize = cellSize;
  }

  /** Rebuild the spatial grid from a list of AABB bounds */
  rebuild(bounds: AABB[]): void {
    this.grid.clear();
    this.boundsCache = bounds;

    for (let i = 0; i < bounds.length; i++) {
      const b = bounds[i]!;
      const keys = this.getCellKeys(b);
      for (const key of keys) {
        let cell = this.grid.get(key);
        if (!cell) {
          cell = [];
          this.grid.set(key, cell);
        }
        cell.push(i);
      }
    }
  }

  /** Find all indices whose AABB overlaps the query */
  query(aabb: AABB): number[] {
    const results: number[] = [];
    const seen = new Set<number>();
    const keys = this.getCellKeys(aabb);

    for (const key of keys) {
      const cell = this.grid.get(key);
      if (!cell) continue;
      for (const idx of cell) {
        if (seen.has(idx)) continue;
        seen.add(idx);
        if (this.aabbOverlap(aabb, this.boundsCache[idx]!)) {
          results.push(idx);
        }
      }
    }
    return results;
  }

  private getCellKeys(aabb: AABB): number[] {
    const keys: number[] = [];
    const x0 = Math.floor(aabb.x / this.cellSize);
    const y0 = Math.floor(aabb.y / this.cellSize);
    const x1 = Math.floor((aabb.x + aabb.w) / this.cellSize);
    const y1 = Math.floor((aabb.y + aabb.h) / this.cellSize);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        keys.push(y * 10000 + x);
      }
    }
    return keys;
  }

  private aabbOverlap(a: AABB, b: AABB): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }
}

/** Check overlap between two AABBs */
export function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
