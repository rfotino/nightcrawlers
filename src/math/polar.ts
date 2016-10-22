/**
 * A 2D polar coordinate with easy translation to cartesian coordinates.
 */
export module Polar {
  /**
   * Returns theta + 2*n*PI for some integer value of n to minimize
   * the distance between theta and the reference angle ref.
   */
  export function closestTheta(theta: number, ref: number): number {
    theta = (theta - ref) % (Math.PI * 2);
    if (theta < -Math.PI) {
      theta += Math.PI * 2;
    } else if (theta > Math.PI) {
      theta -= Math.PI * 2;
    }
    return theta + ref;
  }

  /**
   * Returns true if a normalized value of theta in terms of min and max is
   * between min and max.
   */
  export function thetaBetween(theta: number, min: number, max: number): boolean {
    theta = Polar.closestTheta(theta, (min + max) / 2);
    return theta >= min && theta <= max;
  }

  /**
   * Returns true if the given value of r is between min and max.
   */
  export function rBetween(r: number, min: number, max: number): boolean {
    return r >= min && r <= max;
  }

  /**
   * Returns true if r1 is above r2.
   */
  export function above(r1: Polar.Rect, r2: Polar.Rect): boolean {
    return r1.r - r1.height >= r2.r
  }

  /**
   * Returns true if r1 is to the right of r2.
   */
  export function aside(r1: Polar.Rect, r2: Polar.Rect): boolean {
    return Polar.closestTheta(r1.theta, r2.theta) >= r2.theta + r2.width;
  }

  /**
   * A class for 2D polar coordinates.
   */
  export class Coord {
    public r: number;
    public theta: number;

    public get x(): number {
      return this.r * Math.cos(this.theta);
    }

    public get y(): number {
      return this.r * Math.sin(this.theta);
    }

    public constructor(r: number = 0, theta: number = 0) {
      this.r = r;
      this.theta = theta;
    }

    public static fromCartesian(x: number, y: number): Polar.Coord {
      return new Polar.Coord(Math.sqrt(x**2 + y**2), Math.atan2(y, x));
    }

    public static dist(p1: Coord, p2: Coord): number {
      return Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
    }

    public dist(other: Coord): number {
      return Coord.dist(this, other);
    }

    public set(r: number, theta: number): void {
      this.r = r;
      this.theta = theta;
    }

    public clone(): Coord {
      return new Coord(this.r, this.theta);
    }
  }

  /**
   * A polar line, linearly interpolated from one Coord to another. Not
   * straight in cartesian terms, lines will curve unless they have equal
   * theta parts.
   */
  export class Line {
    public r1: number;
    public theta1: number;
    public r2: number;
    public theta2: number;

    public constructor(r1: number = 0, theta1: number = 0,
                       r2: number = 0, theta2: number = 0) {
      this.r1 = r1;
      this.theta1 = theta1;
      this.r2 = r2;
      this.theta2 = theta2;
    }

    /**
     * Returns true if this line segment intersects with the given horizontal
     * line segment, or false otherwise.
     */
    private _inLineOfSightHor(r: number, theta: number, w: number): boolean {
      // First make sure that the other line has positive width, which is a
      // requirement for intersection
      if (w <= 0) {
        return false;
      }
      // Then check if this line is horizontal, in that case we only intersect
      // if it lies on the other line
      if (this.r1 === this.r2) {
        return this.r1 === r;
      }
      // Get the closest theta2 and theta to this.theta1 as possible,
      // so that we do closest line of sight intersection
      let theta1 = this.theta1;
      let theta2 = closestTheta(this.theta2, theta1);
      theta = closestTheta(theta, theta1);
      // Solve for t1 and t2 in the parametric equations for each line of the
      // form p(t) = a + t(b - a) for a line segment ab and 0 < t < 1
      let t1 = (r - this.r1) / (this.r2 - this.r1);
      if (t1 <= 0 || t1 >= 1) {
        return false;
      }
      let t2 = (theta1 - theta + (t1 * (theta2 - theta1))) / w;
      if (t2 <= 0 || t2 >= 1) {
        return false;
      }
      return true;
    }

    /**
     * Returns true if this line segment intersects with the given vertical
     * line segment, or false otherwise.
     */
    private _inLineOfSightVer(r: number, theta: number, h: number): boolean {
      // First make sure that the other line has nonzero height, which is a
      // requirement for intersection
      if (h <= 0) {
        return false;
      }
      // Get the closest theta2 and theta to this.theta1 as possible,
      // so that we do closest line of sight intersection
      let theta1 = this.theta1;
      let theta2 = closestTheta(this.theta2, theta1);
      theta = closestTheta(theta, theta1);
      // Then check if this line is vertical, in that case we only intersect
      // if it lies on the other line
      if (theta1 === theta2) {
        return theta1 === theta;
      }
      // Solve for t1 and t2 in the parametric equations for each line of the
      // form p(t) = a + t(b - a) for a line segmnet ab and 0 < t < 1
      let t1 = (theta - theta1) / (theta2 - theta1);
      if (t1 <= 0 || t1 >= 1) {
        return false;
      }
      let t2 = (this.r1 - r + (t1 * (this.r2 - this.r1))) / h;
      if (t2 <= 0 || t2 >= 1) {
        return false;
      }
      return true;
    }

    /**
     * Returns true if the line segment intersects with the given polar
     * rectangle, or false otherwise.
     */
    public inLineOfSight(r: Rect): boolean {
      return (
        this._inLineOfSightHor(r.r, r.theta, r.width) ||
        this._inLineOfSightHor(r.r - r.height, r.theta, r.width) ||
        this._inLineOfSightVer(r.r - r.height, r.theta, r.height) ||
        this._inLineOfSightVer(r.r - r.height, r.theta + r.width, r.height)
      );
    }
  }

  /**
   * A polar rectangle, used for bounds checking.
   */
  export class Rect {
    public r: number;
    public theta: number;
    public height: number;
    public width: number;

    public constructor(r: number = 0, theta: number = 0,
                       height: number = 0, width: number = 0) {
      this.r = r;
      this.theta = theta;
      this.height = height;
      this.width = width;
    }

    public contains(p: Polar.Coord): boolean {
      if (p.r >= this.r - this.height && p.r <= this.r) {
        let closest = closestTheta(p.theta, this.theta + (this.width / 2));
        if (closest >= this.theta && closest <= this.theta + this.width) {
          return true;
        }
      }
      return false;
    }

    public intersects(rect: Polar.Rect): boolean {
      if (rBetween(this.r, rect.r - rect.height, rect.r) ||
          rBetween(this.r - this.height, rect.r - rect.height, rect.r) ||
          rBetween(rect.r, this.r - this.height, this.r) ||
          rBetween(rect.r - rect.height, this.r - this.height, this.r)) {
        if (thetaBetween(this.theta, rect.theta, rect.theta + rect.width) ||
            thetaBetween(this.theta + this.width, rect.theta, rect.theta + rect.width) ||
            thetaBetween(rect.theta, this.theta, this.theta + this.width) ||
            thetaBetween(rect.theta + rect.width, this.theta, this.theta + this.width)) {
              return true;
        }
      }
      return false;
    }
  }
}
