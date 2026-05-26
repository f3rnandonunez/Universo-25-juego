import { SimulationEngine } from '../../simulation/SimulationEngine';

export class Controls {
  private engine: SimulationEngine;

  constructor(engine: SimulationEngine, onCustom?: () => void) {
    this.engine = engine;
    this.setupSlider('ctrl-food', v => this.engine.world.setFood(v));
    this.setupSlider('ctrl-water', v => this.engine.world.setWater(v));
    this.setupSlider('ctrl-space', v => this.engine.world.setSpace(v));
    this.setupButton('ctrl-reset', () => {
      localStorage.removeItem('universo25_save');
      location.reload();
    });
    this.setupButton('ctrl-save', () => this.engine.save());
    this.setupButton('ctrl-custom', onCustom ?? (() => {}));
    this.setupSpeedButtons();
  }

  private setupSpeedButtons(): void {
    const setSpeed = (n: number) => {
      this.engine.setSpeed(n);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(`speed-${n}`)?.classList.add('active');
    };
    this.setupButton('speed-1', () => setSpeed(1));
    this.setupButton('speed-2', () => setSpeed(2));
    this.setupButton('speed-3', () => setSpeed(3));
  }

  private setupButton(id: string, onClick: () => void): void {
    const el = document.getElementById(id) as HTMLButtonElement | null;
    if (!el) return;
    el.addEventListener('click', onClick);
  }

  private setupSlider(id: string, onChange: (v: number) => void): void {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return;
    el.addEventListener('input', () => onChange(parseFloat(el.value)));
  }
}
