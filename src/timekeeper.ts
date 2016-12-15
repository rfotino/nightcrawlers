import { LagFactor } from './math/lag-factor';

export class TimeKeeper {
  protected _dayNum: number = 1;
  protected _counter: number = 0;
  protected _isDay: boolean = true;
  protected _dayLength: number = 400;
  protected _transitioning: boolean = false;
  protected _transition: number = 0;
  protected _transitionLength: number = 50;
  protected _listeners: {[key: string]: Function[]} = {};

  /**
   * Returns the current day number so that the player can know how long they
   * have survived.
   */
  public get dayNum(): number {
    return this._dayNum;
  }

  /**
   * Returns true if it is currently day, false otherwise.
   */
  public get isDay(): boolean {
    return this._isDay;
  }

  /**
   * Returns true if it is currently night, false otherwise.
   */
  public get isNight(): boolean {
    return !this._isDay;
  }

  /**
   * Returns a number between 0 and 1 representing the progress through the
   * current day or night.
   */
  public get transition(): number {
    return this._transition;
  }

  /**
   * Return true if we are currently transitioning between day and night.
   */
  public get transitioning(): boolean {
    return this._transitioning;
  }

  /**
   * Updates the time of day for another frame.
   */
  public update() {
    this._counter += LagFactor.get();
    if (this._transitioning) {
      if (this._counter > this._transitionLength) {
        this._counter = 0;
        this._isDay = !this._isDay;
        this._transitioning = false;
        if (this._isDay) {
          this._dayNum++;
          this.trigger('daystart');
        } else {
          this.trigger('nightstart');
        }
      }
      this._transition = this._counter / this._transitionLength;
    } else if (this._isDay) {
      if (this._counter > this._dayLength) {
        this._counter = 0;
        this._transitioning = true;
        this.trigger('dayend');
      }
    }
  }

  /**
   * End the current night and begin transitioning into day.
   */
  public endNight() {
    this._counter = 0;
    this._isDay = false;
    this._transitioning = true;
    this._transition = 0;
    this.trigger('nightend');
  }

  /**
   * Register event listener for daystart, dayend, nightstart, nightend.
   */
  public on(event: string, callback: Function): TimeKeeper {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
    return this;
  }

  /**
   * Trigger callbacks for event with the given name.
   */
  public trigger(event: string) {
    let listeners = this._listeners[event];
    if (listeners) {
      listeners.forEach(callback => callback());
    }
  }
}
