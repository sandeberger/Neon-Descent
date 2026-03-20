import type { ChunkTemplate } from './ChunkTemplate';
import { TileType } from './ChunkTemplate';
import type { AntiBullshitSystem } from '@systems/AntiBullshitSystem';
import type { SeededRNG } from '@utils/SeededRNG';

/**
 * Flood-fill path validation: checks that a chunk has at least one
 * traversable path from any column in row 0 to any column in the last row.
 *
 * Traversable tiles: EMPTY, PLATFORM (pass-through), BREAKABLE (stomped through),
 * BOUNCE (lands on, then falls), ACID_POOL (damage but passable), DARKNESS (passable).
 *
 * Movement: down, left, right (player falls downward, can move horizontally).
 * We also allow diagonal down-left/down-right to simulate falling arcs.
 */
function isPassable(tile: number): boolean {
  return tile === TileType.EMPTY
    || tile === TileType.PLATFORM
    || tile === TileType.BREAKABLE
    || tile === TileType.BOUNCE
    || tile === TileType.ACID_POOL
    || tile === TileType.DARKNESS;
}

function hasTraversablePath(grid: number[][]): boolean {
  if (grid.length === 0) return true;
  const rows = grid.length;
  const cols = grid[0]!.length;

  // BFS from all passable cells in row 0
  const visited = new Uint8Array(rows * cols);
  const queue: number[] = [];

  for (let c = 0; c < cols; c++) {
    if (isPassable(grid[0]![c]!)) {
      const idx = c;
      if (!visited[idx]) {
        visited[idx] = 1;
        queue.push(idx);
      }
    }
  }

  // Directions: down, left, right, down-left, down-right
  const dirs = [[1, 0], [0, -1], [0, 1], [1, -1], [1, 1]];

  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++]!;
    const r = Math.floor(idx / cols);
    const c = idx % cols;

    // Reached bottom row?
    if (r === rows - 1) return true;

    for (const [dr, dc] of dirs) {
      const nr = r + dr!;
      const nc = c + dc!;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nIdx = nr * cols + nc;
      if (visited[nIdx]) continue;
      if (!isPassable(grid[nr]![nc]!)) continue;
      visited[nIdx] = 1;
      queue.push(nIdx);
    }
  }

  return false;
}

export class ChunkGenerator {
  private lastTemplateId = '';

  constructor(
    private templates: ChunkTemplate[],
    private rng: SeededRNG,
  ) {
    // Validate all templates at startup and warn about impassable ones
    for (const t of templates) {
      if (!hasTraversablePath(t.grid)) {
        console.warn(`[ChunkGenerator] Template "${t.id}" has no traversable path top→bottom!`);
      }
    }
  }

  next(abs: AntiBullshitSystem, biomeId: string): ChunkTemplate {
    let { pool, weights } = abs.filterAndWeight(this.templates, biomeId);

    // Own rule: no same template back-to-back
    const filtered = pool.filter(t => t.id !== this.lastTemplateId);
    if (filtered.length > 0) {
      const filteredWeights = pool
        .map((t, i) => t.id !== this.lastTemplateId ? weights[i]! : -1)
        .filter(w => w >= 0);
      pool = filtered;
      weights = filteredWeights;
    }

    // Filter out chunks without traversable paths
    const traversable = pool.filter(t => hasTraversablePath(t.grid));
    if (traversable.length > 0) {
      const travWeights = pool
        .map((t, i) => hasTraversablePath(t.grid) ? weights[i]! : -1)
        .filter(w => w >= 0);
      pool = traversable;
      weights = travWeights;
    }

    const choice = this.rng.weightedPick(pool, weights);

    abs.recordChunk(choice.category);
    this.lastTemplateId = choice.id;
    return choice;
  }
}
