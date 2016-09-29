import { Enemy } from './enemy';
import { Planet } from './planet';
import { GameInstance } from '../game-instance';

export class EnemySpawner {
  private _enemies: Enemy[];
  private _spawnCounter: number = 0;
  private _spawnCounterMax: number = 120;

  public get count(): number {
    return this._enemies.filter(enemy => enemy.alive).length;
  }

  public constructor() {
    this._enemies = [];
  }

  public update(game: GameInstance): void {
    if (game.timeKeeper.isDay) {
      this._enemies.forEach(enemy => {
        enemy.kill();
      });
      this._enemies = [];
      this._spawnCounter = 0;
    } else {
      this._spawnCounter++;
      if (this._spawnCounter >= this._spawnCounterMax) {
        const thetaRange = 1;
        let theta = (
          game.player.pos.theta -
          (thetaRange / 2) +
          (Math.random() * thetaRange)
        );
        let enemy = new Enemy(game.player.pos.r + 300, theta);
        game.addGameObject(enemy);
        this._enemies.push(enemy);
        this._spawnCounter = 0;
      }
    }
  }
}
