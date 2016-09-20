/**
 * A 2D polar coordinate with easy translation to cartesian coordinates.
 */
export class PolarCoord {
  private _r: number;
  private _theta: number;
  private _x: number;
  private _y: number;
  private _mirrorList: PIXI.Point[] = [];

  public set r(r) {
    this._r = r;
    this._updateCartesian();
  }

  public set theta(theta) {
    this._theta = theta;
    this._updateCartesian();
  }

  public get r() {
    return this._r;
  }

  public get theta() {
    return this._theta;
  }

  public get x() {
    return this._x;
  }

  public get y() {
    return this._y;
  }

  public constructor(r: number = 0, theta: number = 0) {
    this._r = r;
    this._theta = theta;
    this._updateCartesian();
  }

  public mirror(p: PIXI.Point) {
    p.x = this._x;
    p.y = this._y;
    this._mirrorList.push(p);
  }

  public add(p: PolarCoord) {
    this._r += p.r;
    this._theta += p.theta;
    this._updateCartesian();
  }

  public mul(n: number) {
    this._r *= n;
    this._theta *= n;
    this._updateCartesian();
  }

  private _updateCartesian(): void {
    this._x = this._r * Math.cos(this._theta);
    this._y = this._r * Math.sin(this._theta);
    this._mirrorList.forEach((p) => {
      p.x = this._x;
      p.y = this._y;
    });
  }
}
