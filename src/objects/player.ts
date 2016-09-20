import { GameObject } from './game-object';
import { Planet } from './planet';
import { KeyState } from '../input/keystate';

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

  public update(keyState: KeyState): void {
    super.update(keyState);
    // Handle turning due to user input
    if (keyState.isDown('ArrowLeft') && !keyState.isDown('ArrowRight')) {
      this.vel.theta = -0.005;
    } else if (keyState.isDown('ArrowRight')) {
      this.vel.theta = 0.005;
    } else {
      this.vel.theta = 0;
    }
  }

  private _draw(): void {
    this._graphics.clear();
    this._graphics.beginFill(0xff0000);
    this._graphics.drawCircle(0, 0, this.radius);
    this._graphics.endFill();
  }
}