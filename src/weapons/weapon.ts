import { GameInstance } from '../game-instance';

export abstract class Weapon {
  public ammo: number;

  public constructor(ammo: number = 0) {
    this.ammo = ammo;
  }

  public abstract type(): string;

  /**
   * Maybe fires (or swings in the case of the baseball bat). Returns true if
   * it fired. It is the job of this function to handle cooldowns or handle
   * adding any necessary game objects (like bullets).
   */
  public abstract maybeFire(game: GameInstance): boolean;
}
