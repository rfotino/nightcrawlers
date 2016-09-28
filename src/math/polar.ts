/**
 * A 2D polar coordinate with easy translation to cartesian coordinates.
 */
export module Polar {
  export class Coord {
    private _r: number; // radial component
    private _theta: number; // angular component
    private _x: number;
    private _y: number;
    private _mirrorList: PIXI.DisplayObject[] = [];

    public set r(r: number) {
      this._r = r;
      this._updateCartesian();
    }

    public set theta(theta: number) {
      this._theta = theta;
      this._updateCartesian();
    }

    public get r(): number {
      return this._r;
    }

    public get theta(): number {
      return this._theta;
    }

    public get x(): number {
      return this._x;
    }

    public get y(): number {
      return this._y;
    }

    public constructor(r: number = 0, theta: number = 0) {
      this._r = r;
      this._theta = theta;
      this._updateCartesian();
    }

    public mirror(obj: PIXI.DisplayObject): void {
      obj.position.x = this._x;
      obj.position.y = this._y;
      obj.rotation = (Math.PI / 2) + this.theta;
      this._mirrorList.push(obj);
    }

    public add(p: Coord): Coord {
      return new Coord(this._r + p._r, this._theta + p._theta);
    }

    public mul(n: number) {
      return new Coord(this._r * n, this._theta * n);
    }

    public set(r: number, theta: number) {
      this._r = r;
      this._theta = theta;
      this._updateCartesian();
    }

    public clone(): Coord {
      return new Coord(this._r, this._theta);
    }

    private _updateCartesian(): void {
      this._x = this._r * Math.cos(this._theta);
      this._y = this._r * Math.sin(this._theta);
      this._mirrorList.forEach(obj => {
        obj.position.x = this._x;
        obj.position.y = this._y;
        obj.rotation = (Math.PI / 2) + this._theta;
      });
    }
  }

  /**
   * A polar rectangle, used for bounds checking.
   */
  export class Rect {
    private _r: number;
    private _theta: number;
    private _height: number;
    private _width: number;

    public get r(): number { return this._r; }
    public get theta(): number { return this._theta; }
    public get height(): number { return this._height; }
    public get width(): number { return this._width; }

    public set r(r: number) { this._r = r; }
    public set theta(theta: number) { this._theta = theta; }
    public set height(height: number) { this._height = height; }
    public set width(width: number) { this._width = width; }

    public get topLeft(): Coord {
      return new Coord(this._r, this._theta);
    }

    public get bottomRight(): Coord {
      return new Coord(this._r - this._height, this._theta + this._width);
    }

    public constructor(r: number = 0, theta: number = 0,
                       height: number = 0, width: number = 0) {
      this._r = r;
      this._theta = theta;
      this._height = height;
      this._width = width;
    }
  }
}
