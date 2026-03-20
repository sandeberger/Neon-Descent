import type { ChunkTemplate } from './ChunkTemplate';
import { CHUNK_COLS, CHUNK_ROWS, TILE_SIZE, CHUNK_HEIGHT } from '@core/Constants';
import { TileType } from './ChunkTemplate';

export class Chunk {
  readonly template: ChunkTemplate;
  readonly worldY: number;      // top edge in world coordinates
  readonly biomeId: string;
  spawned = false;               // whether enemies/pickups have been placed

  // Mutable copy of the tile grid — tiles can be destroyed at runtime
  private grid: number[][];

  // Durability for breakable tiles (defaults to 1 if not set)
  private durability: Map<number, number> = new Map();

  constructor(template: ChunkTemplate, worldY: number, biomeId: string) {
    this.template = template;
    this.worldY = worldY;
    this.biomeId = biomeId;

    // Deep copy the template grid so runtime changes don't mutate templates
    this.grid = template.grid.map(row => [...row]);

    // Initialize durability for breakable tiles
    for (let r = 0; r < CHUNK_ROWS; r++) {
      for (let c = 0; c < CHUNK_COLS; c++) {
        if (this.grid[r]?.[c] === TileType.BREAKABLE) {
          this.durability.set(r * CHUNK_COLS + c, 3);
        }
      }
    }
  }

  get bottom(): number {
    return this.worldY + CHUNK_HEIGHT;
  }

  /** Get tile type at grid position */
  getTile(col: number, row: number): TileType {
    if (col < 0 || col >= CHUNK_COLS || row < 0 || row >= CHUNK_ROWS) {
      return TileType.EMPTY;
    }
    return (this.grid[row]?.[col] ?? TileType.EMPTY) as TileType;
  }

  /** Get tile at world position (returns EMPTY if outside this chunk) */
  getTileAtWorld(wx: number, wy: number): TileType {
    const localY = wy - this.worldY;
    if (localY < 0 || localY >= CHUNK_HEIGHT) return TileType.EMPTY;
    const col = Math.floor(wx / TILE_SIZE);
    const row = Math.floor(localY / TILE_SIZE);
    return this.getTile(col, row);
  }

  /** Get world rect for a tile at grid position */
  getTileRect(col: number, row: number): { x: number; y: number; w: number; h: number } {
    return {
      x: col * TILE_SIZE,
      y: this.worldY + row * TILE_SIZE,
      w: TILE_SIZE,
      h: TILE_SIZE,
    };
  }

  /** Damage a breakable tile. Returns true if the tile was destroyed. */
  damageTile(col: number, row: number, amount: number = 1): boolean {
    if (col < 0 || col >= CHUNK_COLS || row < 0 || row >= CHUNK_ROWS) return false;
    const tile = this.grid[row]?.[col];
    if (tile !== TileType.BREAKABLE) return false;

    const key = row * CHUNK_COLS + col;
    const hp = (this.durability.get(key) ?? 1) - amount;
    if (hp <= 0) {
      this.grid[row]![col] = TileType.EMPTY;
      this.durability.delete(key);
      return true;
    }
    this.durability.set(key, hp);
    return false;
  }

  /** Get remaining durability of a breakable tile (0 if not breakable) */
  getTileDurability(col: number, row: number): number {
    const key = row * CHUNK_COLS + col;
    return this.durability.get(key) ?? 0;
  }

  /** Set a tile to empty (for instant destruction) */
  clearTile(col: number, row: number): void {
    if (col < 0 || col >= CHUNK_COLS || row < 0 || row >= CHUNK_ROWS) return;
    this.grid[row]![col] = TileType.EMPTY;
    this.durability.delete(row * CHUNK_COLS + col);
  }
}
