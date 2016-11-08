import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

export class Pistol extends Weapon {
  public type(): string { return 'pistol'; }

  public maybeFire(game: GameInstance): boolean {
    if (this.ammo > 0 && game.keyState.isPressed(KeyState.SPACEBAR)) {
      this.ammo--;
      const offsetR = 9;
      const offsetTheta = (game.player.facingLeft ? -20 : 20) / game.player.pos.r;
      let bullet = new Bullet(game);
      bullet.pos.r += offsetR;
      bullet.pos.theta += offsetTheta;
      game.addGameObject(bullet);
      return true;
    }
    return false;
  }
}
