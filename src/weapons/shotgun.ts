import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

export class Shotgun extends Weapon {
  public type(): string { return 'shotgun'; }

  public maybeFire(game: GameInstance): boolean {
    if (this.ammo > 0 && game.keyState.isPressed(KeyState.SPACEBAR)) {
      this.ammo--;
      let bullet1 = new Bullet(game);
      let bullet2 = new Bullet(game);
      let bullet3 = new Bullet(game);
      let rVel = 1;
      bullet1.vel.r = rVel;
      bullet2.vel.r = -rVel;
      game.addGameObject(bullet1);
      game.addGameObject(bullet2);
      game.addGameObject(bullet3);
      return true;
    }
    return false;
  }
}
