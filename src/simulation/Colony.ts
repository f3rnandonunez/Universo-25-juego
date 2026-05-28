import { Mouse } from './Mouse';
import { WORLD_X, WORLD_Y, WORLD_WIDTH, WORLD_HEIGHT } from '../core/constants';
import { vec2, randomRange } from '../core/utils';
import type { Phase, EmergedType } from '../core/types';

const EMERGED_BASE: Record<string, 'dominant' | 'subordinate' | 'female'> = {
  marginado: 'subordinate',
  panurgino: 'subordinate',
  hiperagresivo: 'dominant',
  hembra_hiperagresiva: 'female',
  hermoso: 'subordinate',
};

export interface ColonyConfig {
  dominants?: number;
  subordinates?: number;
  females?: number;
  marginado?: number;
  panurgino?: number;
  hiperagresivo?: number;
  hembra_hiperagresiva?: number;
  hermoso?: number;
}

export class Colony {
  mice: Mouse[] = [];
  phase: Phase = 1;
  behavioralSink: boolean = false;

  constructor(config?: ColonyConfig) {
    const dom = config?.dominants ?? 2;
    const sub = config?.subordinates ?? 2;
    const fem = config?.females ?? 4;
    const dist: Array<'dominant' | 'subordinate' | 'female'> = [
      ...Array(dom).fill('dominant'),
      ...Array(fem).fill('female'),
      ...Array(sub).fill('subordinate'),
    ];
    for (const type of dist) {
      const pos = vec2(
        WORLD_X + randomRange(100, WORLD_WIDTH - 100),
        WORLD_Y + randomRange(100, WORLD_HEIGHT - 100)
      );
      this.mice.push(new Mouse(type, pos));
    }

    const emergedTypes: EmergedType[] = ['marginado', 'panurgino', 'hiperagresivo', 'hembra_hiperagresiva', 'hermoso'];
    for (const et of emergedTypes) {
      const count = config?.[et] ?? 0;
      const baseType = EMERGED_BASE[et];
      for (let i = 0; i < count; i++) {
        const pos = vec2(
          WORLD_X + randomRange(100, WORLD_WIDTH - 100),
          WORLD_Y + randomRange(100, WORLD_HEIGHT - 100)
        );
        const m = new Mouse(baseType, pos);
        m.emergedType = et;
        this.mice.push(m);
      }
    }
  }

  get population(): number {
    return this.mice.filter(m => m.isAlive).length;
  }

  get dominantCount(): number {
    return this.mice.filter(m => m.isAlive && m.type === 'dominant').length;
  }

  get subordinateCount(): number {
    return this.mice.filter(m => m.isAlive && m.type === 'subordinate').length;
  }

  get femaleCount(): number {
    return this.mice.filter(m => m.isAlive && m.type === 'female').length;
  }

  get averageHealth(): number {
    const alive = this.mice.filter(m => m.isAlive);
    if (alive.length === 0) return 0;
    return alive.reduce((s, m) => s + m.health, 0) / alive.length;
  }

  getAliveMice(): Mouse[] {
    return this.mice.filter(m => m.isAlive);
  }

  removeDead(): void {
    this.mice = this.mice.filter(m => m.isAlive);
  }
}
