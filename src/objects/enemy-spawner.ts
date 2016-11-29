import { Enemy } from './enemy';
import { GameInstance } from '../game-instance';
import { Counter } from '../math/counter';

export class EnemySpawner {
  private _enemiesToSpawn: string[] = [];
  private _enemies: Enemy[] = [];
  private _spawnCounter: Counter = new Counter(120);

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
      this._spawnCounter.reset();
    } else {
      this._spawnCounter.next();
      if (this._spawnCounter.done() && this._enemiesToSpawn.length > 0) {
        const newEnemyType = this._enemiesToSpawn.shift();
        const enemy = Enemy.fromType(game, newEnemyType);
        game.addGameObject(enemy);
        this._enemies.push(enemy);
        this._spawnCounter.reset();
      }
    }
  }
}
