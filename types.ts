export type Screen = 'menu' | 'shop' | 'options' | 'credits' | 'ship-select' | 'game' | 'game-over' | 'leaderboard';

export interface PlayerData {
  username?: string;
  scrap: number;
  highScore: number;
  inventory: string[];
  level: number;
  currentXp: number;
  maxWave: number;
}

export interface Profile {
  id: string;
  username?: string;
  high_score: number;
  scrap: number;
  inventory: string[];
  level?: number;
  current_xp?: number;
  max_wave?: number;
}

export interface ShipConfig {
  id: string;
  name: string;
  color: string;
  speed: number;
  power: number;
  health: number;
  description: string;
  unlockWave: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export interface GameResult {
  score: number;
  scrapCollected: number;
  survivedWaves: number;
  xpGained: number;
}

// Internal Game Types
export type PowerUpType = 'health' | 'triple_shot' | 'rapid_fire' | 'shield' | 'missile' | 'laser' | 'nuke' | 'wingman' | 'kamikaze_drones' | 'battery';

export type EnemyType = 'scout' | 'fighter' | 'tank' | 'sniper' | 'swarm' | 'mine' | 'boss_minion';