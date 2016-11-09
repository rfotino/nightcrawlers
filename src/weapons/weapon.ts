import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Counter } from '../math/counter';

export abstract class Weapon {
  public ammo: number;

  public constructor(ammo: number = 0) {
    this.ammo = ammo;
  }

  /**
   * Returns a string name of this weapon, like 'shotgun'.
   */
  public abstract type(): string;

  /**
   * Returns the cooldown between shots of this weapon, used by the player to
   * tell if we can fire.
   */
  public abstract cooldown(): number;

  /**
   * By default weapons are not fully automatic, you have to hit the fire key
   * each time you want to shoot again. Can be overridden for automatic weapons.
   */
  public isFullAuto(): boolean { return false; }

  /**
   * Fires the weapon (or swings in the case of the baseball bat). It is the
   * job of this function to handle adding any necessary game objects (like
   * bullets).
   */
  public abstract fire(game: GameInstance): void;
}
