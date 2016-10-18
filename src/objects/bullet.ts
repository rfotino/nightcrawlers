import { GameObject } from './game-object';
import { Player } from './player';
import { Enemy } from './enemy';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

export class Bullet extends GameObject {
  private _owner: Player;
  private _sprite: PIXI.Sprite;
  private _damageAmount: number = 10;
  protected _lifespan: number = 60;
  protected _killedByTerrain: boolean = true;
  protected _knockbackVel: number;
  protected static _texture: PIXI.Texture;

  public get knockbackVel(): number {
    return this._knockbackVel;
  }

  public get knockbackTime(): number {
    return 5;
  }

  public get stunTime(): number {
    return 7;
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

  public constructor(owner: Player) {
    super();
    this._owner = owner;
    this.pos.set(owner.pos.r, owner.pos.theta);
    let speed = 20 / this.pos.r;
    if (owner.facingLeft) {
      this.vel.theta = -speed;
    } else {
      this.vel.theta = speed;
    }
    this._knockbackVel = this.vel.theta;
    this._sprite = new PIXI.Sprite(this._getTexture());
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
    if (other.team() === 'enemy') {
      other.damage(this._damageAmount);
      if (!other.alive) {
        this._owner.score += (<Enemy>other).score;
      }
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

  public update(game: GameInstance): void {
    super.update(game);
    this._lifespan--;
    if (this._lifespan <= 0) {
      this.kill();
    }
  }

  protected _getTexture(): PIXI.Texture {
    if (!Bullet._texture) {
      let canvas = document.createElement('canvas');
      canvas.width = this.width + 2;
      canvas.height = this.height + 2;
      let ctx = canvas.getContext('2d');
      ctx.fillStyle = 'black';
      ctx.fillRect(1, 1, this.width / 2, this.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(1 + (this.width / 2), 1, this.width / 2, this.height);
      Bullet._texture = PIXI.Texture.fromCanvas(canvas);
    }
    return Bullet._texture;
  }
}
