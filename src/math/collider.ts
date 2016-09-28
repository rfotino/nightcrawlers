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
   * A class used to store collisions from the previous frame.
   */
  export class Previous {
    private _results: PreviousResult[];

    public constructor() {
      this._results = [];
    }

    public get(obj1: GameObject, obj2: GameObject) {
      for (let i = 0; i < this._results.length; i++) {
        let prevResult = this._results[i];
        if (prevResult.obj1 === obj1 && prevResult.obj2 === obj2) {
          return prevResult.result;
        }
      }
      return new Result();
    }

    public set(obj1: GameObject, obj2: GameObject, result: Result) {
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
  export function test(obj1: GameObject, obj2: GameObject,
                       previous: Result): Result {
    let bounds1 = obj1.getPolarBounds();
    let bounds2 = obj2.getPolarBounds();
    let topLeft1 = bounds1.topLeft;
    let topLeft2 = bounds2.topLeft;
    let bottomRight1 = bounds1.bottomRight;
    let bottomRight2 = bounds2.bottomRight;
    let left = false, right = false, top = false, bottom = false;
    function thetaBetween(theta: number, min: number, max: number): boolean {
      if (theta < min) {
        while (theta < min) {
          theta += Math.PI * 2;
        }
      } else {
        while (theta > max) {
          theta -= Math.PI * 2;
        }
      }
      return theta >= min && theta <= max;
    }
    function rBetween(r: number, min: number, max: number): boolean {
      return r >= min && r <= max;
    }
    if (rBetween(topLeft1.r, bottomRight2.r, topLeft2.r) ||
        rBetween(bottomRight1.r, bottomRight2.r, topLeft2.r) ||
        rBetween(topLeft2.r, bottomRight1.r, topLeft1.r) ||
        rBetween(bottomRight2.r, bottomRight1.r, topLeft1.r)) {
      if (thetaBetween(topLeft1.theta, topLeft2.theta, bottomRight2.theta) ||
          thetaBetween(bottomRight1.theta, topLeft2.theta, bottomRight2.theta) ||
          thetaBetween(topLeft2.theta, topLeft1.theta, bottomRight1.theta) ||
          thetaBetween(bottomRight2.theta, topLeft1.theta, bottomRight1.theta)) {
        let relativeVel = obj2.vel.add(obj1.vel.mul(-1));
        if (relativeVel.r < 0) {
          top = true;
        } else if (relativeVel.r > 0) {
          bottom = true;
        } else {
          top = previous.top;
          bottom = previous.bottom;
        }
        if (relativeVel.theta < 0) {
          right = true;
        } else if (relativeVel.theta > 0) {
          left = true;
        } else {
          left = previous.left;
          right = previous.right;
        }
      }
    }
    return new Result(left, right, top, bottom);
  }
}
