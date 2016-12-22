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
  private _a: number;

  public static get white(): Color {
    return new Color(255, 255, 255);
  }

  public get r(): number {
    return this._r;
  }

  public get g(): number {
    return this._g;
  }

  public get b(): number {
    return this._b;
  }

  public get a(): number {
    return this._a;
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

  public set a(a: number) {
    this._a = clamp(a, 0, 1);
  }

  public constructor(r: number = 0,
                     g: number = 0,
                     b: number = 0,
                     a: number = 1) {
    this._r = r;
    this._g = g;
    this._b = b;
    this._a = a;
  }

  /**
   * Generates a 1x1 PIXI.Texture object with the given color.
   */
  public genTexture(): PIXI.Texture {
    let canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = this.toString();
    ctx.fillRect(0, 0, 1, 1);
    return PIXI.Texture.fromCanvas(canvas);
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
   * Returns a 4-entry array with the RGBA values of the color normalized to
   * between 0 and 1.
   */
  public toVec4(): number[] {
    return [
      this._r / 255,
      this._g / 255,
      this._b / 255,
      this._a,
    ];
  }

  /**
   * Returns a CSS color string representing this color in the rgba(r, g, b, a)
   * format.
   */
  public toString(): string {
    let r = Math.round(this._r),
        g = Math.round(this._g),
        b = Math.round(this._b);
    return `rgba(${r}, ${g}, ${b}, ${this._a})`;
  }

  /**
   * Sets the RGB components of a color.
   */
  public set(r: number, g: number, b: number, a?: number): void {
    this.r = r;
    this.g = g;
    this.b = b;
    if (typeof a !== 'undefined') {
      this.a = a;
    }
  }

  /**
   * Blends the other color into this color by the given factor and returns
   * the result.
   * @arg other The color to blend into this color.
   * @arg factor A number between 0 and 1.
   */
  public blend(other: Color, factor: number): Color {
    factor = clamp(factor, 0, 1);
    const oneMinus = 1 - factor;
    return new Color(
      (this._r * oneMinus) + (other.r * factor),
      (this._g * oneMinus) + (other.g * factor),
      (this._b * oneMinus) + (other.b * factor),
      (this._a * oneMinus) + (other.a * factor)
    );
  }

  public clone(): Color {
    return new Color(this._r, this._g, this._b, this._a);
  }
}