import { LagFactor } from './lag-factor';

/**
 * Simple utility class for counting up from 0 to some maximum amount, usually
 * used as a timer. Supports resetting, checking for completion, incrementing,
 * getting percent progress, etc.
 */
export class Counter {
  public max: number;
  public step: number;
  public count: number;
  public useLag: boolean;

  public constructor(max: number = 0,
                     step: number = 1,
                     useLag: boolean = true) {
    this.max = max;
    this.step = step;
    this.count = 0;
    this.useLag = true;
  }

  public done(): boolean {
    return this.count >= this.max;
  }

  public next(): void {
    if (this.useLag) {
      this.count += this.step * LagFactor.get();
    } else {
      this.count += this.step;
    }
  }

  /**
   * Returns the percentage complete, clamped to the range [0, 1].
   */
  public percent(): number {
    return Math.min(1, Math.max(0, this.count / this.max));
  }

  public reset(): void {
    this.count = 0;
  }
}
