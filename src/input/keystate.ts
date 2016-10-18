import { Game } from '../game';

/**
 * Keeps track of the state of all keys. After adding event listeners,
 * you can use the isDown() or isPressed() functions to tell if a key is
 * held down or has just been pressed, respectively.
 */
export class KeyState {
  private _prevStates: {[key: number]: boolean} = {};
  private _states: {[key: number]: boolean} = {};

  public static get BACKSPACE(): number { return 8; }
  public static get SHIFT(): number { return 16; }
  public static get ESCAPE(): number { return 27; }
  public static get SPACEBAR(): number { return 32; }
  public static get LEFTARROW(): number { return 37; }
  public static get UPARROW(): number { return 38; }
  public static get RIGHTARROW(): number { return 39; }
  public static get DOWNARROW(): number { return 40; }
  public static get ONE(): number { return 49; }

  public addListeners(elem: HTMLElement,
                      trigger?: (string, x: number, y: number) => void): void {
    elem.addEventListener('keydown', (e: KeyboardEvent) => {
      this._states[e.keyCode] = true;
      if (trigger) {
        trigger('keydown', -1, -1);
      }
    });
    elem.addEventListener('keyup', (e: KeyboardEvent) => {
      this._states[e.keyCode] = false;
      if (trigger) {
        trigger('keyup', -1, -1);
      }
    });
  }

  public isDown(keyCode: number): boolean {
    return !!this._states[keyCode];
  }

  public isPressed(keyCode: number): boolean {
    return !!this._states[keyCode] && !this._prevStates[keyCode];
  }

  public rollOver(): void {
    this._prevStates = {};
    for (let keyCode in this._states) {
      if (this._states.hasOwnProperty(keyCode)) {
        this._prevStates[keyCode] = this._states[keyCode];
      }
    }
  }
}
