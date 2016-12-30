import * as Terrain from './objects/terrain';
import { Polar } from './math/polar';
import { GameObject } from './objects/game-object';
import { ItemSpawner } from './objects/item-spawner';
import { GameInstance } from './game-instance';

export class Level {
  protected _initialData: Object;
  protected _blocks: Terrain.Block[];
  protected _backgroundBlocks: Terrain.BackgroundBlock[];
  protected _platforms: Terrain.Platform[];
  protected _decorations: Terrain.Decoration[];
  protected _playerSpawns: Polar.Coord[];
  protected _itemSpawns: ItemSpawner[];
  protected _waves: {[key: string]: number}[];

  public get initialData(): Object { return this._initialData; }

  /**
   * Construct a level from a JSON object saved to a file by the level editor.
   */
  public constructor(game: GameInstance, initialData: Object) {
    this._initialData = initialData;
    // Add blocks from file data
    this._blocks = [];
    initialData['blocks'].forEach((rectProps: Object) => {
      this._blocks.push(new Terrain.Block(
        game,
        rectProps['r'],
        rectProps['theta'],
        rectProps['height'],
        rectProps['width'],
        rectProps['type'] || 'stone'
      ));
    });
    // Add background blocks from file data
    this._backgroundBlocks = [];
    initialData['backgroundBlocks'].forEach((rectProps: Object) => {
      this._backgroundBlocks.push(new Terrain.BackgroundBlock(
        game,
        rectProps['r'],
        rectProps['theta'],
        rectProps['height'],
        rectProps['width'],
        rectProps['type']
      ));
    });
    // Add platforms from file data
    this._platforms = [];
    if (initialData['platforms']) {
      initialData['platforms'].forEach((rectProps: Object) => {
        this._platforms.push(new Terrain.Platform(
          game,
          rectProps['r'],
          rectProps['theta'],
          rectProps['height'],
          rectProps['width'],
          rectProps['moves'] || false,
          rectProps['rate'] || 0,
          rectProps['thetaPrime'] || rectProps['theta']
        ));
      });
    }
    // Add decorations from file data
    this._decorations = [];
    if (initialData['decorations']) {
      initialData['decorations'].forEach((rectProps: Object) => {
        this._decorations.push(new Terrain.Decoration(
          game,
          rectProps['r'],
          rectProps['theta'],
          rectProps['type']
        ));
      });
    }
    // Add spawn points from file data
    this._playerSpawns = [];
    if (initialData['playerSpawns']) {
      initialData['playerSpawns'].forEach((spawnProps: Object) => {
        this._playerSpawns.push(new Polar.Coord(
          spawnProps['r'],
          spawnProps['theta']
        ));
      })
    } else {
      this._playerSpawns.push(new Polar.Coord(this.getOuterRadius() + 30, 0));
    }
    // Add item spawners from file data
    this._itemSpawns = [];
    if (initialData['itemSpawns']) {
      initialData['itemSpawns'].forEach((spawnProps: Object) => {
        this._itemSpawns.push(new ItemSpawner(
          spawnProps['r'],
          spawnProps['theta'],
          spawnProps['rate'],
          spawnProps['type']
        ));
      })
    }
    // Add waves of enemies from file data
    this._waves = initialData['waves'] || [];
  }

  /**
   * Returns a random spawn point from this level's list of player spawn
   * points.
   */
  public getPlayerSpawn(): Polar.Coord {
    let randomIndex = Math.floor(Math.random() * this._playerSpawns.length);
    return this._playerSpawns[randomIndex];
  }

  /**
   * Gets the radius of the lowest block/platform.
   */
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

  /**
   * Returns the radius of the highest block/platform.
   */
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

  /**
   * Gets all of the terrain game objects for this level.
   */
  public getObjects(): GameObject[] {
    return [].concat(
      this._blocks,
      this._backgroundBlocks,
      this._platforms,
      this._decorations
    );
  }

  /**
   * Returns all of the static item spawners for this level.
   */
  public getItemSpawners(): ItemSpawner[] {
    return this._itemSpawns;
  }

  /**
   * Get enemy wave i, starting at zero. Returns a {string: number} key value
   * pair of the form {enemyType: count}.
   */
  public getWave(i: number): {[key: string]: number} {
    if (i < 0 || this._waves.length <= 0) {
      return {};
    } else if (i < this._waves.length) {
      return this._waves[i];
    } else {
      // Past the end of the designed waves we just return 2 more of each
      // enemy type than the previous wave.
      let lastWave = this._waves[this._waves.length - 1];
      let newWave: {[key: string]: number} = {};
      for (let type in lastWave) {
        if (lastWave.hasOwnProperty(type)) {
          newWave[type] = lastWave[type] + (2 * (i - this._waves.length + 1));
        }
      }
      return newWave;
    }
  }
}
