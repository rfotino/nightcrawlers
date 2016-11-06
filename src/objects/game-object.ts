import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { LagFactor } from '../math/lag-factor';
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
  private _onSolidGround: boolean = false;
  private _groundVel: number = 0;
  private _ground: GameObject = null;
  protected _game: GameInstance;
  protected _maxHealth: number = Infinity;
  protected _health: number = Infinity;
  protected _mirrorList: PIXI.DisplayObject[] = [];

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

  /**
   * Don't let health go above max health or below zero.
   */
  public set health(health: number) {
    this._health = Math.max(0, Math.min(this._maxHealth, health));
  }

  public get maxHealth(): number {
    return this._maxHealth;
  }

  public constructor(game: GameInstance) {
    super();
    idCounter++;
    this._id = idCounter;
    this._game = game;
    this._pos = new Polar.Coord();
    this._prevPos = new Polar.Coord();
    this._vel = new Polar.Coord();
    this._accel = new Polar.Coord();
  }

  public collidable(): boolean { return true; }

  public movable(): boolean { return true; }

  public mirror(): void {
    this._mirrorList.forEach(obj => {
      obj.position.x = this.pos.x;
      obj.position.y = this.pos.y;
      obj.rotation = (Math.PI / 2) + this.pos.theta;
    });
  }

  public update(): void {
    const lagFactor = LagFactor.get();
    this.vel.r += this.accel.r * lagFactor;
    this.vel.theta += this.accel.theta * lagFactor;
    this.pos.r += this.vel.r * lagFactor;
    this.pos.theta += this.vel.theta * lagFactor;
    this.pos.theta += this._groundVel * lagFactor;
    this._groundVel = 0;
  }

  public kill(): void {
    this._alive = false;
  }

  public damage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.kill();
    }
  }

  public rollOver(): void {
    this._prevPos = this._pos.clone();
    this._onSolidGround = !!this._ground;
    this._ground = null;
  }

  protected _isOnSolidGround(): boolean {
    return this._onSolidGround;
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
   * Respond to collision with another GameObject. Default is to set to true
   * that we're on the ground if we touch a platform or block from the bottom.
   */
  public collide(other: GameObject, result: Collider.Result): void {
    switch (other.type()) {
      case 'platform':
      case 'block':
        if (result.bottom) {
          this._ground = other;
          this._groundVel = other.vel.theta;
        }
        break;
    }
  }

  /**
   * Get the bounds of this object as a polar rectangle.
   */
  public abstract getPolarBounds(): Polar.Rect;
}
