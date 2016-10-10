export class TimeKeeper {
  protected _counter: number = 0;
  protected _isDay: boolean = true;
  protected _dayLength: number = 400;
  protected _transitioning: boolean = false;
  protected _transition: number = 0;
  protected _transitionLength: number = 50;

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
   * Updates the time of day for another frame.
   */
  public update() {
    this._counter++;
    if (this._transitioning) {
      if (this._counter > this._transitionLength) {
        this._counter = 0;
        this._isDay = !this._isDay;
        this._transitioning = false;
      }
      this._transition = this._counter / this._transitionLength;
    } else if (this._isDay) {
      if (this._counter > this._dayLength) {
        this._counter = 0;
        this._transitioning = true;
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
  }
}
