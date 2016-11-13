import { UIContainer } from './container';
import { UILabel } from './label';
import { MouseState } from '../input/mousestate';
import { TouchState } from '../input/touchstate';
import { Color } from '../graphics/color';
import { Game } from '../game';

export class UISlider extends UIContainer {
  public value: number;
  public min: number;
  public max: number;
  protected _label: UILabel;
  protected _track: PIXI.Sprite;
  protected _handle: PIXI.Sprite;
  protected _dragging: boolean = false;

  public constructor(game: Game, value: number = 1,
                     min: number = 0, max: number = 1) {
    super(game);
    this.value = value;
    this.min = min;
    this.max = max;
    this._track = new PIXI.Sprite(new Color(200, 200, 200).genTexture());
    this._handle = new PIXI.Sprite(new Color(255, 255, 255).genTexture());
    this._handle.anchor.x = 0.5;
    this.addChild(this._track);
    this.addChild(this._handle);
  }

  public doLayout(): void {
    super.doLayout();
    this.width = this._game.view.width * 0.2;
    this.height = 70;
  }

  public update(): void {
    super.update();
    // Resize handle
    let percent = (this.value - this.min) / (this.max - this.min);
    this._handle.width = this.width / 10;
    this._handle.height = this.height;
    this._handle.x = (this._handle.width / 2) + (percent * (this.width - this._handle.width));
    this._handle.y = 0;
    // Resize track
    this._track.width = this.width - this._handle.width;
    this._track.height = this.height / 2;
    this._track.x = this._handle.width / 2;
    this._track.y = (this.height - this._track.height) / 2;
    // Maybe update the value if the user clicked on the track
    let mousePos: {x: number, y: number};
    if (this._game.mouseState.isDown(MouseState.LEFT)) {
      mousePos = this._game.mouseState;
    } else if (this._game.touchState.isDown()) {
      mousePos = this._game.touchState;
    }
    let selfBounds = this.getBounds();
    if (mousePos &&
        (selfBounds.contains(mousePos.x, mousePos.y) || this._dragging)) {
      this._adjustValue(mousePos.x - selfBounds.x, mousePos.y - selfBounds.y);
      this._dragging = true;
    } else {
      this._dragging = false;
    }
  }

  /**
   * Adjust the slider value based on the x-position of the mouse.
   */
  protected _adjustValue(x: number, y: number): void {
    let percent = (x - (this._handle.width / 2)) / (this.width - this._handle.width);
    if (percent < 0) {
      percent = 0;
    } else if (percent > 1) {
      percent = 1;
    }
    let prevValue = this.value;
    this.value = this.min + (percent * (this.max - this.min));
    if (this.value !== prevValue) {
      this.trigger('change', x, y);
    }
  }
}

export class UISliderWithLabel extends UIContainer {
  protected _label: UILabel;
  protected _slider: UISlider;

  public get title(): string { return this._label.title; }
  public get value(): number { return this._slider.value; }
  public get min(): number { return this._slider.min; }
  public get max(): number { return this._slider.max; }

  public set title(title: string) { this._label.title = title; }
  public set value(value: number) { this._slider.value = value; }
  public set min(min: number) { this._slider.min = min; }
  public set max(max: number) { this._slider.max = max; }

  public constructor(game: Game, title: string,
                     value?: number, min?: number, max?: number,
                     style?: PIXI.TextStyle) {
    super(game);
    this._label = new UILabel(game, title, style);
    this._slider = new UISlider(game, value, min, max);
    this.addComponent(this._label);
    this.addComponent(this._slider);
    this._slider.addListener('change', (x: number, y: number) => {
      this.trigger('change', x, y);
    });
  }

  public doLayout(): void {
    super.doLayout();
    const margin = this._slider.width * 0.1;
    this.width = this._label.width + margin + this._slider.width;
    this.height = Math.max(this._label.height, this._slider.height);
    this._slider.x = this._label.width + margin;
  }
}
