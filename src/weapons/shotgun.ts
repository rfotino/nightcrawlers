import { Weapon } from './weapon';
import { BulletTrail } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

export class Shotgun extends Weapon {
  public type(): string { return 'shotgun'; }

  public cooldown(): number { return 30; }

  public fire(game: GameInstance): void {
    const offsetR = 11;
    const offsetTheta = (game.player.facingLeft ? -1 : 1) * 45 / game.player.pos.r;
    const spread = 0.1;
    [-spread, 0, spread].forEach(dirOffsetR => {
      const bulletTrail = new BulletTrail(
        game,
        300, // max dist
        offsetR, // origin offset
        offsetTheta, // origin offset
        dirOffsetR + (Math.random() - 0.5) * spread / 2 // direction offset R
      );
      game.addGameObject(bulletTrail);
    });
  }
}
