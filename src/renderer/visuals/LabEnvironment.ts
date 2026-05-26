import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  WORLD_X, WORLD_Y, WORLD_WIDTH, WORLD_HEIGHT, COLORS,
} from '../../core/constants';
import type { WorldState } from '../../simulation/WorldState';

export interface Environment {
  renderBackground(g: Phaser.GameObjects.Graphics): void;
  renderResources(g: Phaser.GameObjects.Graphics, world: WorldState): void;
}

export class LabEnvironment implements Environment {
  renderBackground(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x2a1f1a, 1);
    g.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    g.fillStyle(0x3d3028, 1);
    g.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
    g.fillStyle(0x4a3a30, 1);
    g.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 2);

    g.fillStyle(0xd4c9b0, 1);
    g.fillRect(WORLD_X - 20, WORLD_Y - 20, WORLD_WIDTH + 40, WORLD_HEIGHT + 40);

    g.fillStyle(0x1e1e2e, 1);
    g.fillRect(WORLD_X - 12, WORLD_Y - 12, WORLD_WIDTH + 24, WORLD_HEIGHT + 24);

    g.fillStyle(0xe8ddd0, 1);
    g.fillRect(WORLD_X - 4, WORLD_Y - 4, WORLD_WIDTH + 8, WORLD_HEIGHT + 8);

    g.fillStyle(0xcfc5b6, 1);
    g.fillRect(WORLD_X, WORLD_Y, WORLD_WIDTH, WORLD_HEIGHT);

    g.lineStyle(1, 0xb8aa98, 0.4);
    for (let x = WORLD_X; x <= WORLD_X + WORLD_WIDTH; x += 40) {
      g.lineBetween(x, WORLD_Y, x, WORLD_Y + WORLD_HEIGHT);
    }
    for (let y = WORLD_Y; y <= WORLD_Y + WORLD_HEIGHT; y += 40) {
      g.lineBetween(WORLD_X, y, WORLD_X + WORLD_WIDTH, y);
    }
  }

  renderResources(g: Phaser.GameObjects.Graphics, world: WorldState): void {
    g.clear();

    const barW = 40;
    const barH = 60;

    const drawPair = (cx: number, cy: number, waterPct: number, foodPct: number): void => {
      const top = cy - barH / 2;
      g.lineStyle(1, 0x6699cc, 0.6);
      g.strokeRect(cx - barW - 4, top, barW, barH);
      g.fillStyle(COLORS.water, 1);
      if (waterPct > 0) g.fillRect(cx - barW - 4, top + barH * (1 - waterPct), barW, barH * waterPct);

      g.lineStyle(1, 0xccaa66, 0.6);
      g.strokeRect(cx + 4, top, barW, barH);
      g.fillStyle(COLORS.food, 1);
      if (foodPct > 0) g.fillRect(cx + 4, top + barH * (1 - foodPct), barW, barH * foodPct);
    };

    const w = world.water / 100;
    const f = world.food / 100;

    const CX = WORLD_X + WORLD_WIDTH / 2;
    const CY = WORLD_Y + WORLD_HEIGHT / 2;

    drawPair(WORLD_X + WORLD_WIDTH - 80, WORLD_Y + 40, w, f);
    drawPair(WORLD_X + 40, WORLD_Y + WORLD_HEIGHT - 40, w, f);
    drawPair(WORLD_X + 40, WORLD_Y + 40, w, f);
    drawPair(WORLD_X + WORLD_WIDTH - 80, WORLD_Y + WORLD_HEIGHT - 40, w, f);
    drawPair(CX, CY, w, f);
    drawPair(CX, WORLD_Y + 40, w, f);
    drawPair(CX, WORLD_Y + WORLD_HEIGHT - 40, w, f);
    drawPair(WORLD_X + 40, CY, w, f);
    drawPair(WORLD_X + WORLD_WIDTH - 80, CY, w, f);
  }
}
