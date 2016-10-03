import { Level } from './level';

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
    this._levelData = {
      blocks: [
        { r: 1500, theta: 0, height: 1500, width: Math.PI * 2 },
        { r: 1550, theta: -0.5, height: 50, width: Math.PI / 4 },
      ],
    };
  }
}
