import { PolarCoord } from '../math/polar-coord';

export class GameObject {
  private _pos: PolarCoord;
  private _vel: PolarCoord;
  private _accel: PolarCoord;

  public get pos(): PolarCoord {
    return this._pos;
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

  public update(): void {
    this.vel.add(this.accel);
    this.pos.add(this.vel);
  }
}
