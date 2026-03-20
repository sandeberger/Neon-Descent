import enemiesData from '@data/enemies.json';
const enemyArray = enemiesData;
export const ENEMY_STATS = new Map(enemyArray.map(e => [e.id, e]));
export function getEnemyStats(id) {
    const stats = ENEMY_STATS.get(id);
    if (!stats)
        throw new Error(`Unknown enemy id: ${id}`);
    return stats;
}
