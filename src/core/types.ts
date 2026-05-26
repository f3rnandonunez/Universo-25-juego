export type MouseType = 'dominant' | 'subordinate' | 'female';
export type EmergedType = 'marginado' | 'panurgino' | 'hiperagresivo' | 'hembra_hiperagresiva' | 'hermoso';
export type BehaviorState = 'wander' | 'seek_food' | 'seek_water' | 'eat' | 'drink' | 'flee' | 'chase' | 'frozen' | 'groom';
export type Phase = 1 | 2 | 3 | 4;

export interface Vector2 {
  x: number;
  y: number;
}
