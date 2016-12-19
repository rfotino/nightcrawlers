import { UIContainer } from './container';
import { UILabel } from './label';
import { LagFactor } from '../math/lag-factor';
import { Color } from '../graphics/color';
import { Config } from '../config';
import { Game } from '../game';
import { GameInstance } from '../game-instance';

export class ScoreMultiplier extends UIContainer {
  protected _displayedValue: number = 1;
  protected _trueValue: number = 1;
  protected _label: UILabel;
  protected _progress: PIXI.Graphics;
  protected _gameInst: GameInstance;

  protected static get DIAMETER(): number { return 100; }

  public get value(): number {
    return Math.floor(this._displayedValue);
  }

  public constructor(game: Game, gameInst: GameInstance) {
    super(game);
    this._gameInst = gameInst;
    this._label = new UILabel(
      game,
      '',
      new PIXI.TextStyle({ fontSize: 36, fill: 'white' })
    );
    this._progress = new PIXI.Graphics();
    this.addChild(this._progress);
    this.addComponent(this._label);
    this.width = this.height = ScoreMultiplier.DIAMETER;
  }

  /**
   * Increase multiplier according to the number of points earned.
   */
  public increase(points: number): void {
    const EPSILON = 0.01;
    this._trueValue = Math.min(
      this._trueValue + (points * Config.player.scoreMultiplierBonusPerPoint),
      Config.player.maxScoreMultiplier + 1 - EPSILON
    );
  }

  /**
   * Decrease multiplier according to the amount of damage.
   */
  public decrease(damage: number): void {
    this._trueValue -= damage * Config.player.scoreMultiplierPenaltyPerDamage;
    if (this._trueValue < 1) {
      this._trueValue = 1;
    }
  }

  /**
   * Center the label.
   */
  public doLayout(): void {
    super.doLayout();
    this._label.x = (this.width - this._label.width) / 2;
    this._label.y = (this.height - this._label.height) / 2;
  }

  /**
   * Drain score multiplier value by a small amount each tick and update the
   * UI graphics.
   */
  public update(): void {
    super.update();
    // Do nothing if paused
    if (this._gameInst.isPaused()) {
      return;
    }
    // Drain score multiplier
    const drainAmount = (
      Config.player.scoreMultiplierDrainSpeedMin +
      (
        (
          Config.player.scoreMultiplierDrainSpeedMax -
          Config.player.scoreMultiplierDrainSpeedMin
        ) *
        ((this._displayedValue - 1) / Config.player.maxScoreMultiplier)
      )
    );
    this._trueValue -= drainAmount * LagFactor.get();
    if (this._trueValue < 1) {
      this._trueValue = 1;
    }
    // Bring value closer to true value. Don't let the displayed value move
    // faster than maxValueDiff per tick.
    const desiredNewValue = (this._displayedValue + this._trueValue) / 2;
    const maxValueDiff = 0.1 * LagFactor.get();
    if (desiredNewValue > this._displayedValue + maxValueDiff) {
      this._displayedValue += maxValueDiff;
    } else if (desiredNewValue < this._displayedValue - maxValueDiff) {
      this._displayedValue -= maxValueDiff;
    } else {
      this._displayedValue = desiredNewValue;
    }
    // Update label text
    this._label.title = `x${this.value}`;
    // Update circular progress bar graphic
    const progressWidth = 3;
    const progressPercent = this._displayedValue - Math.floor(this._displayedValue);
    this._progress.clear();
    this._progress.beginFill(Color.white.toPixi(), 0);
    this._progress.lineStyle(progressWidth, Color.white.toPixi());
    this._progress.moveTo(this.width / 2, progressWidth / 2);
    this._progress.arc(
      this.width / 2, this.height / 2,
      (ScoreMultiplier.DIAMETER - progressWidth) / 2,
      -Math.PI / 2,
      -(Math.PI / 2) - (Math.PI * 2 * progressPercent),
      true
    );
  }
}
