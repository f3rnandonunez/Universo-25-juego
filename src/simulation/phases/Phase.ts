import type { Phase } from '../../core/types';
import type { Colony } from '../Colony';
import type { WorldState } from '../WorldState';

export interface PhaseRules {
  phase: Phase;
  reproductionRate: number;
  mortalityRate: number;
  updateColony(colony: Colony, world: WorldState): void;
  shouldTransition(colony: Colony, world: WorldState): boolean;
}
