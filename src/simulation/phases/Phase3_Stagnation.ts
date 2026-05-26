import type { Colony } from '../Colony';
import type { WorldState } from '../WorldState';
import type { PhaseRules } from './Phase';
import type { EmergedType } from '../../core/types';
import { DENSITY_PHASE_3_THRESHOLD, BABY_AGE } from '../../core/constants';

export const Phase3_Stagnation: PhaseRules = {
  phase: 3,
  reproductionRate: 0.4,
  mortalityRate: 1.8,

  updateColony(colony: Colony, world: WorldState): void {
    const alive = colony.getAliveMice();
    const stressDamage = world.socialStress * world.socialStress * 10;
    const children = alive.filter(m => m.age < BABY_AGE);

    for (const m of alive) {
      if (m.type === 'dominant') {
        if (Math.random() < 0.03) m.health -= 1 + stressDamage * 0.5;
        if (Math.random() < 0.05 && children.length > 0) {
          const target = children[Math.floor(Math.random() * children.length)];
          target.health -= 15;
        }
      }
      if (m.type === 'subordinate' && Math.random() < 0.04) {
        m.health -= 3 + stressDamage;
      }
      if (m.type === 'female') {
        if (Math.random() < 0.02) m.health -= 2 + stressDamage * 0.5;
        if (m.childCareTicks > 0 && Math.random() < 0.03) m.childCareTicks = 0;
      }
    }

    const density = world.density(colony.population);

    for (const m of alive) {
      if (m.emergedType) continue;
      if (m.type === 'subordinate' && density > 0.18 && Math.random() < 0.003) {
        m.emergedType = 'marginado' as EmergedType;
      }
      if (m.type === 'subordinate' && density > 0.3 && Math.random() < 0.002) {
        m.emergedType = 'panurgino' as EmergedType;
      }
      if (m.type === 'dominant' && density > 0.4 && Math.random() < 0.003) {
        m.emergedType = 'hiperagresivo' as EmergedType;
      }
      if (m.type === 'female' && density > 0.5 && Math.random() < 0.002) {
        m.emergedType = 'hembra_hiperagresiva' as EmergedType;
      }
    }

    for (const m of alive) {
      if (m.emergedType === 'hembra_hiperagresiva' && children.length > 0) {
        const target = children[Math.floor(Math.random() * children.length)];
        target.health -= 20;
      }
    }

    if (density > 0.5) {
      for (const m of alive) {
        if (m.emergedType === 'hiperagresivo' && Math.random() < 0.05 && children.length > 0) {
          const target = children[Math.floor(Math.random() * children.length)];
          target.health = 0;
        }
      }
    }
  },

  shouldTransition(_colony: Colony, world: WorldState): boolean {
    return world.density(_colony.population) >= DENSITY_PHASE_3_THRESHOLD;
  },
};
