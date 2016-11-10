import { Game } from '../game';

/**
 * Keeps track of the touch state for mobile devices. After adding event
 * listeners, you can use the isDown() and isPressed() functions and x and y
 * properties to tell the touch state on the screen.
 */
export class TouchState {
  private _prevDown: boolean;
  private _down: boolean;
  private _x: number = 0;
  private _y: number = 0;

  public get x(): number { return this._x; }
  public get y(): number { return this._y; }

  public static get LEFT(): number { return 1; }
  public static get RIGHT(): number { return 2; }
  public static get MIDDLE(): number { return 4; }

  public addListeners(elem: HTMLElement,
                      trigger?: (string, x: number, y: number) => void): void {
    [
      'touchstart',
      'touchend',
      'touchcancel',
      'touchmove',
    ].forEach(eventType => {
      elem.addEventListener(eventType, (e: TouchEvent) => {
        this._down = e.touches.length > 0;
        if (this._down) {
          let x = 0, y = 0;
          for (let i = 0; i < e.touches.length; i++) {
            let touch = e.touches.item(i);
            x += touch.clientX;
            y += touch.clientY;
          }
          this._x = x;
          this._y = y;
          elem.focus();
        }
        if (trigger) {
          trigger(eventType, this._x, this._y);
        }
      });
    });
  }

  public isDown(): boolean {
    return !!this._down;
  }

  public isPressed(): boolean {
    return !this._down && !!this._prevDown;
  }

  public rollOver(): void {
    this._prevDown = this._down;
  }
}
