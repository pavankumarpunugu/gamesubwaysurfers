export type GameStatus = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type CharacterId = 'jake' | 'tricky' | 'fresh';
export type HoverboardId = 'sunset' | 'cyber' | 'monster';

export type PowerUpType = 'magnet' | 'jetpack' | 'sneakers' | 'multiplier';

export interface PowerUpState {
  type: PowerUpType;
  duration: number; // total duration in seconds
  timeLeft: number; // remaining seconds
  level: number; // upgrade level 1-5
}

export interface PlayerStats {
  score: number;
  highScore: number;
  coins: number;
  totalCoins: number;
  distance: number;
  multiplier: number;
}

export interface Upgrades {
  magnetLevel: number;
  jetpackLevel: number;
  sneakersLevel: number;
  multiplierLevel: number;
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  tagline: string;
  hatColor: string;
  shirtColor: string;
  pantsColor: string;
  shoesColor: string;
  skinColor: string;
  price: number;
  unlocked: boolean;
}

export interface HoverboardConfig {
  id: HoverboardId;
  name: string;
  deckColor: string;
  accentColor: string;
  trailColor: string;
  price: number;
  unlocked: boolean;
}
