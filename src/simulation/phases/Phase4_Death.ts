import type { Colony } from '../Colony';
import type { WorldState } from '../WorldState';
import type { PhaseRules } from './Phase';
import type { EmergedType } from '../../core/types';
import { BABY_AGE } from '../../core/constants';

export const Phase4_Death: PhaseRules = {
  phase: 4,
  reproductionRate: 0.0,
  mortalityRate: 2.5,

  updateColony(colony: Colony, _world: WorldState): void {
    const alive = colony.getAliveMice();

    for (const m of alive) {
      if (m.age < BABY_AGE) {
        m.health = 0;
      }
    }

    for (const m of alive) {
      if (m.health <= 0) continue;

      if (!m.emergedType && Math.random() < 0.005) {
        m.emergedType = 'hermoso' as EmergedType;
      }

      if (m.health < 30 && Math.random() < 0.02) {
        m.health -= 3;
      }
    }

    const females = alive.filter(m => m.type === 'female' && m.health > 40);
    for (const f of females) {
      if (f.health <= 0) continue;
      if (Math.random() < 0.01) {
        f.health -= 5;
      }
    }
  },

  shouldTransition(_colony: Colony, _world: WorldState): boolean {
    return false;
  },
};
