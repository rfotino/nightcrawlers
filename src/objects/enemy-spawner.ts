import { Enemy } from './enemy';
import { FlyingBat } from './flying-bat';
import { Skeleton } from './skeleton';
import { Spider } from './spider';
import { Zombie } from './zombie';
import { GameInstance } from '../game-instance';

export class EnemySpawner {
  private _enemiesToSpawn: string[] = [];
  private _enemies: Enemy[] = [];
  private _spawnCounter: number = 0;
  private _spawnCounterMax: number = 120;

  public get numAlive(): number {
    return this._enemies.filter(enemy => enemy.alive).length;
  }

  public get numToSpawn(): number {
    return this._enemiesToSpawn.length;
  }

  /**
   * Add a wave of enemies to spawn. The wave is of the form {enemyType: count}.
   */
  public addWave(wave: {[key: string]: number}): void {
    // Get array of string enemy types from {enemyType: count}, so that
    // {"bat": 3} would turn into ["bat", "bat", "bat"], for example.
    let newEnemiesToSpawn: string[] = [];
    for (let type in wave) {
      if (wave.hasOwnProperty(type)) {
        let num = wave[type];
        for (let i = 0; i < num; i++) {
          newEnemiesToSpawn.push(type);
        }
      }
    }
    // Add the new enemies at random to the array of enemies to spawn
    while (newEnemiesToSpawn.length > 0) {
      let idx = Math.floor(Math.random() * newEnemiesToSpawn.length);
      let enemy = newEnemiesToSpawn[idx];
      newEnemiesToSpawn.splice(idx, 1);
      this._enemiesToSpawn.push(enemy);
    }
  }

  /**
   * Update the timer, maybe spawn some enemies.
   */
  public update(game: GameInstance): void {
    if (game.timeKeeper.isDay || game.timeKeeper.transitioning) {
      this._spawnCounter = 0;
    } else {
      this._spawnCounter++;
      if (this._spawnCounter >= this._spawnCounterMax) {
        let newEnemyType = this._enemiesToSpawn.shift();
        let enemy = null;
        switch (newEnemyType) {
          case 'zombie':
            enemy = new Zombie(game);
            break;
          case 'bat':
            enemy = new FlyingBat(game);
            break;
          case 'skeleton':
            enemy = new Skeleton(game);
            break;
          case 'spider':
            enemy = new Spider(game);
            break;
        }
        if (enemy) {
          game.addGameObject(enemy);
          this._enemies.push(enemy);
        }
        this._spawnCounter = 0;
      }
    }
  }
}
