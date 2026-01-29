export type Screen = 'menu' | 'shop' | 'options' | 'credits' | 'ship-select' | 'game' | 'game-over' | 'leaderboard';

export interface PlayerData {
  username?: string; // Nome do jogador
  scrap: number;
  highScore: number;
  inventory: string[]; // IDs dos upgrades comprados
}

export interface Profile {
  id: string;
  username?: string; // Nome do jogador no banco
  high_score: number;
  scrap: number;
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