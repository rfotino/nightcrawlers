import { Level } from './level';
import { GameInstance } from './game-instance';

/**
 * Key used to store options JSON in local storage. Notice that we prefix the
 * key to make it unique to this application.
 */
const optionsLocalStorageKey = 'nightcrawlers.options';

/**
 * Check if local storage is available in a cross-browser manner.
 */
function localStorageAvailable(): boolean {
  try {
    let test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

export class Options {
  // Default values for options
  protected _debug: boolean = true;
  protected _volume: number = 1;

  // Option getters simply return the protected value
  public get debug(): boolean {
    return this._debug;
  }

  public get volume(): number {
    return this._volume;
  }

  // Option setters usually save the options to local storage
  public set debug(debug: boolean) {
    this._debug = debug;
    this._saveOptions();
  }

  public set volume(volume: number) {
    this._volume = volume;
    this._saveOptions();
  }

  public constructor() {
    // Load options from local storage, if local storage is available and we
    // have saved options
    if (localStorageAvailable()) {
      let savedOptionsJson = localStorage.getItem(optionsLocalStorageKey);
      if (savedOptionsJson !== null) {
        let savedOptions = JSON.parse(savedOptionsJson);
        this._debug = savedOptions.debug;
        this._volume = savedOptions.volume;
      }
    }
  }

  /**
   * Save options serialized as JSON in local storage, under the 'options'
   * key.
   */
  protected _saveOptions(): void {
    if (localStorageAvailable()) {
      localStorage.setItem(optionsLocalStorageKey, JSON.stringify({
        debug: this._debug,
        volume: this._volume,
      }));
    }
  }
}
