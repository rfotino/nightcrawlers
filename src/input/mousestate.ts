/**
 * Keeps track of the state of the mouse. After adding event listeners,
 * you can use the isDown() or isPressed() functions to tell if a button is
 * held down or has just been pressed, respectively. In addition you can get
 * the x and y positions.
 */
export class MouseState {
  private _prevStates: {[key: number]: boolean} = {};
  private _states: {[key: number]: boolean} = {};
  private _x: number = 0;
  private _y: number = 0;

  public get x(): number { return this._x; }
  public get y(): number { return this._y; }

  public static get LEFT(): number { return 1; }
  public static get RIGHT(): number { return 2; }
  public static get MIDDLE(): number { return 4; }

  public addListeners(elem: HTMLElement) {
    [
      'mousedown',
      'mouseup',
      'mousemove',
      'mouseenter',
      'mouseexit',
    ].forEach(eventType => {
      elem.addEventListener(eventType, (e: MouseEvent) => {
        [
          MouseState.LEFT,
          MouseState.RIGHT,
          MouseState.MIDDLE,
        ].forEach(button => {
          this._states[button] = !!(e.buttons & button);
        })
        this._x = e.offsetX;
        this._y = e.offsetY;
      });
    });
  }

  public isDown(button: number): boolean {
    return !!this._states[button];
  }

  public isClicked(button: number): boolean {
    return !this._states[button] && !!this._prevStates[button];
  }

  public rollOver(): void {
    this._prevStates = {};
    for (let button in this._states) {
      if (this._states.hasOwnProperty(button)) {
        this._prevStates[button] = this._states[button];
      }
    }
  }
}
