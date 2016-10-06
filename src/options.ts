import { Level } from './level';

/// <reference path="../typings/require.d.ts" />

export class Options {
  public debug: boolean;
  protected _levelData: Object;

  public get level(): Level {
    return new Level(this._levelData);
  }

  public set levelData(levelData: Object) {
    this._levelData = levelData;
  }

  public constructor() {
    this.debug = true;
    this._levelData = require('../levels/survival.json');
  }
}
