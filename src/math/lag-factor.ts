/**
 * Module for maintaining a global "lag factor", used to speed up or slow down
 * actions, animations, timers, and the like if we are not hitting the 60 FPS
 * target. This lag factor is set by the class running the update/draw loop.
 */
export module LagFactor {
  let lagFactor = 1;
  
  export function get(): number {
    return lagFactor;
  }

  export function set(factor: number): void {
    lagFactor = factor;
  }
}
