import { PolarCoord } from '../math/polar-coord';
import { KeyState } from '../input/keystate';

export class GameObject {
  private _pos: PolarCoord;
  private _prevPos: PolarCoord;
  private _vel: PolarCoord;
  private _accel: PolarCoord;

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

  public constructor() {
    this._pos = new PolarCoord();
    this._vel = new PolarCoord();
    this._accel = new PolarCoord();
  }

  public update(keyState: KeyState): void {
    this.vel.add(this.accel);
    this.pos.add(this.vel);
  }

  public rollOver(): void {
    this._prevPos = new PolarCoord(this._pos.r, this._pos.theta);
  }
}
