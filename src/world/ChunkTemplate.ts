export const enum TileType {
  EMPTY     = 0,
  SOLID     = 1,
  PLATFORM  = 2,
  HAZARD    = 3,
  BREAKABLE = 4,
  BOUNCE    = 5,
  ACID_POOL = 6,
  LASER     = 7,
  DARKNESS  = 8,
}

export type ChunkCategory =
  | 'intro'
  | 'traversal'
  | 'combat'
  | 'hazard'
  | 'loot'
  | 'recovery'
  | 'event'
  | 'shop'
  | 'elite'
  | 'miniboss'
  | 'boss'
  | 'transition';

export interface SpawnPoint {
  col:   number;
  row:   number;
  type:  'enemy' | 'pickup' | 'hazard';
  id?:   string;
}

export interface ChunkTemplate {
  id:         string;
  category:   ChunkCategory;
  difficulty: number;       // 0–1
  intensity:  number;       // 0–1
  grid:       number[][];   // CHUNK_ROWS × CHUNK_COLS
  spawns:     SpawnPoint[];
  tags:       string[];
  biomes?:    string[];     // which biomes can use this (undefined = all)
}
