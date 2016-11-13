import { UIContainer } from './container';
import { UIButton } from './button';
import { UILabel } from './label';
import { UISliderWithLabel } from './slider';
import { Game } from '../game';
import { GameInstance } from '../game-instance';
import { Level } from '../level';
import { MouseState } from '../input/mousestate';
import { Color } from '../graphics/color';
import { LagFactor } from '../math/lag-factor';
import { Options } from '../options';

const TITLE_FONT_SIZE = 130;

interface MenuItem {
  component: UIContainer;
  pos: number;
  vel: number;
  accel: number;
  delay?: number;
}

export class UIMenu extends UIContainer {
  protected _menuItems: MenuItem[] = [];
  protected _transitioningIn: boolean = false;
  protected _transitioningOut: boolean = false;

  protected get _transitionOffsetMin(): number {
    return -this._transitionOffsetMax;
  }

  protected get _transitionOffsetMax(): number {
    let maxWidth = 0;
    this._menuItems.forEach(item => {
      maxWidth = Math.max(maxWidth, item.component.width);
    });
    return (this._game.view.width + maxWidth) / 2;
  }

  public doLayout(): void {
    super.doLayout();
    // Resize self to fit whole view
    this.width = this.view.width;
    this.height = this.view.height;
    // Then position menu items horizontally centered and vertically cascading
    const marginTop = this.height * 0.1;
    const availableHeight = this.height - (marginTop * 2);
    const usedHeight = this._menuItems
      .map(item => item.component.height)
      .reduce((c, v) => c + v);
    const betweenMargin = Math.min(
      this.height * 0.05,
      (availableHeight - usedHeight) / this._menuItems.length
    );
    let currentY = marginTop + (betweenMargin / 2);
    this._menuItems.forEach((item, index) => {
      if (index === 0) {
        // First item goes up and down screen based on position, others go
        // left and right
        item.component.x = (this.width - item.component.width) / 2;
        item.component.y = (item.pos / 4) + currentY;
      } else {
        item.component.x = item.pos + (this.width - item.component.width) / 2;
        item.component.y = currentY;
      }
      currentY += item.component.height + betweenMargin;
    });
  }

  /**
   * Update the transition effect if we are transitioning in or out.
   */
  public update(): void {
    super.update();
    // Update position/velocity of menu items if transitioning in or out
    if (this._transitioningIn || this._transitioningOut) {
      let done = true;
      this._menuItems.forEach(item => {
        item.delay -= LagFactor.get();
        if (item.delay > 0) {
          return;
        }
        item.pos += item.vel * LagFactor.get();
        item.vel += item.accel * LagFactor.get();
        if (this._transitioningIn) {
          if ((item.vel > 0 && item.pos < 0) ||
              (item.vel < 0 && item.pos > 0)) {
            done = false;
          } else if (item.vel > 0 && item.pos >= 0) {
            item.pos = 0;
            item.vel = item.accel = 0;
          } else if (item.vel < 0 && item.pos <= 0) {
            item.pos = 0;
            item.vel = item.accel = 0;
          }
        } else if (this._transitioningOut) {
          if ((item.vel > 0 && item.pos < this._transitionOffsetMax) ||
              (item.vel < 0 && item.pos > this._transitionOffsetMin)) {
            done = false;
          }
        }
      });
      if (done) {
        this._transitioningIn = this._transitioningOut = false;
      }
    }
  }

  public addMenuItem(component: UIContainer) {
    this._menuItems.push({
      component: component,
      pos: 0,
      vel: 0,
      accel: 1,
    });
    this.addComponent(component);
  }

  public isTransitionDone(): boolean {
    return !this._transitioningIn && !this._transitioningOut;
  }

  public startTransition(isIn: boolean): void {
    // Make sure there is at least a title to transition
    if (this._menuItems.length <= 0) {
      return;
    }
    // Set up transition variables
    this._transitioningIn = isIn;
    this._transitioningOut = !isIn;
    const MAX_ACCEL = 7;
    this._menuItems.forEach((item, index) => {
      const left = index % 2 == 0;
      item.accel = (left ? -1 : 1) * MAX_ACCEL;
      if (this._transitioningIn) {
        item.pos = left ? this._transitionOffsetMin : this._transitionOffsetMax;
        item.vel = (left ? 1 : -1) * 1.1 * Math.sqrt(2 * item.pos * item.accel);
      } else if (this._transitioningOut) {
        item.vel = 0;
        item.pos = 0;
      }
      item.delay = index * 3;
    });
  }
}

export class MainMenu extends UIMenu {
  protected _optionsMenu: OptionsMenu;

  public constructor(game: Game) {
    super(game);
    // Add title
    this.addMenuItem(new UILabel(game, 'Nightcrawlers', { fontSize: TITLE_FONT_SIZE }));
    // Add play game button
    const playGameBtn = new UIButton(game, 'Play Game');
    playGameBtn.addListener('action', () => {
      game.setActiveScreen(new GameInstance(game, this._optionsMenu.options));
    });
    this.addMenuItem(playGameBtn);
    // Add options button
    this._optionsMenu = new OptionsMenu(game, this);
    const optionsBtn = new UIButton(game, 'Options');
    optionsBtn.addListener('action', () => {
      game.setActiveScreen(this._optionsMenu);
    });
    this.addMenuItem(optionsBtn);
    // Add credits button
    const creditsMenu = new CreditsMenu(game, this);
    const creditsBtn = new UIButton(game, 'Credits');
    creditsBtn.addListener('action', () => {
      game.setActiveScreen(creditsMenu);
    });
    this.addMenuItem(creditsBtn);
  }
}

class OptionsMenu extends UIMenu {
  protected _options: Options;

  public get options(): Options { return this._options; }

  public constructor(game: Game, previous: UIMenu) {
    super(game);
    this._options = new Options();
    // Add title
    this.addMenuItem(new UILabel(game, 'Options', { fontSize: TITLE_FONT_SIZE }));
    // Add debug on/off button
    let debugButton = new UIButton(
      game,
      `Debug ${this._options.debug ? 'On' : 'Off'}`
    );
    debugButton.addListener('action', () => {
      this._options.debug = !this._options.debug;
      debugButton.title = `Debug ${this._options.debug ? 'On' : 'Off'}`;
    });
    this.addMenuItem(debugButton);
    // Add volume slider
    const volumeSlider = new UISliderWithLabel(
      game,
      'Volume',
      this._options.volume
    );
    Howler.volume(this._options.volume);
    volumeSlider.addListener('change', () => {
      Howler.volume(volumeSlider.value);
      this._options.volume = volumeSlider.value;
    });
    this.addMenuItem(volumeSlider);
    // Add load level from file option
    const loadLevelButton = new UIButton(game, 'Load Level');
    loadLevelButton.addListener('action', () => {
      let fileChooser = document.createElement('input');
      fileChooser.type = 'file';
      fileChooser.addEventListener('change', () => {
        if (fileChooser.files.length <= 0) {
          return;
        }
        let reader = new FileReader();
        reader.onload = () => {
          this._options.levelData = JSON.parse(reader.result);
        };
        reader.readAsText(fileChooser.files[0]);
      });
      fileChooser.click();
    });
    this.addMenuItem(loadLevelButton);
    // Add back button to return to previous menu
    const backBtn = new UIButton(game, 'Back');
    backBtn.addListener('action', () => {
      game.setActiveScreen(previous);
    });
    this.addMenuItem(backBtn);
  }
}

class CreditsMenu extends UIMenu {
  public constructor(game: Game, previous: UIMenu) {
    super(game);
    // Add title
    this.addMenuItem(new UILabel(game, 'Credits', { fontSize: TITLE_FONT_SIZE }));
    // Add contributor labels
    let contributors = [
      'Robert Fotino',
      'Joe Calvi',
      'Nikolas Verlennich',
    ].sort();
    contributors.forEach(name => {
      this.addMenuItem(new UILabel(game, name));
    });
    // Add back button to return to previous menu
    const backBtn = new UIButton(game, 'Back');
    backBtn.addListener('action', () => {
      game.setActiveScreen(previous);
    });
    this.addMenuItem(backBtn);
  }
}

export class PauseMenu extends UIMenu {
  public constructor(game: Game, gameInstance: GameInstance) {
    super(game);
    // Add title
    this.addMenuItem(new UILabel(game, 'Paused', { fontSize: TITLE_FONT_SIZE }));
    // Add resume button
    const resumeBtn = new UIButton(game, 'Resume');
    resumeBtn.addListener('action', () => {
      gameInstance.resume();
    });
    this.addMenuItem(resumeBtn);
    // Add quit button
    const quitBtn = new UIButton(game, 'Quit');
    quitBtn.addListener('action', () => {
      gameInstance.cleanup();
      game.setActiveScreen(game.mainMenu);
    });
    this.addMenuItem(quitBtn);
    // Have dark semi-transparent background
    this.bgcolor = new Color(0, 0, 0, 0.8);
  }
}

export class GameOverMenu extends UIMenu {
  public constructor(game: Game, gameInstance: GameInstance) {
    super(game);
    // Add title
    this.addMenuItem(new UILabel(game, 'Game Over', { fontSize: TITLE_FONT_SIZE }));
    // Add button to start a new game
    const playAgainBtn = new UIButton(game, 'Play Again');
    playAgainBtn.addListener('action', () => {
      let options = gameInstance.options;
      gameInstance = null;
      game.setActiveScreen(new GameInstance(game, options));
    });
    this.addMenuItem(playAgainBtn);
    // Add button to quit to main menu
    let mainMenuBtn = new UIButton(game, 'Main Menu');
    mainMenuBtn.addListener('action', () => {
      gameInstance = null;
      game.setActiveScreen(game.mainMenu);
    });
    this.addMenuItem(mainMenuBtn);
    // Make background semi transparent
    this.bgcolor = new Color(0, 0, 0, 0.8);
  }
}
