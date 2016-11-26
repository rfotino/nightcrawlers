import { Weapon } from './weapon';
import { BulletTrail } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

export class Shotgun extends Weapon {
  public type(): string { return 'shotgun'; }

  public cooldown(): number { return 30; }

  public fire(game: GameInstance): void {
    const offsetR = 11;
    const offsetTheta = (game.player.facingLeft ? -20 : 20) / game.player.pos.r;
    for (let i = 0; i < 3; i++) {
      const bulletTrail = new BulletTrail(
        game,
        300, // max dist
        offsetR, // origin offset
        offsetTheta, // origin offset
        (Math.random() - 0.5) * 0.2, // direction offset R
      );
      game.addGameObject(bulletTrail);
    }
  }
}
