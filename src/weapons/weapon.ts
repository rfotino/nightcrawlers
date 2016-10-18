import { GameInstance } from '../game-instance';

export abstract class Weapon {
  public ammo: number = Infinity;
  public abstract type(): string;
  public abstract maybeFire(game: GameInstance): void;
}
