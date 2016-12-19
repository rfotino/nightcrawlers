import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import { Polar } from '../math/polar';
import { Counter } from '../math/counter';

export class FadingText extends GameObject {
  protected _text: PIXI.Text;
  protected _counter: Counter;

  /**
   * Fading text should be on top of most other objects, since it should always
   * be visible and soon disappears
   */
  public get z(): number { return 50; }

  public constructor(game: GameInstance,
                     text: string,
                     pos: Polar.Coord,
                     style: PIXI.TextStyle = new PIXI.TextStyle(),
                     time: number = 30) {
    super(game);
    this.pos.set(pos.r, pos.theta);
    style.fontFamily = style.fontFamily || 'sans-serif';
    style.fontSize = style.fontSize || 36;
    style.fill = style.fill || 'white';
    this._text = new PIXI.Text(text, style);
    this._mirrorList.push(this);
    this.addChild(this._text);
    // Have to manually center the text because align and textBaseline
    // properties are giving shifted and cut off text
    this._text.x = -this._text.width / 2;
    this._text.y = -this._text.height / 2;
    // Also add some random offset, for kicks
    this._text.x += 80 * (Math.random() - 0.5);
    this._text.y += 80 * (Math.random() - 0.5);
    // Set up fade counter
    this._counter = new Counter(time);
    // Arbitrary upward velocity so that it floats upward as it fades out
    this.vel.r = 1;
  }

  public collidable(): boolean { return false; }

  public type(): string { return 'text'; }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect(this.pos.r, this.pos.theta);
  }

  public updatePreCollision(): void {
    super.updatePreCollision();
    if (this._counter.done()) {
      this.kill();
    } else {
      this._counter.next();
      this._text.alpha = 1 - (this._counter.count / this._counter.max);
    }
  }
}
