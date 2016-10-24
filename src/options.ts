import { Level } from './level';

/// <reference path="../typings/require.d.ts" />

export class Options {
  // Default values for options
  protected _debug: boolean = false;
  protected _volume: number = 1;
  protected _levelData: Object;

  // Option getters simply return the protected value
  public get debug(): boolean {
    return this._debug;
  }

  public get volume(): number {
    return this._volume;
  }

  public get level(): Level {
    return new Level(this._levelData);
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

  public set levelData(levelData: Object) {
    this._levelData = levelData;
  }

  public constructor() {
    this._levelData = require('../assets/levels/survival.json');
    // Load options from local storage, if local storage is available and we
    // have saved options
    if (window['localStorage']) {
      let savedOptionsJson = localStorage.getItem('options');
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
    if (window['localStorage']) {
      localStorage.setItem('options', JSON.stringify({
        debug: this._debug,
        volume: this._volume,
      }));
    }
  }
}
