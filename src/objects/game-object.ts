import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { KeyState } from '../input/keystate';
import { Game } from '../game';

export abstract class GameObject extends PIXI.Container {
  private _pos: Polar.Coord;
  private _prevPos: Polar.Coord;
  private _vel: Polar.Coord;
  private _accel: Polar.Coord;
  private _alive: boolean = true;

  public get pos(): Polar.Coord {
    return this._pos;
  }

  public get prevPos(): Polar.Coord {
    return this._prevPos;
  }

  public get vel(): Polar.Coord {
    return this._vel;
  }

  public get accel(): Polar.Coord {
    return this._accel;
  }

  public get alive(): boolean {
    return this._alive;
  }

  public constructor() {
    super();
    this._pos = new Polar.Coord();
    this._prevPos = new Polar.Coord();
    this._vel = new Polar.Coord();
    this._accel = new Polar.Coord();
  }

  public update(game: Game): void {
    this.vel.r += this.accel.r;
    this.vel.theta += this.accel.theta;
    this.pos.r += this.vel.r;
    this.pos.theta += this.vel.theta;
  }

  public kill(): void {
    this._alive = false;
  }

  public rollOver(): void {
    this._prevPos = this._pos.clone();
  }

  /**
   * Returns a string representation of the GameObject type, used for
   * identifying subclasses.
   */
  public abstract type(): string;

  /**
   * Respond to collision with another GameObject.
   */
  public abstract collide(other: GameObject, result: Collider.Result): void;

  /**
   * Get the bounds of this object as a polar rectangle.
   */
  public abstract getPolarBounds(): Polar.Rect;
}
