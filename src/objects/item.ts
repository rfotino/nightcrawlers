import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import { Player } from './player';
import { Polar } from '../math/polar';
import * as Terrain from './terrain';

export class Item extends GameObject {
  protected _type: string;
  protected _sprite: PIXI.Sprite;

  public get width(): number { return 40; }
  public get height(): number { return 40; }

  public get z(): number { return 25; }
  
  public constructor(type: string, r: number = 0, theta: number = 0) {
    super();
    this._type = type;
    this.pos.r = r;
    this.pos.theta = theta;
    // Create a canvas for the sprite's texture
    let canvas = document.createElement('canvas');
    canvas.width = this.width + 2;
    canvas.height = this.height + 2;
    // Draw a circle on the canvas
    let radius = this.width / 2;
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = 'purple';
    ctx.beginPath();
    ctx.arc(1 + radius, 1 + radius, radius, 0, Math.PI * 2);
    ctx.fill();
    // Create a sprite with this texture
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
    this._sprite.anchor.x = this._sprite.anchor.y = 0.5;
    this.addChild(this._sprite);
    this.pos.mirror(this._sprite);
  }

  public type(): string { return 'item'; }

  public getPolarBounds(): Polar.Rect {
    let widthTheta = this.width / this.pos.r;
    return new Polar.Rect(
      this.pos.r + (this.height / 2),
      this.pos.theta - (widthTheta / 2),
      this.height,
      widthTheta
    );
  }

  public collide(other: GameObject): void {
    if ('player' === other.type()) {
      this._addToPlayer(<Player>other);
      this.kill();
    }
  }

  public update(game: GameInstance): void {
    super.update(game);
    this.vel.r += Terrain.GRAVITY;
  }

  protected _addToPlayer(player: Player): void {
    // To be implemented by subclasses, or implemented by switching on _type.
    // Just add some health for now.
    player.heal(20);
  }
}
