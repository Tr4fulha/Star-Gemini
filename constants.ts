import { ShipConfig, Upgrade } from './types';

export const SHIPS: ShipConfig[] = [
  {
    id: 'core',
    name: 'CORE',
    color: '#00f0ff',
    speed: 5,
    power: 1,
    health: 3,
    description: 'Balanced stats. Reliable for any mission.',
    unlockWave: 0
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    color: '#a855f7',
    speed: 7,
    power: 0.8,
    health: 2,
    description: 'High mobility. Unlocked at Wave 10.',
    unlockWave: 10
  },
  {
    id: 'striker',
    name: 'STRIKER',
    color: '#ef4444',
    speed: 4,
    power: 1.5,
    health: 4,
    description: 'Heavy firepower. Unlocked at Wave 20.',
    unlockWave: 20
  }
];

export const UPGRADES: Upgrade[] = [
  {
    id: 'reinforced_hull',
    name: 'REINFORCED HULL',
    description: 'Start mission with +1 Life.',
    cost: 500,
    icon: 'shield'
  },
  {
    id: 'weapon_preheat',
    name: 'WEAPON PRE-HEAT',
    description: 'Start with higher weapon power level.',
    cost: 1000,
    icon: 'flame'
  },
  {
    id: 'gravity_well',
    name: 'GRAVITY WELL',
    description: 'Increase item collection range.',
    cost: 300,
    icon: 'magnet'
  },
  {
    id: 'thruster_coolant',
    name: 'THRUSTER COOLANT',
    description: 'Reduce Dash cooldown time.',
    cost: 400,
    icon: 'wind'
  },
  {
    id: 'data_mining',
    name: 'DATA MINING',
    description: 'Increase score gain by 10%.',
    cost: 600,
    icon: 'database'
  }
];