export class TimeKeeper {
  private _isDay: boolean = true;
  private _time: number = 0;
  private _dayLength = 400;
  private _nightLength = 600;

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
  public get time(): number {
    return this._time;
  }

  /**
   * Updates the time of day for another frame.
   */
  public update() {
    this._time += this._isDay ? 1 / this._dayLength : 1 / this._nightLength;
    if (this._time > 1) {
      this._time = 0;
      if (!this._isDay) {
        this._nightLength += 60;
      }
      this._isDay = !this._isDay;
    }
  }
}
