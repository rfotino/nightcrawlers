import { GameInstance } from '../game-instance';

export abstract class Weapon {
  public ammo: number;

  public constructor(ammo: number = 0) {
    this.ammo = ammo;
  }

  public abstract type(): string;

  public abstract maybeFire(game: GameInstance): void;
}
