import { UIContainer } from './container';
import { UILabel } from './label';
import { Game } from '../game';
import { Color } from '../graphics/color';

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
    this._loadedBar = new PIXI.Sprite(new Color(0, 200, 0).genTexture());
    this.addChild(this._loadedBar);
    // Add percent text label
    this._percentLabel = new UILabel(game, '0%', 'black');
    this.addComponent(this._percentLabel);
  }

  public update(): void {
    super.update();
    // Adjust size of loaded bar
    this._loadedBar.x = 0;
    this._loadedBar.y = 0;
    this._loadedBar.width = this.width * this.progress / 100;
    this._loadedBar.height = this.height;
    // Adjust text content to match percentage progress
    this._percentLabel.title = `${this.progress.toFixed(0)}%`;
  }

  public doLayout(): void {
    // Adjust height of text label, then let it do its own layout (which
    // changes its width)
    this._percentLabel.height = this.height * 0.8;
    super.doLayout();
    // Center percent label
    this._percentLabel.x = (this.width - this._percentLabel.width) / 2;
    this._percentLabel.y = (this.height - this._percentLabel.height) / 2;
  }
}

export class MainProgressScreen extends UIContainer {
  protected _title: UILabel;
  protected _progressBar: UIProgressBar;

  public set progress(progress: number) {
    this._progressBar.progress = progress;
  }

  public constructor(game: Game) {
    super(game);
    this._title = new UILabel(game, 'Loading...');
    this._progressBar = new UIProgressBar(game);
    this.addComponent(this._title);
    this.addComponent(this._progressBar);
  }

  public doLayout(): void {
    // Resize self to fit whole view
    this.width = this.view.width;
    this.height = this.view.height;
    // Set some sizes of child components
    this._title.height = this.height * 0.2;
    this._title.y = this.height * 0.2;
    this._progressBar.width = this.width * 0.8;
    this._progressBar.height = this.height * 0.2;
    this._progressBar.y = this.height * 0.5;
    // Then update the child components, which may change their width
    super.doLayout();
    // Then center child components
    this._title.x = (this.width - this._title.width) / 2;
    this._progressBar.x = (this.width - this._progressBar.width) / 2;
  }
}
