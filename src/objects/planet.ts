import { GameObject } from './game-object';

export class Planet extends GameObject {
  public static get RADIUS(): number { return 500; }
  private _graphics: PIXI.Graphics;

  public constructor(container: PIXI.Container) {
    super();
    this._graphics = new PIXI.Graphics();
    this.pos.mirror(this._graphics.position);
    this._draw();
    container.addChild(this._graphics);
  }

  public get radius() {
    return Planet.RADIUS;
  }

  private _draw(): void {
    this._graphics.clear();
    this._graphics.beginFill(0xffffff);
    this._graphics.drawCircle(this.pos.x, this.pos.y, this.radius);
    this._graphics.endFill();
  }
}
