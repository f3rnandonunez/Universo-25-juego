import type { MouseType, EmergedType, BehaviorState, Vector2 } from '../core/types';
import { vec2, add, sub, scale, normalize, clamp, distance, randomRange } from '../core/utils';
import {
  RADIUS_DOMINANT, RADIUS_SUBORDINATE, RADIUS_FEMALE,
  MOUSE_SPEED, CHASE_SPEED, FLEE_SPEED, SEEK_SPEED,
  MOUSE_WANDER_FORCE, MATURITY_AGE, BABY_AGE, CROWD_RADIUS,
  HUNGER_DECAY, THIRST_DECAY, PREGNANT_DECAY_MULT,
  SEEK_THRESHOLD, EAT_TICKS, DRINK_TICKS, RESTORE_PER_TICK,
  RESOURCE_SOURCES, WORLD_X, WORLD_Y, WORLD_WIDTH, WORLD_HEIGHT,
} from '../core/constants';

let nextId = 1;

export class Mouse {
  id: number;
  type: MouseType;
  behavior: BehaviorState = 'wander';
  age: number = 0;
  health: number = 100;
  hunger: number = 100;
  thirst: number = 100;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  pregnant: boolean = false;
  pregnancyTicks: number = 0;
  reproductionCooldown: number = 0;
  childCareTicks: number = 0;
  actionTicks: number = 0;
  emergedType?: EmergedType;

  constructor(type: MouseType, position: Vector2) {
    this.id = nextId++;
    this.type = type;
    this.position = { ...position };
    this.velocity = vec2(randomRange(-0.5, 0.5), randomRange(-0.5, 0.5));
    this.radius = type === 'dominant'
      ? RADIUS_DOMINANT
      : type === 'female'
        ? RADIUS_FEMALE
        : RADIUS_SUBORDINATE;
  }

  private getHungerDecay(): number {
    let base = HUNGER_DECAY[this.type] ?? 0.35;
    if (this.pregnant) base *= PREGNANT_DECAY_MULT;
    return base;
  }

  private getThirstDecay(): number {
    let base = THIRST_DECAY[this.type] ?? 0.3;
    if (this.pregnant) base *= PREGNANT_DECAY_MULT;
    return base;
  }

  update(phase: number, socialStress: number, space: number, allMice: Mouse[]): void {
    this.age++;
    this.reproductionCooldown = Math.max(0, this.reproductionCooldown - 1);
    this.childCareTicks = Math.max(0, this.childCareTicks - 1);
    this.actionTicks = Math.max(0, this.actionTicks - 1);

    if (this.pregnant) this.pregnancyTicks++;
    if (this.isChild) return;

    this.hunger = Math.max(0, this.hunger - this.getHungerDecay());
    this.thirst = Math.max(0, this.thirst - this.getThirstDecay());

    if (this.hunger === 0) this.health -= 0.5;
    if (this.thirst === 0) this.health -= 0.5;

    this.evaluateBehavior(phase, socialStress, space, allMice);
    this.applyMovement();
  }

  private evaluateBehavior(phase: number, stress: number, space: number, allMice: Mouse[]): void {
    if (this.actionTicks > 0) return;

    if (this.hunger < SEEK_THRESHOLD) {
      const nearest = this.nearestSource('food');
      if (nearest && distance(this.position, nearest) < 10) {
        this.behavior = 'eat';
        this.actionTicks = EAT_TICKS;
        this.velocity = vec2(0, 0);
        return;
      }
      this.behavior = 'seek_food';
      return;
    }

    if (this.thirst < SEEK_THRESHOLD) {
      const nearest = this.nearestSource('water');
      if (nearest && distance(this.position, nearest) < 10) {
        this.behavior = 'drink';
        this.actionTicks = DRINK_TICKS;
        this.velocity = vec2(0, 0);
        return;
      }
      this.behavior = 'seek_water';
      return;
    }

    if (this.behavior === 'eat') {
      this.hunger = Math.min(100, this.hunger + RESTORE_PER_TICK);
      if (this.actionTicks === 0) this.behavior = 'wander';
      return;
    }
    if (this.behavior === 'drink') {
      this.thirst = Math.min(100, this.thirst + RESTORE_PER_TICK);
      if (this.actionTicks === 0) this.behavior = 'wander';
      return;
    }

    if (this.emergedType) {
      switch (this.emergedType) {
        case 'marginado':
          this.behavior = 'flee';
          return;
        case 'panurgino':
          this.behavior = 'chase';
          return;
        case 'hiperagresivo':
          this.behavior = 'chase';
          return;
        case 'hembra_hiperagresiva':
          this.behavior = 'wander';
          this.childCareTicks = 0;
          return;
        case 'hermoso':
          this.behavior = 'groom';
          return;
      }
    }

    if (space < 70) {
      const crowdThreshold = Math.max(2, 2 + Math.floor(6 * (space / 100)));
      let neighbors = 0;
      for (const other of allMice) {
        if (other === this || !other.isAlive) continue;
        if (distance(this.position, other.position) < CROWD_RADIUS) neighbors++;
        if (neighbors > crowdThreshold) break;
      }

      if (neighbors > crowdThreshold) {
        if (this.type === 'dominant') {
          this.behavior = 'chase';
          return;
        }
        if (this.type === 'subordinate') {
          this.behavior = 'flee';
          return;
        }
      }
    }

    if (phase >= 2 && stress > 0.2) {
      if (this.type === 'dominant' && Math.random() < stress * 1.5) {
        this.behavior = 'chase';
        return;
      }
      if (this.type === 'subordinate') {
        if (Math.random() < stress * 2) {
          this.behavior = 'flee';
          return;
        }
        if (stress > 0.5 && Math.random() < stress - 0.3) {
          this.behavior = 'frozen';
          return;
        }
      }
      if (this.type === 'female' && Math.random() < stress * 0.8) {
        this.behavior = 'flee';
        return;
      }
    }

    this.behavior = 'wander';
  }

  private nearestSource(type: 'food' | 'water'): Vector2 | null {
    let best: Vector2 | null = null;
    let bestDist = Infinity;
    for (const s of RESOURCE_SOURCES) {
      if (s.type !== type) continue;
      const d = distance(this.position, vec2(s.x, s.y));
      if (d < bestDist) { bestDist = d; best = vec2(s.x, s.y); }
    }
    return best;
  }

  private applyMovement(): void {
    let target: Vector2 | null = null;
    let speed = MOUSE_SPEED;

    switch (this.behavior) {
      case 'seek_food':
        target = this.nearestSource('food');
        speed = SEEK_SPEED;
        break;
      case 'seek_water':
        target = this.nearestSource('water');
        speed = SEEK_SPEED;
        break;
      case 'flee':
        target = vec2(WORLD_X + WORLD_WIDTH / 2, WORLD_Y + WORLD_HEIGHT / 2);
        speed = this.emergedType === 'marginado' ? FLEE_SPEED * 0.5 : FLEE_SPEED;
        break;
      case 'chase':
        speed = CHASE_SPEED;
        break;
      case 'frozen':
        this.velocity = vec2(0, 0);
        return;
      case 'groom':
        this.velocity = vec2(0, 0);
        return;
      default:
        break;
    }

    if (target) {
      const dir = normalize(sub(target, this.position));
      this.velocity = scale(dir, speed);
    } else if (this.behavior === 'chase') {
      this.velocity.x += randomRange(-MOUSE_WANDER_FORCE, MOUSE_WANDER_FORCE);
      this.velocity.y += randomRange(-MOUSE_WANDER_FORCE, MOUSE_WANDER_FORCE);
      const v = normalize(this.velocity);
      this.velocity = scale(v, speed);
    } else {
      this.velocity.x += randomRange(-MOUSE_WANDER_FORCE, MOUSE_WANDER_FORCE);
      this.velocity.y += randomRange(-MOUSE_WANDER_FORCE, MOUSE_WANDER_FORCE);
      const v = normalize(this.velocity);
      this.velocity = scale(v, MOUSE_SPEED);
    }

    this.position = add(this.position, this.velocity);
    this.position.x = clamp(this.position.x, WORLD_X + this.radius, WORLD_X + WORLD_WIDTH - this.radius);
    this.position.y = clamp(this.position.y, WORLD_Y + this.radius, WORLD_Y + WORLD_HEIGHT - this.radius);
  }

  canReproduce(): boolean {
    return this.type === 'female'
      && this.age >= MATURITY_AGE
      && !this.pregnant
      && this.emergedType === undefined
      && this.childCareTicks === 0
      && this.reproductionCooldown === 0
      && this.health > 50;
  }

  get isAlive(): boolean { return this.health > 0; }
  get isChild(): boolean { return this.age < BABY_AGE; }
}
