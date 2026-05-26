import Phaser from 'phaser';
import { SimulationEngine } from '../../simulation/SimulationEngine';
import { MouseRenderer } from '../entities/MouseRenderer';
import { HUD } from '../ui/HUD';
import { Controls } from '../ui/Controls';
import { LabEnvironment, type Environment } from '../visuals/LabEnvironment';
import { TICK_INTERVAL_MS } from '../../core/constants';
import type { ColonyConfig } from '../../simulation/Colony';

const PHASE_NAMES = ['Establecimiento', 'Explotación', 'Estancamiento', 'Muerte'];

const CONFIG_ROWS = [
  { id: 'dom', label: 'Dominantes', def: 2, group: 'base' },
  { id: 'sub', label: 'Subordinados', def: 3, group: 'base' },
  { id: 'fem', label: 'Hembras', def: 3, group: 'base' },
  { id: 'marginado', label: 'Marginados', def: 0, group: 'emerged' },
  { id: 'panurgino', label: 'Panurginos', def: 0, group: 'emerged' },
  { id: 'hiperagresivo', label: 'Hiperagresivos', def: 0, group: 'emerged' },
  { id: 'hembra_hiperagresiva', label: 'H. Hiperagresivas', def: 0, group: 'emerged' },
  { id: 'hermoso', label: 'Hermosos', def: 0, group: 'emerged' },
];

export class GameScene extends Phaser.Scene {
  private engine!: SimulationEngine;
  private mouseRenderer!: MouseRenderer;
  private hud!: HUD;
  private env!: Environment;
  private resGfx!: Phaser.GameObjects.Graphics;
  private collapsed: boolean = false;
  private peakPopulation: number = 0;
  private tickTimer!: Phaser.Time.TimerEvent;
  private saveTimer!: Phaser.Time.TimerEvent;
  private collapseOverlay!: HTMLElement;
  private configOverlay!: HTMLElement;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.env = new LabEnvironment();
    const bg = this.add.graphics();
    this.env.renderBackground(bg);
    this.resGfx = this.add.graphics();

    this.createCollapseOverlay();
    this.createConfigOverlay();
    this.engine = new SimulationEngine();

    this.startSimulation();

    const hasSave = this.engine.load();
    if (!hasSave) {
      this.tickTimer.paused = true;
      this.saveTimer.paused = true;
      this.showConfigOverlay();
    }
    this.hud.update();
  }

  update(): void {
    this.env.renderResources(this.resGfx, this.engine.world);
    this.mouseRenderer.render();
  }

  private startSimulation(): void {
    this.mouseRenderer = new MouseRenderer(this, this.engine);
    this.hud = new HUD(this.engine);
    new Controls(this.engine, () => this.showConfigOverlay());

    this.engine.onUpdate(() => {
      this.hud.update();
      this.peakPopulation = Math.max(this.peakPopulation, this.engine.population);
      if (!this.collapsed && this.engine.population === 0) {
        this.onCollapse();
      }
    });

    this.tickTimer = this.time.addEvent({
      delay: TICK_INTERVAL_MS,
      callback: () => this.engine.tick(),
      loop: true,
    });

    this.saveTimer = this.time.addEvent({
      delay: 30000,
      callback: () => this.engine.save(),
      loop: true,
    });
  }

  private startCustomGame(): void {
    const config: ColonyConfig = {};
    for (const row of CONFIG_ROWS) {
      const val = parseInt((document.getElementById(`config-${row.id}`) as HTMLInputElement).value);
      (config as any)[row.id] = val;
    }
    this.engine.reset(config);
    this.collapsed = false;
    this.peakPopulation = 0;
    this.tickTimer.paused = false;
    this.saveTimer.paused = false;
    this.configOverlay.style.display = 'none';
  }

  private showConfigOverlay(): void {
    this.configOverlay.style.display = 'flex';
  }

  private createConfigOverlay(): void {
    this.configOverlay = document.createElement('div');
    this.configOverlay.id = 'config-overlay';

    let rowsHtml = '';
    for (const row of CONFIG_ROWS) {
      const cls = row.group === 'emerged' ? 'config-row config-emerged' : 'config-row';
      rowsHtml += `
        <div class="${cls}">
          <span class="config-label">${row.label}</span>
          <button class="config-minus" data-target="${row.id}">−</button>
          <input type="number" id="config-${row.id}" value="${row.def}" min="0" max="10" readonly />
          <button class="config-plus" data-target="${row.id}">+</button>
        </div>`;
    }

    this.configOverlay.innerHTML = `
      <div id="config-box">
        <h2>Configurar colonia</h2>
        <div id="config-rows">${rowsHtml}</div>
        <div id="config-buttons">
          <button id="config-start">Iniciar</button>
          <button id="config-default">Default (2D, 3S, 3H)</button>
        </div>
      </div>
    `;
    this.configOverlay.style.display = 'none';
    document.body.appendChild(this.configOverlay);

    document.querySelectorAll('.config-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.target;
        const input = document.getElementById(`config-${id}`) as HTMLInputElement;
        let val = parseInt(input.value);
        if (val > 0) input.value = String(val - 1);
      });
    });
    document.querySelectorAll('.config-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.target;
        const input = document.getElementById(`config-${id}`) as HTMLInputElement;
        let val = parseInt(input.value);
        if (val < 10) input.value = String(val + 1);
      });
    });

    document.getElementById('config-start')!.addEventListener('click', () => this.startCustomGame());

    document.getElementById('config-default')!.addEventListener('click', () => {
      for (const row of CONFIG_ROWS) {
        (document.getElementById(`config-${row.id}`) as HTMLInputElement).value = String(row.def);
      }
      this.startCustomGame();
    });
  }

  private createCollapseOverlay(): void {
    this.collapseOverlay = document.createElement('div');
    this.collapseOverlay.id = 'collapse-overlay';
    this.collapseOverlay.innerHTML = `
      <div id="collapse-box">
        <h1>Colapsaste la colonia</h1>
        <div id="collapse-stats">
          <div class="hud-item">
            <span class="hud-label">Días sobrevividos</span>
            <span id="collapse-tick" class="hud-value">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">Población pico</span>
            <span id="collapse-peak" class="hud-value">0</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">Última fase</span>
            <span id="collapse-phase" class="hud-value">—</span>
          </div>
        </div>
        <div id="collapse-buttons">
          <button id="collapse-restart">Reiniciar</button>
          <button id="collapse-close">Cerrar</button>
        </div>
      </div>
    `;
    this.collapseOverlay.style.display = 'none';
    document.body.appendChild(this.collapseOverlay);

    document.getElementById('collapse-restart')!.addEventListener('click', () => {
      localStorage.removeItem('universo25_save');
      location.reload();
    });
    document.getElementById('collapse-close')!.addEventListener('click', () => {
      this.collapseOverlay.style.display = 'none';
    });
  }

  private onCollapse(): void {
    this.collapsed = true;
    this.tickTimer.paused = true;
    this.saveTimer.paused = true;

    document.getElementById('collapse-tick')!.textContent = this.engine.tickCount.toLocaleString();
    document.getElementById('collapse-peak')!.textContent = this.peakPopulation.toLocaleString();
    document.getElementById('collapse-phase')!.textContent = PHASE_NAMES[this.engine.phase - 1] ?? 'Desconocida';
    this.collapseOverlay.style.display = 'flex';
  }
}
