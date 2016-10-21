import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

export class Pistol extends Weapon {
  public constructor() {
    super();
    this.ammo = 10;
  }

  public type(): string { return 'pistol'; }

  public maybeFire(game: GameInstance): void {
    if (this.ammo > 0 && game.keyState.isPressed(KeyState.SPACEBAR)) {
      this.ammo--;
      game.addGameObject(new Bullet(game.player));
    }
  }
}
