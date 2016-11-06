import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { Counter } from '../math/counter';
import { Item } from './item';

export class ItemSpawner {
  private _spawnCounter: Counter;
  protected _pos: Polar.Coord;
  protected _type: string;
  protected _item: Item;

  public get type(): string { return this._type; }

  public constructor(r: number, theta: number,
                     counterMax: number, type: string) {
    this._pos = new Polar.Coord(r, theta);
    this._spawnCounter = new Counter(counterMax);
    this._type = type;
    this._item = null;
  }

  public update(game: GameInstance): void {
    // If we have never spawned an item, spawn it immediately
    if (!this._item) {
      this._addItem(game);
    } else if (!this._item.alive) {
      // If the item has been taken by a user (and is no longer alive), count
      // up to spawning it again
      this._spawnCounter.next();
      if (this._spawnCounter.done()) {
        this._addItem(game);
      }
    }
  }

  protected _addItem(game: GameInstance): void {
    this._item = new Item(game, this._type, this._pos.r, this._pos.theta);
    this._spawnCounter.reset();
    game.addGameObject(this._item);
  }
}
