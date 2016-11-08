import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

export class Shotgun extends Weapon {
  public type(): string { return 'shotgun'; }

  public maybeFire(game: GameInstance): boolean {
    if (this.ammo > 0 && game.keyState.isPressed(KeyState.SPACEBAR)) {
      this.ammo--;
      let bullets = [new Bullet(game), new Bullet(game), new Bullet(game)];
      const rVel = 1;
      const offsetR = 11;
      const offsetTheta = (game.player.facingLeft ? -20 : 20) / game.player.pos.r;
      bullets[0].vel.r = rVel;
      bullets[1].vel.r = -rVel;
      bullets.forEach(bullet => {
        bullet.pos.r += offsetR;
        bullet.pos.theta += offsetTheta;
        game.addGameObject(bullet);
      });
      return true;
    }
    return false;
  }
}
