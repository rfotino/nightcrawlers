import * as Terrain from './objects/terrain';
import { Polar } from './math/polar';
import { GameObject } from './objects/game-object';

export class Level {
  protected _blocks: Terrain.Block[];

  public constructor(objects: Object) {
    this._blocks = [];
    objects['blocks'].forEach((rect: Object) => {
      this._blocks.push(new Terrain.Block(
        rect['r'],
        rect['theta'],
        rect['height'],
        rect['width']
      ));
    });
  }

  public getCoreRadius(): number {
    let min = Infinity;
    this._blocks.forEach(block => {
      min = Math.min(min, block.getPolarBounds().r);
    })
    return min;
  }

  public getOuterRadius(): number {
    let max = 0;
    this._blocks.forEach(block => {
      max = Math.max(max, block.getPolarBounds().r);
    });
    return max;
  }

  public getObjects(): GameObject[] {
    return this._blocks;
  }
}
