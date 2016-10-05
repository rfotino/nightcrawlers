import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { KeyState } from '../input/keystate';
import { GameInstance } from '../game-instance';

let idCounter = 0;

export abstract class GameObject extends PIXI.Container {
  private _id: number;
  private _pos: Polar.Coord;
  private _prevPos: Polar.Coord;
  private _vel: Polar.Coord;
  private _accel: Polar.Coord;
  private _alive: boolean = true;
  protected _health: number = Infinity;

  public get id(): number {
    return this._id;
  }

  public get z(): number {
    return 0;
  }

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

  public get health(): number {
    return this._health;
  }

  public get movable(): boolean {
    return true;
  }

  public constructor() {
    super();
    idCounter++;
    this._id = idCounter;
    this._pos = new Polar.Coord();
    this._prevPos = new Polar.Coord();
    this._vel = new Polar.Coord();
    this._accel = new Polar.Coord();
  }

  public update(game: GameInstance): void {
    this.vel.r += this.accel.r;
    this.vel.theta += this.accel.theta;
    this.pos.r += this.vel.r;
    this.pos.theta += this.vel.theta;
  }

  public kill(): void {
    this._alive = false;
  }

  public damage(amount: number): void {
    this._health = Math.max(0, this._health - amount);
    if (this._health === 0) {
      this.kill();
    }
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
   * Returns a string identifying the team this object is on, used for
   * determining whether to damage a GameObject.
   */
  public team(): string { return 'neutral'; }

  /**
   * Respond to collision with another GameObject.
   */
  public abstract collide(other: GameObject, result: Collider.Result): void;

  /**
   * Get the bounds of this object as a polar rectangle.
   */
  public abstract getPolarBounds(): Polar.Rect;
}
