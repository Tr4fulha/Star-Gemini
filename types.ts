export type Screen = 'menu' | 'shop' | 'options' | 'credits' | 'ship-select' | 'game' | 'game-over';

export interface PlayerData {
  scrap: number;
  highScore: number;
  inventory: string[]; // IDs of purchased upgrades
}

export interface ShipConfig {
  id: string;
  name: string;
  color: string;
  speed: number;
  power: number;
  health: number;
  description: string;
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
}