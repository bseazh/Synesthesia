export interface Point {
  x: number;
  y: number;
}

export enum ShapeType {
  CIRCLE = 'CIRCLE',
  SQUARE = 'SQUARE',
  TRIANGLE = 'TRIANGLE',
  LINE_BURST = 'LINE_BURST',
  CONFETTI = 'CONFETTI',
  RIPPLE = 'RIPPLE'
}

export interface AnimationObject {
  id: string;
  type: ShapeType;
  color: string;
  x: number;
  y: number;
  isDead: boolean;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export interface KeyConfig {
  key: string;
  color: string;
  soundNote?: string;
  shape: ShapeType;
}

export interface SoundState {
  isPlaying: boolean;
  instrumentMode: 'synth' | 'percussion';
  volume: number;
}

// --- Game Mode Types ---

export interface SongNote {
  time: number; // Time in seconds
  key: string; // The keyboard key (a, s, d...)
  duration: number;
  laneIndex?: number; // 0-6 for the 7-key mode
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  notes: SongNote[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  audioBuffer?: AudioBuffer; // For custom uploads
  sourceType: 'PRESET' | 'UPLOAD';
}

export type HitRating = 'EXCELLENT' | 'GREAT' | 'GOOD' | 'MISS';

export interface GameTarget {
  id: string;
  key: string;
  x: number;
  y: number;
  spawnTime: number;
  hitTime: number; // When it should be hit
  isHit: boolean;
  isMissed: boolean;
  color: string;
  laneIndex?: number; // For lane mode
}

export interface GameState {
  isPlaying: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  health: number; // 0-100
  accuracy: number;
  lastRating?: HitRating; // For UI feedback
}