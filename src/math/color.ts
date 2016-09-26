/**
 * Clamps a value between the given min and max, inclusive.
 */
function clamp(value: number, min: number, max: number): number {
  return (value < min ? min : (value > max ? max : value));
}

/**
 * A color class with RGB components that can be easily translated to PIXI's
 * color format.
 */
export class Color {
  private _r: number;
  private _g: number;
  private _b: number;

  public get r(): number {
    return this._r;
  }

  public get g(): number {
    return this._g;
  }

  public get b(): number {
    return this._b;
  }

  public set r(r: number) {
    this._r = clamp(r, 0, 255);
  }

  public set g(g: number) {
    this._g = clamp(g, 0, 255);
  }

  public set b(b: number) {
    this._b = clamp(b, 0, 255);
  }

  public constructor(r: number = 0, g: number = 0, b: number = 0) {
    this._r = r;
    this._g = g;
    this._b = b;
  }

  /**
   * Returns a single number representing the color in PIXI's preferred
   * format.
   */
  public toPixi(): number {
    return (
      (Math.round(this._r) << 16) |
      (Math.round(this._g) << 8) |
      Math.round(this._b)
    );
  }

  /**
   * Sets the RGB components of a color.
   */
  public set(r: number, g: number, b: number): void {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  /**
   * Blends the other color into this color by the given factor.
   * @arg other The color to blend into this color.
   * @arg factor A number between 0 and 1.
   */
  public blend(other: Color, factor: number): void {
    factor = clamp(factor, 0, 1);
    let oneMinus = 1 - factor;
    this._r = (this._r * oneMinus) + (other.r * factor);
    this._g = (this._g * oneMinus) + (other.g * factor);
    this._b = (this._b * oneMinus) + (other.b * factor);
  }

  public clone(): Color {
    return new Color(this._r, this._g, this._b);
  }
}