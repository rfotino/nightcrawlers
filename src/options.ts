import { Level } from './level';

/// <reference path="../typings/require.d.ts" />

export class Options {
  public debug: boolean = true;
  public soundOn: boolean = true;
  protected _levelData: Object;

  public get level(): Level {
    return new Level(this._levelData);
  }

  public set levelData(levelData: Object) {
    this._levelData = levelData;
  }

  public constructor() {
    this._levelData = require('../assets/levels/survival.json');
  }
}
