import { GameObject } from './game-object';
import { Player } from './player';
import { Game } from '../game';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

export class Bullet extends GameObject {
  private _owner: Player;
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _damageAmount: number = 10;
  private _lifespan: number = 60;

  public get width(): number {
    return 10;
  }

  public get height(): number {
    return 5;
  }

  public constructor(owner: Player, left: boolean) {
    super();
    this._owner = owner;
    this.pos.set(owner.pos.r, owner.pos.theta);
    let speed = 10 / owner.pos.r;
    if (left) {
      this.vel.theta = -speed;
    } else {
      this.vel.theta = speed;
    }
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.x = this._sprite.anchor.y = 0.5;
    this.pos.mirror(this._sprite);
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
        this._owner.score++;
      }
      this.kill();
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

  public update(game: Game): void {
    super.update(game);
    this._lifespan--;
    if (this._lifespan <= 0) {
      this.kill();
    }
  }

  private _draw(): void {
    this._canvas = document.createElement('canvas');
    this._canvas.width = this.width + 2;
    this._canvas.height = this.height + 2;
    let ctx = this._canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(1, 1, this.width / 2, this.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(1 + (this.width / 2), 1, this.width / 2, this.height);
  }
}
