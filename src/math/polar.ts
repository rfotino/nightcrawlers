/**
 * A 2D polar coordinate with easy translation to cartesian coordinates.
 */
export module Polar {
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
  }

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
}
