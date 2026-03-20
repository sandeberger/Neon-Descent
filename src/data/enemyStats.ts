import enemiesData from '@data/enemies.json';
import type { EnemyStatData } from '@data/types';

const enemyArray = enemiesData as EnemyStatData[];
export const ENEMY_STATS = new Map<string, EnemyStatData>(
  enemyArray.map(e => [e.id, e]),
);

export function getEnemyStats(id: string): EnemyStatData {
  const stats = ENEMY_STATS.get(id);
  if (!stats) throw new Error(`Unknown enemy id: ${id}`);
  return stats;
}
