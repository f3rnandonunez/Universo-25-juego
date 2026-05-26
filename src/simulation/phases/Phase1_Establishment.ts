import type { Colony } from '../Colony';
import type { WorldState } from '../WorldState';
import type { PhaseRules } from './Phase';

export const Phase1_Establishment: PhaseRules = {
  phase: 1,
  reproductionRate: 1.5,
  mortalityRate: 0.0,

  updateColony(_colony: Colony, _world: WorldState): void {
  },

  shouldTransition(colony: Colony, _world: WorldState): boolean {
    return colony.population > 8;
  },
};
