import * as Terrain from './objects/terrain';
import { Polar } from './math/polar';
import { GameObject } from './objects/game-object';

export class Level {
  protected _blocks: Terrain.Block[];
  protected _platforms: Terrain.Platform[];
  protected _decorations: Terrain.Decoration[];
  protected _playerSpawns: Polar.Coord[];

  public constructor(objects: Object) {
    // Add blocks from file data
    this._blocks = [];
    objects['blocks'].forEach((rectProps: Object) => {
      let rect = new Polar.Rect(
        rectProps['r'], rectProps['theta'],
        rectProps['height'], rectProps['width']
      );
      // If more than max width, add in pieces
      let maxWidth = Math.PI / 2;
      while (rect.width > maxWidth) {
        this._blocks.push(new Terrain.Block(
          rect.r,
          rect.theta,
          rect.height,
          maxWidth,
          rectProps['type'] || 'stone'
        ));
        rect.theta += maxWidth;
        rect.width -= maxWidth;
      }
      // Add leftover piece
      this._blocks.push(new Terrain.Block(
        rect.r,
        rect.theta,
        rect.height,
        rect.width,
        rectProps['type'] || 'stone'
      ));
    });
    // Add platforms from file data
    this._platforms = [];
    if (objects['platforms']) {
      objects['platforms'].forEach((rectProps: Object) => {
        let rect = new Polar.Rect(
          rectProps['r'], rectProps['theta'],
          rectProps['height'], rectProps['width']
        );
        // If more than max width, add in pieces - in the future this will
        // be the responsibility of the block and platform classes themselves
        let maxWidth = Math.PI / 2;
        while (rect.width > maxWidth) {
          this._platforms.push(new Terrain.Platform(
            rect.r,
            rect.theta,
            rect.height,
            maxWidth,
            rectProps['moves'] || false,
            rectProps['rate'] || 0,
            rectProps['rPrime'] || rect.r,
            rectProps['thetaPrime'] || rect.theta
          ));
          rect.theta += maxWidth;
          rect.width -= maxWidth;
        }
        // Add leftover piece
        this._platforms.push(new Terrain.Platform(
          rect.r,
          rect.theta,
          rect.height,
          rect.width,
          rectProps['moves'] || false,
          rectProps['rate'] || 0,
          rectProps['rPrime'] || rect.r,
          rectProps['thetaPrime'] || rect.theta
        ));
      });
    }
    // Add decorations from file data
    this._decorations = [];
    if (objects['decorations']) {
      objects['decorations'].forEach((rectProps: Object) => {
        let rect = new Polar.Rect(
          rectProps['r'], rectProps['theta'],
          rectProps['height'], rectProps['width']
        );
        // If more than max width, add in pieces
        let maxWidth = Math.PI / 2;
        while (rect.width > maxWidth) {
          this._decorations.push(new Terrain.Decoration(
            rect.r,
            rect.theta,
            rect.height,
            maxWidth,
            rectProps['type']
          ));
          rect.theta += maxWidth;
          rect.width -= maxWidth;
        }
        // Add leftover piece
        this._decorations.push(new Terrain.Decoration(
          rect.r,
          rect.theta,
          rect.height,
          rect.width,
          rectProps['type']
        ));
      });
    }
    // Add spawn points from file data
    this._playerSpawns = [];
    if (objects['playerSpawns']) {
      objects['playerSpawns'].forEach((spawnProps: Object) => {
        this._playerSpawns.push(new Polar.Coord(
          spawnProps['r'],
          spawnProps['theta']
        ));
      })
    } else {
      this._playerSpawns.push(new Polar.Coord(this.getOuterRadius() + 30, 0));
    }
  }

  /**
   * Returns a random spawn point from this level's list of player spawn
   * points.
   */
  public getPlayerSpawn(): Polar.Coord {
    let randomIndex = Math.floor(Math.random() * this._playerSpawns.length);
    return this._playerSpawns[randomIndex];
  }

  public getCoreRadius(): number {
    let min = Infinity;
    this._blocks.forEach(block => {
      min = Math.min(min, block.getPolarBounds().r);
    })
    this._platforms.forEach(platform => {
      min = Math.min(min, platform.getPolarBounds().r);
    })
    return min;
  }

  public getOuterRadius(): number {
    let max = 0;
    this._blocks.forEach(block => {
      max = Math.max(max, block.getPolarBounds().r);
    });
    this._platforms.forEach(platform => {
      max = Math.max(max, platform.getPolarBounds().r);
    });
    return max;
  }

  public getObjects(): GameObject[] {
    return [].concat(this._blocks, this._platforms, this._decorations);
  }
}
