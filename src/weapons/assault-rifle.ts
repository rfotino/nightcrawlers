import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Counter } from '../math/counter';

export class AssaultRifle extends Weapon {
  public type(): string { return 'assault'; }

  public cooldown(): number { return 10; }

  public isFullAuto(): boolean { return true; }

  public fire(game: GameInstance): void {
    let bullet = new Bullet(game);
    const offsetR = 11;
    const offsetTheta = (game.player.facingLeft ? -1 : 1) * 20 / bullet.pos.r;
    bullet.pos.r += offsetR;
    bullet.pos.theta += offsetTheta;
    game.addGameObject(bullet);
  }
}
