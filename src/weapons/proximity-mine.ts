import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { Player } from '../objects/player';
import { Enemy } from '../objects/enemy';
import * as Terrain from '../objects/terrain';
import { GameObject } from '../objects/game-object';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Collider } from '../math/collider';
import { Polar } from '../math/polar';
import { Counter } from '../math/counter';

class ProximityMineInstance extends Bullet {
  // Don't explode immediately after spawning, wait for setup counter
  protected _setupCounter: Counter = new Counter(30);

  protected get _minExplodeDist(): number {
    return 100;
  }
  
  protected get _minDamageDist(): number {
    return 200;
  }

  protected get _knockbackTime(): number {
    return 10;
  }

  protected get _stunTime(): number {
    return 30;
  }

  public get width(): number {
    return 20;
  }

  public get height(): number {
    return 15;
  }

  public constructor(owner: Player) {
    super(owner);
    // Change default bullet texture
    this._sprite.texture = PIXI.loader.resources['game/mine'].texture;
    // Drops to ground and stays there
    this._killedByTerrain = false;
    this.accel.r = Terrain.GRAVITY;
    // Disappears after 5 minutes
    this._lifespanCounter.max = 18000;
    // Doesn't fly left or right
    this.vel.theta = 0;
  }

  public update(game: GameInstance): void {
    super.update(game);
    // Update setup counter, if it is not finished then do not explode)
    if (!this._setupCounter.done()) {
      this._setupCounter.next();
      return;
    }
    // Check if we are close enough to an enemy to explode
    let enemies = game.gameObjects
      .filter(obj => obj.type() === 'enemy')
      .map(obj => <Enemy>obj);
    let blockBounds = game.level.blocks.map(block => block.getPolarBounds());
    for (let i = 0; i < enemies.length; i++) {
      let enemy = enemies[i];
      let proximity = this.pos.dist(enemy.pos);
      if (proximity < this._minExplodeDist &&
          this._canSee(enemy, blockBounds)) {
        this._explode(enemies, blockBounds);
        break;
      }
    }
  }

  protected _canSee(enemy: Enemy, blockBounds: Polar.Rect[]): boolean {
    let line = new Polar.Line(
      this.pos.r, this.pos.theta,
      enemy.pos.r, enemy.pos.theta
    );
    for (let i = 0; i < blockBounds.length; i++) {
      let rect = blockBounds[i];
      if (line.intersectsRect(rect).any) {
        return false;
      }
    }
    return true;
  }

  protected _explode(enemies: Enemy[], blockBounds: Polar.Rect[]): void {
    enemies.forEach(enemy => {
      // If this enemy is too far away or is obscured by a block, do nothing
      // for this enemy
      let enemyDist = this.pos.dist(enemy.pos);
      if (enemyDist > this._minDamageDist ||
          !this._canSee(enemy, blockBounds)) {
        return;
      }
      // Damage the enemy
      enemy.damage(this._damageAmount);
      // And knock them away
      let enemyVel = new Polar.Coord(15, 20 / enemy.pos.r);
      if (enemy.pos.r < this.pos.r) {
        enemyVel.r *= -1;
      }
      let enemyTheta = Polar.closestTheta(enemy.pos.theta, this.pos.theta);
      if (enemyTheta < this.pos.theta) {
        enemyVel.theta *= -1;
      }
      enemy.vel.r = enemyVel.r;
      enemy.knockback(enemyVel.theta, this._knockbackTime, this._stunTime);
      // If the enemy is dead, add points to owner's score
      if (!enemy.alive) {
        this._owner.score += enemy.score;
      }
    });
    // Mines can only be used once
    this.kill();
  }
}

export class ProximityMine extends Weapon {
  public type(): string { return 'mine'; }

  public maybeFire(game: GameInstance): void {
    if (this.ammo > 0 && game.keyState.isPressed(KeyState.SPACEBAR)) {
      game.addGameObject(new ProximityMineInstance(game.player));
      this.ammo--;
    }
  }
}
