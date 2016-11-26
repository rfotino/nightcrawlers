import { Weapon } from './weapon';
import { BulletTrail } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Polar } from '../math/polar';

export class Pistol extends Weapon {
  public type(): string { return 'pistol'; }

  public cooldown(): number { return 10; }

  public fire(game: GameInstance): void {
    const offsetR = 9;
    const offsetTheta = (game.player.facingLeft ? -1 : 1) * 23 / game.player.pos.r;
    const bulletTrail = new BulletTrail(
      game,
      500, // maximum distance
      offsetR, // position offset
      offsetTheta, // position offset
      (Math.random() - 0.5) * 0.1 // direction offset R
    );
    game.addGameObject(bulletTrail);
  }
}
