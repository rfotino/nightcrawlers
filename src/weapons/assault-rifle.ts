import { Weapon } from './weapon';
import { BulletTrail } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Counter } from '../math/counter';

export class AssaultRifle extends Weapon {
  public type(): string { return 'assault'; }

  public cooldown(): number { return 6; }

  public isFullAuto(): boolean { return true; }

  public fire(game: GameInstance): void {
    const offsetR = 11;
    const offsetTheta = (game.player.facingLeft ? -1 : 1) * 35 / game.player.pos.r;
    const bulletTrail = new BulletTrail(
      game,
      500, // max dist
      offsetR, // origin offset
      offsetTheta, // origin offset
      (Math.random() - 0.5) * 0.1 // direction offset
    );
    game.addGameObject(bulletTrail);
  }
}
