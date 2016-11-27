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
        bottom = false,
        middle = false;
    // Intersection is a prerequisite for collision
    if (bounds1.intersects(bounds2)) {
      middle = true;
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
    }
    return new Result(left, right, top, bottom, middle);
  }

  /**
   * Helper function for getRayRectIntersection().
   *
   * Returns the distance t along the ray of the form p(t) = origin + t * dir
   * that the ray intersects with the horizontal line segment defined by r,
   * theta, and w (where w is the width in radians of the segment). If the ray
   * does not intersect with the line segment or if t would be negative, null
   * is returned.
   */
  function _getRayLineHorIntersection(
    origin: Polar.Coord, dir: Polar.Coord,
    r: number, theta: number, w: number
  ): number {
    // First make sure that the horizontal line has positive width, which is a
    // requirement for intersection. Also make sure ray is not horizontal
    if (w <= 0 || dir.r === 0) {
      return null;
    }
    // Normalize theta to be as close to the origin of the ray as possible
    theta = Polar.closestTheta(theta, origin.theta);
    // Solve for t2 in the parametric equation of the form p(t) = origin + t*dir
    // for the ray
    const t2 = (r - origin.r) / dir.r;
    if (t2 < 0) {
      return null;
    }
    // Solve for t1 in the parametric equation of the horizontal line segment
    // of the form p(t) = (r, theta + w*t). If t is not between 0 and 1, there
    // is no intersection with the line segment
    const t1 = (origin.theta - theta + (t2 * dir.theta)) / w;
    if (t1 < 0 || t1 > 1) {
      return null;
    }
    // Return the multiple of dir along the ray that the intersection lies
    return t2;
  }

  /**
   * Helper function for getRayRectIntersection().
   *
   * Returns the distance t along the ray of the form p(t) = origin + t * dir
   * that the ray intersects with the vertical line segment defined by r,
   * theta, and h (where h is the height of the line segment). If the ray
   * does not intersect with the line segment or if t would be negative, null
   * is returned.
   */
  function _getRayLineVerIntersection(
    origin: Polar.Coord, dir: Polar.Coord,
    r: number, theta: number, h: number
  ): number {
    // First make sure that the vertical line has positive height, which is a
    // requirement for intersection. Also make sure ray is not vertical
    if (h <= 0 || dir.theta === 0) {
      return null;
    }
    // Normalize theta to be as close to the origin of the ray as possible
    theta = Polar.closestTheta(theta, origin.theta);
    // Solve for t2 in the parametric equation of the form p(t) = origin + t*dir
    // for the ray
    const t2 = (theta - origin.theta) / dir.theta;
    if (t2 < 0) {
      return null;
    }
    // Solve for t1 in the parametric equation of the vertical line segment
    // of the form p(t) = (r, theta + w*t). If t is not between 0 and 1, there
    // is no intersection with the line segment
    const t1 = (origin.r - r + (t2 * dir.r)) / h;
    if (t1 < 0 || t1 > 1) {
      return null;
    }
    // Return the multiple of dir along the ray that the intersection occurs
    return t2;
  }

  /**
   * Returns the point of intersection with the rectangle along the ray.
   * If there is no intersection with the rectangle, this returns null. If
   * there is an intersection, a number n is returned such that the point
   * of intersection is equal to origin + n*direction.
   */
  export function getRayRectIntersection(
    origin: Polar.Coord,
    dir: Polar.Coord,
    rect: Polar.Rect
  ): number {
    const intersections = [
      _getRayLineVerIntersection(origin, dir, rect.r - rect.height, rect.theta, rect.height),
      _getRayLineVerIntersection(origin, dir, rect.r - rect.height, rect.theta + rect.width, rect.height),
      _getRayLineHorIntersection(origin, dir, rect.r, rect.theta, rect.width),
      _getRayLineHorIntersection(origin, dir, rect.r - rect.height, rect.theta, rect.width),
      rect.contains(origin) ? 0 : null, // hack to cause collision when origin is inside rect
    ];
    const nonNullIntersections = intersections.filter(val => val !== null);
    if (nonNullIntersections.length <= 0) {
      return null;
    } else {
      return Math.min.apply(null, nonNullIntersections);
    }
  }
}
