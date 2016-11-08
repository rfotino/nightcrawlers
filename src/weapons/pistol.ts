import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

export class Pistol extends Weapon {
  public type(): string { return 'pistol'; }

  public maybeFire(game: GameInstance): boolean {
    if (this.ammo > 0 && game.keyState.isPressed(KeyState.SPACEBAR)) {
      this.ammo--;
      const BULLET_OFFSET = 9;
      let bullet = new Bullet(game);
      bullet.pos.r += BULLET_OFFSET;
      game.addGameObject(bullet);
      return true;
    }
    return false;
  }
}
