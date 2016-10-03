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
    private _middle: boolean;

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
      return (
        this._left || this._right || this._top || this._bottom || this._middle
      );
    }

    public constructor(left: boolean = false, right: boolean = false,
                       top: boolean = false, bottom: boolean = false,
                       middle: boolean = false) {
      this._left = left;
      this._right = right;
      this._top = top;
      this._bottom = bottom;
      this._middle = middle;
    }

    public reverse(): Result {
      return new Result(
        this._right,
        this._left,
        this._bottom,
        this._top,
        this._middle
      );
    }
  }

  /**
   * A class used to store collisions from the previous frame.
   */
  export class Previous {
    private _results: {[key: string]: Result};
    private _bounds: {[key: number]: Polar.Rect};

    public constructor() {
      this._results = {};
      this._bounds = {};
    }

    public getBounds(obj: GameObject): Polar.Rect {
      return this._bounds[obj.id] || null;
    }

    public getResult(obj1: GameObject, obj2: GameObject): Result {
      return this._results[`${obj1.id}+${obj2.id}`] || new Result();
    }

    public setBounds(obj: GameObject, bounds: Polar.Rect): void {
      this._bounds[obj.id] = bounds;
    }

    public setResult(obj1: GameObject, obj2: GameObject, result: Result): void {
      this._results[`${obj1.id}+${obj2.id}`] = result;
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
    let left = false,
        right = false,
        top = false,
        bottom = false,
        middle = false;
    // Returns true if a normalized value of theta in terms of min and max is
    // between min and max.
    function thetaBetween(theta: number, min: number, max: number): boolean {
      theta = Polar.closestTheta(theta, (min + max) / 2);
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
      return Polar.closestTheta(tl1.theta, tl2.theta) >= br2.theta;
    }
    // Intersection is a prerequisite for collision
    if (intersect(bounds1, bounds2)) {
      middle = true;
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
      // Only allow one direction at a time, give preference to top/bottom
      // over left/right
      if (left && (top || bottom)) {
        left = false;
      }
      if (right && (top || bottom)) {
        right = false;
      }
    }
    return new Result(left, right, top, bottom, middle);
  }
}
