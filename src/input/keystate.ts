import { Game } from '../game';

/**
 * Keeps track of the state of all keys. After adding event listeners,
 * you can use the isDown() or isPressed() functions to tell if a key is
 * held down or has just been pressed, respectively.
 */
export class KeyState {
  private _prevStates: {[key: string]: boolean} = {};
  private _states: {[key: string]: boolean} = {};

  public addListeners(elem: HTMLElement,
                      trigger?: (string, x: number, y: number) => void): void {
    elem.addEventListener('keydown', (e: KeyboardEvent) => {
      this._states[e.key] = true;
      if (trigger) {
        trigger('keydown', -1, -1);
      }
    });
    elem.addEventListener('keyup', (e: KeyboardEvent) => {
      this._states[e.key] = false;
      if (trigger) {
        trigger('keyup', -1, -1);
      }
    });
  }

  public isDown(key: string): boolean {
    return !!this._states[key];
  }

  public isPressed(key: string): boolean {
    return !!this._states[key] && !this._prevStates[key];
  }

  public rollOver(): void {
    this._prevStates = {};
    for (let key in this._states) {
      if (this._states.hasOwnProperty(key)) {
        this._prevStates[key] = this._states[key];
      }
    }
  }
}
