import { Colony, type ColonyConfig } from './Colony';
import { WorldState } from './WorldState';
import { Mouse } from './Mouse';
import { Phase1_Establishment } from './phases/Phase1_Establishment';
import { Phase2_Exploitation } from './phases/Phase2_Exploitation';
import { Phase3_Stagnation } from './phases/Phase3_Stagnation';
import { Phase4_Death } from './phases/Phase4_Death';
import type { PhaseRules } from './phases/Phase';
import type { Phase } from '../core/types';
import {
  MAX_AGE_TICKS, REPRODUCTION_COOLDOWN,
  PREGNANCY_DURATION, CHILD_CARE_DURATION,
  WORLD_X, WORLD_Y, WORLD_WIDTH, WORLD_HEIGHT,
} from '../core/constants';
import { vec2, randomRange, clamp } from '../core/utils';

const PHASES: PhaseRules[] = [Phase1_Establishment, Phase2_Exploitation, Phase3_Stagnation, Phase4_Death];

export class SimulationEngine {
  colony: Colony;
  world: WorldState;
  tickCount: number = 0;
  speedMultiplier: number = 1;
  private phaseIndex: number = 0;
  private callbacks: Array<() => void> = [];

  constructor(config?: ColonyConfig) {
    this.colony = new Colony(config);
    this.world = new WorldState();
  }

  get currentPhase(): PhaseRules {
    return PHASES[this.phaseIndex];
  }

  onUpdate(cb: () => void): void {
    this.callbacks.push(cb);
  }

  setSpeed(n: number): void {
    this.speedMultiplier = n;
  }

  tick(): void {
    const steps = this.speedMultiplier;
    for (let s = 0; s < steps; s++) {
      this._tick();
    }
    for (const cb of this.callbacks) {
      cb();
    }
  }

  private _tick(): void {
    this.tickCount++;

    const phase = this.currentPhase;

    this.world.socialStress = Math.min(0.8, this.density * 0.5);

    const alive = this.colony.getAliveMice();

    for (const mouse of alive) {
      mouse.update(this.colony.phase, this.world.socialStress, this.world.space, alive);

      if (mouse.age > MAX_AGE_TICKS) {
        mouse.health -= 0.5 * phase.mortalityRate;
      }

      if (this.world.wellbeing < 25) {
        mouse.health -= 0.2 * phase.mortalityRate;
      }

      if (this.density > 0.8) {
        mouse.health -= 0.15 * (this.density - 0.8) * 5;
      }

      if (mouse.health <= 0) {
        mouse.health = 0;
      }
    }

    phase.updateColony(this.colony, this.world);
    this.handleReproduction();
    this.colony.removeDead();

    if (this.currentPhase.shouldTransition(this.colony, this.world)) {
      this.advancePhase();
    }
  }

  private handleReproduction(): void {
    const alive = this.colony.mice;

    for (const female of alive) {
      if (!female.isAlive || female.type !== 'female') continue;

      if (female.pregnant) {
        if (female.pregnancyTicks >= PREGNANCY_DURATION) {
          const litter = randomRange(6, 12);
          for (let i = 0; i < litter; i++) {
            const roll = Math.random();
            const t: 'dominant' | 'subordinate' | 'female' =
              roll < 0.12 ? 'dominant'
                : roll < 0.52 ? 'subordinate' : 'female';
            const offspring = new Mouse(t, vec2(
              clamp(female.position.x + randomRange(-20, 20), WORLD_X + 5, WORLD_X + WORLD_WIDTH - 5),
              clamp(female.position.y + randomRange(-20, 20), WORLD_Y + 5, WORLD_Y + WORLD_HEIGHT - 5),
            ));
            if (this.colony.phase >= 4 && Math.random() < 0.5) {
              offspring.emergedType = 'hermoso';
            }
            this.colony.mice.push(offspring);
          }
          female.pregnant = false;
          female.pregnancyTicks = 0;
          female.childCareTicks = CHILD_CARE_DURATION;
          female.reproductionCooldown = REPRODUCTION_COOLDOWN;
        }
      }
    }

    const eligible = alive.filter(m => m.isAlive && m.canReproduce());
    if (eligible.length === 0) return;

    const live = this.colony.getAliveMice();
    const domCount = live.filter(m => m.type === 'dominant').length;
    const subCount = live.filter(m => m.type === 'subordinate').length;
    const maleFactor = Math.min(1, domCount * 0.03 + subCount * 0.005);

    const wellbeingFactor = this.world.wellbeing / 100;
    const densityFactor = Math.max(0.1, 1 - this.world.density(this.colony.population));
    const sinkPenalty = this.colony.behavioralSink ? 0.3 : 1.0;
    const chance = 0.06 * this.currentPhase.reproductionRate * wellbeingFactor * densityFactor * maleFactor * sinkPenalty;

    for (const female of eligible) {
      if (Math.random() < chance) {
        female.pregnant = true;
        female.pregnancyTicks = 0;
      }
    }
  }

  private advancePhase(): void {
    this.phaseIndex = Math.min(this.phaseIndex + 1, PHASES.length - 1);
    this.colony.phase = (this.phaseIndex + 1) as Phase;
    if (this.colony.phase >= 3) this.colony.behavioralSink = true;
  }

  get population(): number { return this.colony.population; }
  get density(): number { return this.world.density(this.colony.population); }
  get wellbeing(): number { return this.world.wellbeing; }
  get phase(): number { return this.colony.phase; }

  reset(config?: ColonyConfig): void {
    this.colony = new Colony(config);
    this.tickCount = 0;
    this.phaseIndex = 0;
    this.colony.phase = 1;
    this.colony.behavioralSink = false;
  }

  save(): void {
    const data = {
      tickCount: this.tickCount,
      phase: this.colony.phase,
      behavioralSink: this.colony.behavioralSink,
      world: { food: this.world.food, water: this.world.water, space: this.world.space },
      mice: this.colony.mice.filter(m => m.isAlive).map(m => ({
        id: m.id, type: m.type, age: m.age, health: m.health,
        hunger: m.hunger, thirst: m.thirst,
        x: m.position.x, y: m.position.y,
        pregnant: m.pregnant, pregTicks: m.pregnancyTicks,
        careTicks: m.childCareTicks, reproCooldown: m.reproductionCooldown,
        emergedType: m.emergedType,
      })),
    };
    try {
      localStorage.setItem('universo25_save', JSON.stringify(data));
    } catch { /* storage full, ignore */ }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem('universo25_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.mice?.length) {
        for (const m of data.mice) {
          const mouse = new Mouse(m.type, vec2(m.x, m.y));
          mouse.id = m.id;
          mouse.age = m.age;
          mouse.health = m.health;
          mouse.hunger = m.hunger ?? 100;
          mouse.thirst = m.thirst ?? 100;
          mouse.pregnant = m.pregnant;
          mouse.pregnancyTicks = m.pregTicks;
          mouse.childCareTicks = m.careTicks ?? 0;
          mouse.reproductionCooldown = m.reproCooldown ?? 0;
          mouse.emergedType = m.emergedType ?? undefined;
          this.colony.mice.push(mouse);
        }
      }
      this.tickCount = data.tickCount ?? 0;
      this.colony.phase = data.phase ?? 1;
      this.colony.behavioralSink = data.behavioralSink ?? false;
      if (data.world) {
        this.world.food = data.world.food;
        this.world.water = data.world.water;
        this.world.space = data.world.space;
      }
      return true;
    } catch {
      return false;
    }
  }
}
