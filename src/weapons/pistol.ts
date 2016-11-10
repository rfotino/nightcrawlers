import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

export class Pistol extends Weapon {
  public type(): string { return 'pistol'; }

  public cooldown(): number { return 10; }

  public fire(game: GameInstance): void {
    const offsetR = 9;
    const offsetTheta = (game.player.facingLeft ? -20 : 20) / game.player.pos.r;
    let bullet = new Bullet(game);
    bullet.pos.r += offsetR;
    bullet.pos.theta += offsetTheta;
    game.addGameObject(bullet);
  }
}
