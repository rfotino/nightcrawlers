import { Weapon } from './weapon';
import { BulletTrail } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Polar } from '../math/polar';
import { Config } from '../config';

export class Pistol extends Weapon {
  public type(): string { return 'pistol'; }

  public cooldown(): number { return Config.weapons.pistol.cooldown; }

  public fire(game: GameInstance): void {
    const offsetR = Config.weapons.pistol.offset.y;
    const offsetTheta = (
      (game.player.facingLeft ? -1 : 1) *
      Config.weapons.pistol.offset.x /
      game.player.pos.r
    );
    const dirOffsetR = (Math.random() - 0.5) * Config.weapons.pistol.spread;
    const bulletTrail = new BulletTrail(
      game,
      Config.weapons.pistol.range,
      offsetR,
      offsetTheta,
      dirOffsetR,
      Config.weapons.pistol.knockbackVel,
      Config.weapons.pistol.knockbackTime,
      Config.weapons.pistol.stunTime,
      Config.weapons.pistol.damage
    );
    game.addGameObject(bulletTrail);
  }
}
