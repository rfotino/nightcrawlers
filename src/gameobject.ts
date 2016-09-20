/// <reference path="../typings/pixi.js/pixi.js.d.ts" />

export class GameObject {
  protected _sprite: PIXI.Sprite;
  private _velocity: PIXI.Point;
  private _acceleration: PIXI.Point;

  constructor(container: PIXI.Container) {
    this._sprite = new PIXI.Sprite();
    this._velocity = new PIXI.Point();
    this._acceleration = new PIXI.Point();
    container.addChild(this._sprite);
  }

  get pos(): PIXI.Point {
    return this._sprite.position;
  }

  get vel(): PIXI.Point {
    return this._velocity;
  }
  get accel(): PIXI.Point {
    return this._acceleration;
  }

  update(): void {
    this.vel.x += this.accel.x;
    this.vel.y += this.accel.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
  }
}
