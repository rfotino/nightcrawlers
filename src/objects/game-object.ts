import { PolarCoord } from '../math/polar-coord';
import { KeyState } from '../input/keystate';
import { Game } from '../game';

export class GameObject extends PIXI.Container {
  private _pos: PolarCoord;
  private _prevPos: PolarCoord;
  private _vel: PolarCoord;
  private _accel: PolarCoord;
  private _alive: boolean = true;

  public get pos(): PolarCoord {
    return this._pos;
  }

  public get prevPos(): PolarCoord {
    return this._prevPos;
  }

  public get vel(): PolarCoord {
    return this._vel;
  }

  public get accel(): PolarCoord {
    return this._accel;
  }

  public get alive(): boolean {
    return this._alive;
  }

  public constructor() {
    super();
    this._pos = new PolarCoord();
    this._prevPos = new PolarCoord();
    this._vel = new PolarCoord();
    this._accel = new PolarCoord();
  }

  public update(game: Game): void {
    this.vel.add(this.accel);
    this.pos.add(this.vel);
  }

  public kill(): void {
    this._alive = false;
  }

  public rollOver(): void {
    this._prevPos = this._pos.clone();
  }
}
