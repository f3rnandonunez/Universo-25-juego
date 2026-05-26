import { SimulationEngine } from '../../simulation/SimulationEngine';
import { PHASE_INFO } from '../../core/constants';
import type { Phase } from '../../core/types';

export class HUD {
  private el: {
    pop: HTMLElement | null;
    density: HTMLElement | null;
    wb: HTMLElement | null;
    phase: HTMLElement | null;
    tick: HTMLElement | null;
    maleDom: HTMLElement | null;
    maleSub: HTMLElement | null;
    female: HTMLElement | null;
  };

  private engine: SimulationEngine;

  constructor(engine: SimulationEngine) {
    this.engine = engine;
    this.el = {
      pop: document.getElementById('hud-population'),
      density: document.getElementById('hud-density'),
      wb: document.getElementById('hud-wellbeing'),
      phase: document.getElementById('hud-phase'),
      tick: document.getElementById('hud-tick'),
      maleDom: document.getElementById('hud-dom'),
      maleSub: document.getElementById('hud-sub'),
      female: document.getElementById('hud-fem'),
    };
  }

  update(): void {
    const e = this.engine;
    if (this.el.pop) this.el.pop.textContent = e.population.toString();
    if (this.el.density) this.el.density.textContent = (e.density * 100).toFixed(1) + '%';
    if (this.el.wb) this.el.wb.textContent = e.wellbeing.toFixed(1) + '%';
    if (this.el.phase) {
      const info = PHASE_INFO[e.phase as Phase] ?? PHASE_INFO[1];
      this.el.phase.textContent = `${info.label}`;
    }
    if (this.el.tick) this.el.tick.textContent = e.tickCount.toLocaleString();
    if (this.el.maleDom) this.el.maleDom.textContent = e.colony.dominantCount.toString();
    if (this.el.maleSub) this.el.maleSub.textContent = e.colony.subordinateCount.toString();
    if (this.el.female) this.el.female.textContent = e.colony.femaleCount.toString();
  }
}
