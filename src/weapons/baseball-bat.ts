import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { Player } from '../objects/player';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

class BaseballBatBullet extends Bullet {
  public get width(): number { return 80; }
  public get height(): number { return 50; }

  // Bat knocks back enemies more than other weapons
  public get knockbackTime(): number { return 10; }

  public constructor(owner: Player) {
    super(owner);
    // Don't want the bat hitbox to get cleaned up when it immediately impacts
    // terrain upon spawning
    this._killedByTerrain = false;
    // Bat hitbox shouldn't move
    this.vel.set(0, 0);
    // Position the hitbox inside the player bounds but sticking out to the
    // left or right depending on where the player is facing
    let ownerBounds = owner.getPolarBounds();
    let thisBounds = this.getPolarBounds();
    if (owner.facingLeft) {
      this.pos.theta = (
        ownerBounds.theta + ownerBounds.width - (thisBounds.width / 2)
      );
    } else {
      this.pos.theta = ownerBounds.theta + (thisBounds.width / 2);
    }
    // Bat swing lasts a short amount of time
    this._lifespan = 3;
  }

  protected _getTexture(): PIXI.Texture {
    if (!BaseballBatBullet._texture) {
      let canvas = document.createElement('canvas');
      canvas.width = this.width + 2;
      canvas.height = this.height + 2;
      let ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillRect(1, 1, this.width, this.height);
      BaseballBatBullet._texture = PIXI.Texture.fromCanvas(canvas);
    }
    return BaseballBatBullet._texture;
  }
}

export class BaseballBat extends Weapon {
  public type(): string { return 'baseball-bat'; }

  public maybeFire(game: GameInstance): void {
    if (game.keyState.isPressed(KeyState.SPACEBAR)) {
      game.addGameObject(new BaseballBatBullet(game.player));
    }
  }
}
