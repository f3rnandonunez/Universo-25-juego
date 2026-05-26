import Phaser from 'phaser';
import { SimulationEngine } from '../../simulation/SimulationEngine';
import { COLORS } from '../../core/constants';

export class MouseRenderer {
  private graphics: Phaser.GameObjects.Graphics;
  private engine: SimulationEngine;

  constructor(scene: Phaser.Scene, engine: SimulationEngine) {
    this.engine = engine;
    this.graphics = scene.add.graphics();
  }

  render(): void {
    const mice = this.engine.colony.getAliveMice();
    const count = mice.length;

    this.graphics.clear();

    for (const mouse of mice) {
      if (mouse.isChild) {
        this.graphics.fillStyle(COLORS.child, 0.7);
        this.graphics.fillCircle(mouse.position.x, mouse.position.y, 2);
        continue;
      }

      let color: number;
      switch (mouse.type) {
        case 'dominant': color = COLORS.dominant; break;
        case 'female': color = COLORS.female; break;
        default: color = COLORS.subordinate;
      }

      if (mouse.emergedType === 'hermoso') {
        this.graphics.fillStyle(color, 1.0);
        this.graphics.fillEllipse(mouse.position.x, mouse.position.y, mouse.radius * 2, mouse.radius * 1.3);
      } else if (mouse.emergedType === 'marginado') {
        const pts = pentagonPoints(mouse.position.x, mouse.position.y, mouse.radius);
        this.graphics.fillStyle(color, 0.5);
        this.graphics.fillPoints(pts, true);
      } else if (mouse.emergedType === 'panurgino') {
        const pts = trianglePoints(mouse.position.x, mouse.position.y, mouse.radius);
        this.graphics.fillStyle(color, 0.8);
        this.graphics.fillPoints(pts, true);
      } else if (mouse.emergedType === 'hiperagresivo') {
        const pts = rhombusPoints(mouse.position.x, mouse.position.y, mouse.radius);
        this.graphics.fillStyle(color, 1.0);
        this.graphics.lineStyle(2, 0xffffff, 0.6);
        this.graphics.strokeCircle(mouse.position.x, mouse.position.y, mouse.radius + 2);
        this.graphics.fillPoints(pts, true);
      } else if (mouse.emergedType === 'hembra_hiperagresiva') {
        const pts = hexagonPoints(mouse.position.x, mouse.position.y, mouse.radius);
        this.graphics.fillStyle(color, 0.7);
        this.graphics.fillPoints(pts, true);
      } else {
        const alpha = count > 300
          ? clamp(mouse.health / 100, 0.3, 1)
          : Math.min(clamp((mouse.hunger + 20) / 120, 0.3, 1), clamp(mouse.health / 100, 0.3, 1));

        this.graphics.fillStyle(color, alpha);

        if (mouse.type === 'dominant') {
          const r = mouse.radius;
          this.graphics.fillRect(mouse.position.x - r, mouse.position.y - r, r * 2, r * 2);
          if (count < 200) {
            this.graphics.lineStyle(1, 0xffffff, 0.3);
            this.graphics.strokeRect(mouse.position.x - r - 1, mouse.position.y - r - 1, r * 2 + 2, r * 2 + 2);
          }
        } else if (mouse.type === 'female') {
          const r = mouse.radius;
          this.graphics.fillTriangle(
            mouse.position.x - r, mouse.position.y - r * 0.5,
            mouse.position.x + r, mouse.position.y - r * 0.5,
            mouse.position.x, mouse.position.y + r
          );
        } else {
          this.graphics.fillCircle(mouse.position.x, mouse.position.y, mouse.radius);
        }
      }
    }
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function pentagonPoints(x: number, y: number, r: number): { x: number; y: number }[] {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    pts.push({ x: x + r * Math.cos(a), y: y + r * Math.sin(a) });
  }
  return pts;
}

function trianglePoints(x: number, y: number, r: number): { x: number; y: number }[] {
  const pts = [];
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    pts.push({ x: x + r * Math.cos(a), y: y + r * Math.sin(a) });
  }
  return pts;
}

function rhombusPoints(x: number, y: number, r: number): { x: number; y: number }[] {
  return [
    { x: x + r * 1.2, y: y },
    { x: x, y: y - r * 1.2 },
    { x: x - r * 1.2, y: y },
    { x: x, y: y + r * 1.2 },
  ];
}

function hexagonPoints(x: number, y: number, r: number): { x: number; y: number }[] {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    pts.push({ x: x + r * Math.cos(a), y: y + r * Math.sin(a) });
  }
  return pts;
}
