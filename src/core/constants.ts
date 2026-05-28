import type { Phase } from './types';

export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 680;
export const WORLD_X = 262;
export const WORLD_Y = 160;
export const WORLD_WIDTH = 500;
export const WORLD_HEIGHT = 360;

export const INITIAL_MICE = 8;
export const BABY_AGE = 8;
export const MAX_POPULATION = 3500;
export const TICK_INTERVAL_MS = 80;

export const MATURITY_AGE = 90;
export const REPRODUCTION_COOLDOWN = 1;
export const CHILD_CARE_DURATION = 25;
export const MAX_AGE_TICKS = 730;
export const PREGNANCY_DURATION = 22;

export const RADIUS_DOMINANT = 6;
export const RADIUS_SUBORDINATE = 4;
export const RADIUS_FEMALE = 5;
export const RADIUS_CHILD = 2.5;
export const MOUSE_WANDER_FORCE = 0.4;
export const MOUSE_SPEED = 5;
export const CHASE_SPEED = 19;
export const FLEE_SPEED = 20;
export const CROWD_RADIUS = 35;

export const DENSITY_PHASE_2_THRESHOLD = 0.18;
export const DENSITY_PHASE_3_THRESHOLD = 0.50;

export const HUNGER_DECAY: Record<string, number> = {
  dominant: 0.3, subordinate: 0.2, female: 0.25,
};
export const THIRST_DECAY: Record<string, number> = {
  dominant: 0.25, subordinate: 0.18, female: 0.2,
};
export const PREGNANT_DECAY_MULT = 1.5;
export const SEEK_THRESHOLD = 50;
export const SEEK_SPEED = 12;
export const EAT_TICKS = 6;
export const DRINK_TICKS = 5;
export const RESTORE_PER_TICK = 18;

export interface SourcePos { type: 'food' | 'water'; x: number; y: number; }

const CX = WORLD_X + WORLD_WIDTH / 2;
const CY = WORLD_Y + WORLD_HEIGHT / 2;

export const RESOURCE_SOURCES: SourcePos[] = [
  { type: 'water', x: WORLD_X + WORLD_WIDTH - 110, y: WORLD_Y + 45 },
  { type: 'food', x: WORLD_X + WORLD_WIDTH - 45, y: WORLD_Y + 45 },
  { type: 'water', x: WORLD_X + 45, y: WORLD_Y + WORLD_HEIGHT - 45 },
  { type: 'food', x: WORLD_X + 45, y: WORLD_Y + WORLD_HEIGHT - 10 },
  { type: 'water', x: CX - 20, y: CY },
  { type: 'food', x: CX + 20, y: CY },
  { type: 'water', x: WORLD_X + 45, y: WORLD_Y + 45 },
  { type: 'food', x: WORLD_X + 45, y: WORLD_Y + 10 },
  { type: 'water', x: WORLD_X + WORLD_WIDTH - 110, y: WORLD_Y + WORLD_HEIGHT - 45 },
  { type: 'food', x: WORLD_X + WORLD_WIDTH - 45, y: WORLD_Y + WORLD_HEIGHT - 45 },
  { type: 'water', x: CX - 15, y: WORLD_Y + 10 },
  { type: 'food', x: CX + 15, y: WORLD_Y + 10 },
  { type: 'water', x: CX - 15, y: WORLD_Y + WORLD_HEIGHT - 10 },
  { type: 'food', x: CX + 15, y: WORLD_Y + WORLD_HEIGHT - 10 },
  { type: 'water', x: WORLD_X + 10, y: CY - 15 },
  { type: 'food', x: WORLD_X + 10, y: CY + 15 },
  { type: 'water', x: WORLD_X + WORLD_WIDTH - 10, y: CY - 15 },
  { type: 'food', x: WORLD_X + WORLD_WIDTH - 10, y: CY + 15 },
];

export const PHASE_INFO: Record<Phase, { label: string; color: number }> = {
  1: { label: 'Establecimiento', color: 0x2ecc71 },
  2: { label: 'Explotación', color: 0x27ae60 },
  3: { label: 'Estancamiento', color: 0xf39c12 },
  4: { label: 'Muerte', color: 0xe74c3c },
};

export const COLORS = {
  dominant: 0xe74c3c,
  subordinate: 0x3498db,
  female: 0x2ecc71,
  child: 0xffffff,
  water: 0x4488cc,
  food: 0xcc8844,
  background: 0x0f0f23,
  ground: 0x16163a,
  panel: 0x1a1a2e,
  accent: 0xc084fc,
};
