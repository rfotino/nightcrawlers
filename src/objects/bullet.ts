import { GameObject } from './game-object';
import { Player } from './player';
import { Enemy } from './enemy';
import { FadingText } from './fading-text';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { Counter } from '../math/counter';

export class Bullet extends GameObject {
  protected _sprite: PIXI.Sprite;
  protected _damageAmount: number = 10;
  protected _lifespanCounter: Counter = new Counter(60);
  protected _killedByTerrain: boolean = true;

  protected get _knockbackTime(): number {
    return 5;
  }

  protected get _stunTime(): number {
    return 7;
  }

  protected get _knockbackVel(): number {
    return this.vel.theta;
  }

  public get width(): number {
    return 10;
  }

  public get height(): number {
    return 5;
  }

  public get z(): number {
    return 20;
  }

  public constructor(game: GameInstance) {
    super(game);
    this.pos.set(game.player.pos.r, game.player.pos.theta);
    let speed = 20 / this.pos.r;
    if (game.player.facingLeft) {
      this.vel.theta = -speed;
    } else {
      this.vel.theta = speed;
    }
    this._sprite = new PIXI.Sprite(PIXI.loader.resources['game/bullet'].texture);
    this._sprite.anchor.x = this._sprite.anchor.y = 0.5;
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
  }

  public type(): string {
    return 'bullet';
  }

  public team(): string {
    return 'player';
  }

  public collide(other: GameObject, result: Collider.Result): void {
    super.collide(other, result);
    if (other.team() === 'enemy') {
      const enemy = <Enemy>other;
      enemy.damage(this._damageAmount);
      enemy.knockback(this._knockbackVel, this._knockbackTime, this._stunTime);
      this.kill();
    } else if (other.type() === 'block' || other.type() === 'platform') {
      if (this._killedByTerrain) {
        this.kill();
      }
    }
  }

  public getPolarBounds(): Polar.Rect {
    let widthTheta = this.width / this.pos.r;
    return new Polar.Rect(
      this.pos.r + (this.height / 2),
      this.pos.theta - (widthTheta / 2),
      this.height,
      widthTheta
    );
  }

  public update(): void {
    super.update();
    if (this._lifespanCounter.done()) {
      this.kill();
    } else {
      this._lifespanCounter.next();
    }
  }
}
