import { Weapon } from './weapon';
import { BulletTrail } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Counter } from '../math/counter';
import { Config } from '../config';

export class AssaultRifle extends Weapon {
  public type(): string { return 'assault'; }

  public cooldown(): number { return Config.weapons.assault.cooldown; }

  public isFullAuto(): boolean { return true; }

  public fire(game: GameInstance): void {
    const offsetR = Config.weapons.assault.offset.y;
    const offsetTheta = (
      (game.player.facingLeft ? -1 : 1) *
      Config.weapons.assault.offset.x /
      game.player.pos.r
    );
    const bulletTrail = new BulletTrail(
      game,
      Config.weapons.assault.range,
      offsetR, // origin offset
      offsetTheta, // origin offset
      (Math.random() - 0.5) * Config.weapons.assault.spread, // direction offset
      Config.weapons.assault.knockbackVel,
      Config.weapons.assault.knockbackTime,
      Config.weapons.assault.stunTime,
      Config.weapons.assault.damage
    );
    game.addGameObject(bulletTrail);
  }
}
