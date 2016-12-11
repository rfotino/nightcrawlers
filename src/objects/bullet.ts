import { GameObject } from './game-object';
import { Player } from './player';
import { Enemy } from './enemy';
import { FadingText } from './fading-text';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { Counter } from '../math/counter';

export class BulletTrail extends GameObject {
  protected _lifetimeCounter: Counter = new Counter(5);
  public get z(): number { return 20; }

  public constructor(
    game: GameInstance,
    maxDist: number,
    originOffsetR: number,
    originOffsetTheta: number,
    dirOffsetR: number,
    knockbackVel: number,
    knockbackTime: number,
    stunTime: number,
    damageAmount: number
  ) {
    super(game);
    // Knock back in direction of the bullet
    if (game.player.facingLeft) {
      knockbackVel *= -1;
    }
    // Come up with origin and direction of bullet
    const origin = new Polar.Coord(
      game.player.pos.r + originOffsetR,
      game.player.pos.theta + originOffsetTheta
    );
    const dir = new Polar.Coord(
      dirOffsetR,
      (game.player.facingLeft ? -1 : 1) / game.player.pos.r
    );
    // Find intersection point
    let minHitDist = maxDist;
    let hitObj: GameObject = null;
    const hittableObjects = game.gameObjects.filter(obj => {
      const type = obj.type();
      return type === 'enemy' || type === 'block';
    });
    hittableObjects.forEach(obj => {
      if (obj.alive) {
        const hitMultiple = Collider.getRayRectIntersection(
          origin, dir,
          obj.getPolarBounds()
        );
        if (hitMultiple !== null) {
          const hitDist = Math.abs(hitMultiple * dir.theta * origin.r);
          if (hitDist < minHitDist) {
            minHitDist = hitDist;
            hitObj = obj;
          }
        }
      }
    });
    // If we hit an enemy, do damage to and knock back the enemy
    if (hitObj !== null && hitObj.team() === 'enemy') {
      const enemy = <Enemy>hitObj;
      // Damage has to be after knockback, otherwise blood splatter won't have
      // the correct velocity if damage() ends up killing the enemy
      enemy.knockback(knockbackVel / enemy.pos.r, knockbackTime, stunTime);
      enemy.damage(damageAmount);
    }
    // Draw bullet trail to graphics
    const pos = origin.clone();
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0, 0);
    graphics.moveTo(pos.x, pos.y);
    while (Math.abs(pos.theta - origin.theta) * game.player.pos.r < minHitDist) {
      const alpha = (
        Math.abs(pos.theta - origin.theta) * game.player.pos.r / minHitDist
      );
      pos.r += dir.r;
      pos.theta += dir.theta;
      graphics.lineStyle(1, 0xffffff, alpha);
      graphics.lineTo(pos.x, pos.y);
    }
    graphics.endFill();
    this.addChild(graphics);
  }

  public getPolarBounds(): Polar.Rect { return new Polar.Rect(); }
  public type(): string { return 'bullet'; }
  public team(): string { return 'player'; }
  public collidesWith(otherType: string): boolean { return false; }
  public collidable(): boolean { return false; }

  public update(): void {
    if (this._lifetimeCounter.done()) {
      this.kill();
    } else {
      this.alpha = 1 - this._lifetimeCounter.percent();
      this._lifetimeCounter.next();
    }
  }
}
