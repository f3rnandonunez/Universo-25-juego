import Phaser from 'phaser';
import { GameScene } from './renderer/scenes/GameScene.ts';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './core/constants.ts';
import './style.css';

new Phaser.Game({
  type: Phaser.AUTO,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0f0f23',
  scene: [GameScene],
});
