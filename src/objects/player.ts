import { GameObject } from './game-object';
import { Planet } from './planet';

export class Player extends GameObject {
  private _graphics: PIXI.Graphics;
  private _radius = 25;

  public get radius() {
    return this._radius;
  }

  public constructor(container: PIXI.Container) {
    super();
    this._graphics = new PIXI.Graphics();
    this.pos.r = Planet.RADIUS + this.radius;
    this.pos.theta = Math.random() * Math.PI * 2;
    this.pos.mirror(this._graphics.position);
    container.addChild(this._graphics);
    this._draw();
  }

  public update(): void {
    super.update();
    // Do some more player updating
  }

  private _draw(): void {
    this._graphics.clear();
    this._graphics.beginFill(0xff0000);
    this._graphics.drawCircle(0, 0, this.radius);
    this._graphics.endFill();
  }
}