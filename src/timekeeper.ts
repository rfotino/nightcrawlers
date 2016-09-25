export class TimeKeeper {
  private _isDay: boolean = true;
  private _time: number = 0;
  private _rate: number = 0.001;

  public update() {
    this._time += this._rate;
    if (this._time > 1) {
      this._time = 0;
      this._isDay = !this._isDay;
    }
  }

  public get isDay() {
    return this._isDay;
  }

  public get time() {
    return this._time;
  }
}
