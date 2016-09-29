import { GameObject } from '../objects/game-object';
import { Polar } from './polar';

export module Collider {
  /**
   * A class representing the result of the collision of obj1 with respect to
   * obj2. To get the collision of obj2 with respect to obj1, call
   * Result.reverse().
   */
  export class Result {
    private _left: boolean;
    private _right: boolean;
    private _top: boolean;
    private _bottom: boolean;

    public get left(): boolean {
      return this._left;
    }

    public get right(): boolean {
      return this._right;
    }

    public get top(): boolean {
      return this._top;
    }

    public get bottom(): boolean {
      return this._bottom;
    }

    public get any(): boolean {
      return this._left || this._right || this._top || this._bottom;
    }

    public constructor(left: boolean = false, right: boolean = false,
                       top: boolean = false, bottom: boolean = false) {
      this._left = left;
      this._right = right;
      this._top = top;
      this._bottom = bottom;
    }

    public reverse(): Result {
      return new Result(this._right, this._left, this._bottom, this._top);
    }
  }

  /**
   * Module-private helper class used for Collider.Previous.
   */
  class PreviousResult {
    public obj1: GameObject;
    public obj2: GameObject;
    public result: Result;

    public constructor(obj1: GameObject, obj2: GameObject, result: Result) {
      this.obj1 = obj1;
      this.obj2 = obj2;
      this.result = result;
    }
  }

  /**
   * Module-private helper class used for Collider.Previous
   */
  class PreviousBounds {
    public obj: GameObject;
    public bounds: Polar.Rect;

    public constructor(obj: GameObject, bounds: Polar.Rect) {
      this.obj = obj;
      this.bounds = bounds;
    }
  }

  /**
   * A class used to store collisions from the previous frame.
   */
  export class Previous {
    private _results: PreviousResult[];
    private _bounds: PreviousBounds[];

    public constructor() {
      this._results = [];
      this._bounds = [];
    }

    public getBounds(obj: GameObject): Polar.Rect {
      for (let i = 0; i < this._bounds.length; i++) {
        let prevBounds = this._bounds[i];
        if (prevBounds.obj === obj) {
          return prevBounds.bounds;
        }
      }
      return null;
    }

    public getResult(obj1: GameObject, obj2: GameObject): Result {
      for (let i = 0; i < this._results.length; i++) {
        let prevResult = this._results[i];
        if (prevResult.obj1 === obj1 && prevResult.obj2 === obj2) {
          return prevResult.result;
        }
      }
      return new Result();
    }

    public setBounds(obj: GameObject, bounds: Polar.Rect): void {
      let found = false;
      this._bounds.forEach(prevBounds => {
        if (prevBounds.obj === obj) {
          prevBounds.bounds = bounds;
          found = true;
        }
      });
      if (!found) {
        this._bounds.push(new PreviousBounds(obj, bounds));
      }
    }

    public setResult(obj1: GameObject, obj2: GameObject, result: Result): void {
      let found = false;
      this._results.forEach(prevResult => {
        if (prevResult.obj1 === obj1 && prevResult.obj2 === obj2) {
          prevResult.result = result;
          found = true;
        }
      });
      if (!found) {
        this._results.push(new PreviousResult(obj1, obj2, result));
      }
    }
  }

  /**
   * Test two objects for collision, and return the result of the collision
   * in terms of a Collider.Result object.
   */
  export function test(
      bounds1: Polar.Rect,
      bounds2: Polar.Rect,
      prevBounds1: Polar.Rect,
      prevBounds2: Polar.Rect,
      prevResult: Result,
      relVel: Polar.Coord
  ): Result {
    // Default to false
    let left = false, right = false, top = false, bottom = false;
    // Normalize theta in terms of min and max. Returned value is equal to
    // theta + n*2*PI for some integer value of n. In addition, the returned
    // value is greater or equal to min but not greater by more than 2*PI.
    function thetaNormalize(theta: number, min: number, max: number): number {
      while (theta > max) {
        theta -= Math.PI * 2;
      }
      while (theta < min) {
        theta += Math.PI * 2;
      }
      return theta;
    }
    // Returns true if a normalized value of theta in terms of min and max is
    // between min and max.
    function thetaBetween(theta: number, min: number, max: number): boolean {
      theta = thetaNormalize(theta, min, max);
      return theta >= min && theta <= max;
    }
    // Returns true if the given value of r is between min and max.
    function rBetween(r: number, min: number, max: number): boolean {
      return r >= min && r <= max;
    }
    // Returns true if r1 intersects with r2
    function intersect(r1: Polar.Rect, r2: Polar.Rect): boolean {
      let tl1 = r1.topLeft;
      let tl2 = r2.topLeft;
      let br1 = r1.bottomRight;
      let br2 = r2.bottomRight;
      if (rBetween(tl1.r, br2.r, tl2.r) ||
          rBetween(br1.r, br2.r, tl2.r) ||
          rBetween(tl2.r, br1.r, tl1.r) ||
          rBetween(br2.r, br1.r, tl1.r)) {
        if (thetaBetween(tl1.theta, tl2.theta, br2.theta) ||
            thetaBetween(br1.theta, tl2.theta, br2.theta) ||
            thetaBetween(tl2.theta, tl1.theta, br1.theta) ||
            thetaBetween(br2.theta, tl1.theta, br1.theta)) {
              return true;
        }
      }
      return false;
    }
    // Returns true if r1 is above r2
    function above(r1: Polar.Rect, r2: Polar.Rect): boolean {
      let tl2 = r2.topLeft;
      let br1 = r1.bottomRight;
      return br1.r >= tl2.r;
    }
    // Returns true if r1 is to the right of r2
    function aside(r1: Polar.Rect, r2: Polar.Rect): boolean {
      let tl1 = r1.topLeft;
      let tl2 = r2.topLeft;
      let br2 = r2.bottomRight;
      return thetaNormalize(tl1.theta, tl2.theta, br2.theta) >= br2.theta;
    }
    // Intersection is a prerequisite for collision
    if (intersect(bounds1, bounds2)) {
      // If prevBounds2 is above bounds1 or bounds2 is above prevBounds1,
      // bounds2 hit bounds1 on the top. If bounds2 previously hit bounds1 on
      // the top and bounds2 is moving down relative to bounds1, keep top
      // collision asserted. Do something similar for each other side.
      top = (
        above(prevBounds2, bounds1) ||
        above(bounds2, prevBounds1) ||
        (prevResult.top && relVel.r <= 0)
      );
      bottom = (
        above(bounds1, prevBounds2) ||
        above(prevBounds1, bounds2) ||
        (prevResult.bottom && relVel.r >= 0)
      );
      right = (
        aside(prevBounds2, bounds1) ||
        aside(bounds2, prevBounds1) ||
        (prevResult.right && relVel.theta <= 0)
      );
      left = (
        aside(bounds1, prevBounds2) ||
        aside(prevBounds1, bounds2) ||
        (prevResult.left && relVel.theta >= 0)
      );
    }
    return new Result(left, right, top, bottom);
  }
}
