import { Player } from '../objects/player';
import { Enemy } from '../objects/enemy';
import * as Terrain from '../objects/terrain';
import { GameObject } from '../objects/game-object';
import { Explosion } from '../objects/particles';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Collider } from '../math/collider';
import { Polar } from '../math/polar';
import { Counter } from '../math/counter';

export class ProximityMine extends GameObject {
  protected _sprite: PIXI.Sprite;
  // Disappear after not exploding for 5 minutes
  protected _lifespanCounter: Counter = new Counter(18000);
  // Don't explode immediately after spawning, wait for setup counter
  protected _setupCounter: Counter = new Counter(30);

  protected get _damageAmount(): number {
    return 20;
  }

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

  public get z(): number { return 20; }

  public constructor(game: GameInstance) {
    super(game);
    this.pos.set(game.player.pos.r, game.player.pos.theta);
    // Set up sprite
    this._sprite = new PIXI.Sprite(PIXI.loader.resources['game/mine'].texture);
    this._sprite.anchor.set(0.5);
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
    // Mines are affected by gravity
    this.accel.r = Terrain.GRAVITY;
  }

  public type(): string { return 'mine'; }

  public team(): string { return 'player'; }

  public update(): void {
    super.update();
    // Update the lifespan counter, kill self if it has been in the game too
    // long without exploding
    if (this._lifespanCounter.done()) {
      this.kill();
      return;
    } else {
      this._lifespanCounter.next();
    }
    // Update setup counter, if it is not finished then do not explode)
    if (!this._setupCounter.done()) {
      this._setupCounter.next();
      return;
    }
    // Check if we are close enough to an enemy to explode
    const enemies = this._game.gameObjects
      .filter(obj => obj.type() === 'enemy')
      .map(obj => <Enemy>obj);
    const blockBounds = this._game.level.blocks
      .map(block => block.getPolarBounds());
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const proximity = this.pos.dist(enemy.pos);
      if (proximity < this._minExplodeDist &&
          this._canSee(enemy, blockBounds)) {
        this._explode(enemies, blockBounds);
        break;
      }
    }
  }

  /**
   * Approximate this Cartesian rectangle as a polar rectangle.
   */
  public getPolarBounds(): Polar.Rect {
    const widthTheta = this.width / this.pos.r;
    return new Polar.Rect(
      this.pos.r + (this.height / 2),
      this.pos.theta - (widthTheta / 2),
      this.height,
      widthTheta
    );
  }

  /**
   * Helper function for determining if the proximity mine has a line of sight
   * to the given enemy.
   */
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
    // Add explosion animation
    this._game.addGameObject(new Explosion(this._game, this.pos, this.vel));
    // Damage enemies that are in sight and close enough
    enemies.forEach(enemy => {
      // Do nothing if enemy is no longer alive
      if (!enemy.alive) {
        return;
      }
      // If this enemy is too far away or is obscured by a block, do nothing
      // for this enemy
      let enemyDist = this.pos.dist(enemy.pos);
      if (enemyDist > this._minDamageDist ||
          !this._canSee(enemy, blockBounds)) {
        return;
      }
      // Damage has to be after knockback, otherwise blood splatter won't have
      // the correct velocity if damage() ends up killing the enemy
      const enemyVel = new Polar.Coord(15, 20 / enemy.pos.r);
      if (enemy.pos.r < this.pos.r) {
        enemyVel.r *= -1;
      }
      const enemyTheta = Polar.closestTheta(enemy.pos.theta, this.pos.theta);
      if (enemyTheta < this.pos.theta) {
        enemyVel.theta *= -1;
      }
      enemy.vel.r = enemyVel.r;
      enemy.knockback(enemyVel.theta, this._knockbackTime, this._stunTime);
      enemy.damage(this._damageAmount);
    });
    // Mines can only be used once
    this.kill();
  }
}
