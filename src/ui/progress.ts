import { UIContainer } from './container';
import { UILabel } from './label';
import { Game } from '../game';
import { Color } from '../graphics/color';
import { Counter } from '../math/counter';

const FGCOLOR = new Color(100, 255, 255);

export class UIProgressBar extends UIContainer {
  protected _percentLabel: UILabel;
  protected _loadedBar: PIXI.Sprite;
  protected _progress: number = 0;

  public get progress(): number { return this._progress; }

  public set progress(progress: number) {
    // Clamp to [0, 100]
    this._progress = Math.max(0, Math.min(100, progress));
  }

  public constructor(game: Game) {
    super(game);
    this.bgcolor = new Color(200, 200, 200);
    // Create 1px sprite for loaded area
    this._loadedBar = new PIXI.Sprite(FGCOLOR.genTexture());
    this.addChild(this._loadedBar);
  }

  public doLayout(): void {
    super.doLayout();
    this.width = this._game.view.width * 0.7;
    this.height = 5;
  }

  public update(): void {
    super.update();
    // Adjust size of loaded bar
    this._loadedBar.x = 0;
    this._loadedBar.y = 0;
    this._loadedBar.width = this.width * this.progress / 100;
    this._loadedBar.height = this.height;
  }
}

export class MainProgressScreen extends UIContainer {
  protected _percentLabel: UILabel;
  protected _progressBar: UIProgressBar;
  protected _transitionCounter: Counter = new Counter(20);
  protected _transitioningIn: boolean = false;
  protected _transitioningOut: boolean = false;
  protected _fader: PIXI.Sprite;

  public set progress(progress: number) {
    this._percentLabel.title = `${progress.toFixed(0)}%`;
    this._progressBar.progress = progress;
  }

  public constructor(game: Game) {
    super(game);
    this._percentLabel = new UILabel(
      game,
      '0%',
      new PIXI.TextStyle({ fill: FGCOLOR.toString(), fontSize: 64 })
    );
    this._progressBar = new UIProgressBar(game);
    this.addComponent(this._percentLabel);
    this.addComponent(this._progressBar);
    this._fader = new PIXI.Sprite(new Color(0, 0, 0).genTexture());
    this._fader.alpha = 0;
    this.addChild(this._fader);
  }

  public doLayout(): void {
    super.doLayout();
    // Resize self to fit whole view
    this.width = this.view.width;
    this.height = this.view.height;
    // Center progress bar and percent label
    this._progressBar.x = (this.width - this._progressBar.width) / 2;
    this._progressBar.y = (this.height - this._progressBar.height) / 2;
    this._percentLabel.x = (this.width - this._percentLabel.width) / 2;
    this._percentLabel.y = this._progressBar.y - this._percentLabel.height;
  }

  public update(): void {
    super.update();
    if (this._transitioningIn || this._transitioningOut) {
      this._transitionCounter.next();
      if (this._transitionCounter.done()) {
        this._transitioningIn = this._transitioningOut = false;
      } else {
        this._fader.scale.set(this.width, this.height);
        if (this._transitioningIn) {
          this._fader.alpha = 1 - this._transitionCounter.percent();
        } else {
          this._fader.alpha = this._transitionCounter.percent();
        }
      }
    }
  }

  public isTransitionDone(): boolean {
    return !this._transitioningIn && !this._transitioningOut;
  }

  public startTransition(isIn: boolean): void {
    this._transitioningIn = isIn;
    this._transitioningOut = !isIn;
    this._transitionCounter.reset();
    if (this._transitioningIn) {
      this._fader.alpha = 1;
    } else {
      this._fader.alpha = 0;
    }
  }
}
