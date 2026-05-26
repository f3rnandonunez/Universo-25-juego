export class WorldState {
  food: number = 100;
  water: number = 100;
  space: number = 100;
  socialStress: number = 0;

  get wellbeing(): number {
    const base = (this.food + this.water + this.space) / 3;
    return base * (1 - Math.min(0.8, this.socialStress));
  }

  get capacity(): number {
    return Math.max(100, (this.space / 100) * 3500);
  }

  density(population: number): number {
    return population / this.capacity;
  }

  setFood(v: number): void { this.food = Math.max(0, Math.min(100, v)); }
  setWater(v: number): void { this.water = Math.max(0, Math.min(100, v)); }
  setSpace(v: number): void { this.space = Math.max(0, Math.min(100, v)); }
}
