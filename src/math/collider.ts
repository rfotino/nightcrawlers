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
      return new Result(
        this._right,
        this._left,
        this._bottom,
        this._top
      );
    }
  }

  /**
   * A class used to store collisions from the previous frame.
   */
  export class Previous {
    private _results: Result[][] = [];
    private _bounds: Polar.Rect[] = [];

    public getBounds(obj: GameObject): Polar.Rect {
      return this._bounds[obj.id] || null;
    }

    public getResult(obj1: GameObject, obj2: GameObject): Result {
      let tier1 = this._results[obj1.id];
      return (tier1 && tier1[obj2.id]) || new Result();
    }

    public setBounds(obj: GameObject, bounds: Polar.Rect): void {
      this._bounds[obj.id] = bounds;
    }

    public setResult(obj1: GameObject, obj2: GameObject, result: Result): void {
      let obj1Id = obj1.id;
      if (!this._results[obj1Id]) {
        this._results[obj1Id] = [];
      }
      this._results[obj1Id][obj2.id] = result;
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
        bottom = false;
    // Intersection is a prerequisite for collision
    if (bounds1.intersects(bounds2)) {
      // If prevBounds2 is above bounds1 or bounds2 is above prevBounds1,
      // bounds2 hit bounds1 on the top. If bounds2 previously hit bounds1 on
      // the top and bounds2 is moving down relative to bounds1, keep top
      // collision asserted. Do something similar for each other side.
      top = (
        Polar.above(prevBounds2, bounds1) ||
        Polar.above(bounds2, prevBounds1) ||
        (prevResult.top && relVel.r <= 0)
      );
      bottom = (
        Polar.above(bounds1, prevBounds2) ||
        Polar.above(prevBounds1, bounds2) ||
        (prevResult.bottom && relVel.r >= 0)
      );
      right = (
        Polar.aside(prevBounds2, bounds1) ||
        Polar.aside(bounds2, prevBounds1) ||
        (prevResult.right && relVel.theta <= 0)
      );
      left = (
        Polar.aside(bounds1, prevBounds2) ||
        Polar.aside(prevBounds1, bounds2) ||
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
      // If there was no directional collision, default to top
      if (!left && !right && !top && !bottom) {
        top = true;
      }
    }
    return new Result(left, right, top, bottom);
  }
}
