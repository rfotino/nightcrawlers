import { UIContainer } from './container';
import { UIButton, UIImageButton } from './button';
import { UILabel, UIImageLabel } from './label';
import { UISliderWithLabel } from './slider';
import { Game } from '../game';
import { GameInstance } from '../game-instance';
import { Level } from '../level';
import { MouseState } from '../input/mousestate';
import { Color } from '../graphics/color';
import { LagFactor } from '../math/lag-factor';
import { Options } from '../options';

const TITLE_FONT_SIZE = 130;
const TITLE_WIDTH = 600;
const TITLE_HEIGHT = 220;
const BUTTON_WIDTH = 380;
const BUTTON_HEIGHT = 115;

// Background position data to be shared by every menu
const FOG_ROTATIONS = [
  {
    rotation: Math.random() * Math.PI * 2,
    rotationVel: 0.001,
  },
  {
    rotation: Math.random() * Math.PI * 2,
    rotationVel: 0.00025,
  },
];

// Generate fog layers for a menu
function getFogs(): PIXI.Sprite[] {
  const fogs: PIXI.Sprite[] = [];
  for (let i = 0; i < FOG_ROTATIONS.length; i++) {
    let fog = new PIXI.Sprite(PIXI.loader.resources['game/clouds'].texture);
    fog.anchor.set(0.5);
    fog.alpha = 0.75;
    fog.tint = 0x000000;
    fogs.push(fog);
  }
  return fogs;
}

/**
 * Menu items can fly around the screen in response to transitions.
 */
interface MenuItem {
  component: UIContainer;
  pos: number;
  vel: number;
  accel: number;
  delay?: number;
}

/**
 * Base menu class from which custom menus can be subclassed.
 */
export class UIMenu extends UIContainer {
  protected _menuItems: MenuItem[] = [];
  protected _transitioningIn: boolean = false;
  protected _transitioningOut: boolean = false;
  protected _fogs: PIXI.Sprite[];
  protected _moon: PIXI.Sprite;
  protected _moonlight: PIXI.Sprite;
  protected _ground: PIXI.extras.TilingSprite;
  protected _tree: PIXI.Sprite;
  protected _gravestone: PIXI.Sprite;

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

  public constructor(game: Game, bgVisible: boolean = true) {
    super(game);
    this.bgcolor = new Color(100, 160, 200); // Night color from game instance
    this._fogs = getFogs();
    this._moon = new PIXI.Sprite(PIXI.loader.resources['game/moon'].texture);
    this._moonlight = new PIXI.Sprite(PIXI.loader.resources['game/moonlight'].texture);
    this._moon.anchor.set(0.5);
    this._moonlight.anchor.set(0.5);
    this._ground = new PIXI.extras.TilingSprite(
      PIXI.loader.resources['game/grass'].texture,
      this.width,
      76
    );
    this._tree = new PIXI.Sprite(PIXI.loader.resources['game/night/tree1'].texture);
    this._gravestone = new PIXI.Sprite(PIXI.loader.resources['game/night/gravestone2'].texture);
    this._tree.anchor.set(0.5, 1);
    this._gravestone.anchor.set(0.5, 1);
    // Add images in the correct order
    if (bgVisible) {
      this.addChild(this._moon);
      this.addChild(this._tree);
      this.addChild(this._gravestone);
      this.addChild(this._ground);
      this._fogs.forEach(fog => this.addChild(fog));
      this.addChild(this._moonlight);
    }
  }

  public doLayout(): void {
    super.doLayout();
    // Resize self to fit whole view
    this.width = this.view.width;
    this.height = this.view.height;
    // Then position menu items horizontally centered and vertically cascading
    let marginTop = this.height * 0.05;
    const availableHeight = this.height - (marginTop * 2);
    const usedHeight = this._menuItems
      .map(item => item.component.height)
      .reduce((c, v) => c + v);
    const maxBetweenMargin = this.height * 0.05;
    const minBetweenMargin = maxBetweenMargin / 2;
    let betweenMargin = (availableHeight - usedHeight) / (this._menuItems.length - 1);
    let menuItemScale = 1;
    if (betweenMargin > maxBetweenMargin) {
      marginTop += (betweenMargin - maxBetweenMargin) * (this._menuItems.length - 1) / 2;
      betweenMargin = maxBetweenMargin;
    } else if (betweenMargin < minBetweenMargin) {
      betweenMargin = minBetweenMargin;
      menuItemScale = availableHeight / (usedHeight + betweenMargin * (this._menuItems.length - 1));
    }
    let currentY = marginTop;
    this._menuItems.forEach((item, index) => {
      item.component.scale.set(menuItemScale);
      const itemWidth = item.component.width * menuItemScale;
      const itemHeight = item.component.height * menuItemScale;
      if (index === 0) {
        // First item goes up and down screen based on position, others go
        // left and right
        item.component.x = (this.width - itemWidth) / 2;
        item.component.y = (item.pos / 4) + currentY;
      } else {
        item.component.x = item.pos + (this.width - itemWidth) / 2;
        item.component.y = currentY;
      }
      currentY += itemHeight + betweenMargin;
    });
    // Update background position and scale
    const maxDist = Math.sqrt(
      Math.pow(this.width / 2, 2) +
      Math.pow(this.height, 2)
    );
    const fogScale = maxDist * 2 / this._fogs[0].texture.baseTexture.width;
    this._fogs.forEach((fog, index) => {
      fog.rotation = FOG_ROTATIONS[index].rotation;
      fog.scale.set(2 * fogScale);
      fog.position.set(this.width / 2, this.height);
    });
    this._moon.position.x = this._moonlight.position.x = this.width * 0.15;
    this._moon.position.y = this._moonlight.position.y = this.height * 0.3;
    this._ground.position.y = this.height - this._ground.height;
    this._ground.width = this.width;
    this._tree.position.x = this.width * 0.85;
    this._tree.position.y = this._ground.position.y + 15;
    this._gravestone.position.x = this._tree.position.x - 60;
    this._gravestone.position.y = this._tree.position.y;
    const decorationScale = 1.5 * this._game.view.height / 1080;
    this._moon.scale.set(decorationScale);
    this._moonlight.scale.set(decorationScale);
    this._tree.scale.set(decorationScale);
    this._gravestone.scale.set(decorationScale);
  }

  /**
   * Update the transition effect if we are transitioning in or out.
   */
  public update(): void {
    super.update();
    // Update fog rotation
    FOG_ROTATIONS.forEach(obj => {
      obj.rotation += obj.rotationVel * LagFactor.get();
    });
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
  public optionsMenu: OptionsMenu;

  public constructor(game: Game) {
    super(game);
    // Add title
    this.addMenuItem(new UIImageLabel(game, 'ui/menu/nightcrawlers-title', TITLE_WIDTH, TITLE_HEIGHT));
    // Add play game button
    const levelMenu = new LevelMenu(game, this);
    const playGameBtn = new UIImageButton(game, 'ui/menu/play-game-btn', BUTTON_WIDTH, BUTTON_HEIGHT);
    playGameBtn.addListener('action', () => {
      game.setActiveScreen(levelMenu);
    });
    this.addMenuItem(playGameBtn);
    // Add options button
    this.optionsMenu = new OptionsMenu(game, this);
    const optionsBtn = new UIImageButton(game, 'ui/menu/options-btn', BUTTON_WIDTH, BUTTON_HEIGHT);
    optionsBtn.addListener('action', () => {
      game.setActiveScreen(this.optionsMenu);
    });
    this.addMenuItem(optionsBtn);
    // Add credits button
    const creditsMenu = new CreditsMenu(game, this);
    const creditsBtn = new UIImageButton(game, 'ui/menu/credits-btn', BUTTON_WIDTH, BUTTON_HEIGHT);
    creditsBtn.addListener('action', () => {
      game.setActiveScreen(creditsMenu);
    });
    this.addMenuItem(creditsBtn);
  }
}

class LevelMenu extends UIMenu {
  public constructor(game: Game, previous: MainMenu) {
    super(game);
    // Add title
    this.addMenuItem(new UILabel(game, 'Level Select', { fontSize: TITLE_FONT_SIZE }));
    // Add level buttons. For now have constant array of level names that we
    // iterate over. Each level's JSON is loaded with the PIXI loader, and is
    // parsed into a JavaScript object. When the button for a given level gets
    // clicked by the user, a new game instance is spun up with the parsed
    // level object.
    ['huge', 'tiny'].forEach(levelName => {
      const levelBtn = new UIButton(game, levelName.toLocaleUpperCase());
      const levelData = PIXI.loader.resources[`levels/${levelName}`].data;
      levelBtn.addListener('action', () => {
        game.setActiveScreen(
          new GameInstance(game, previous.optionsMenu.options, levelData)
        );
      });
      this.addMenuItem(levelBtn);
    });
    // Add option to load a level from a file, useful for debugging
    const loadFromFileBtn = new UIButton(game, 'Load from File');
    loadFromFileBtn.addListener('action', () => {
      const fileChooser = document.createElement('input');
      fileChooser.type = 'file';
      fileChooser.addEventListener('change', () => {
        if (fileChooser.files.length <= 0) {
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const levelData = JSON.parse(reader.result);
          game.setActiveScreen(
            new GameInstance(game, previous.optionsMenu.options, levelData)
          );
        };
        reader.readAsText(fileChooser.files[0]);
      });
      fileChooser.click();
    });
    this.addMenuItem(loadFromFileBtn);
    // Add back button to return to previous menu
    const backBtn = new UIImageButton(
      game, 'ui/menu/back-btn',
      BUTTON_WIDTH, BUTTON_HEIGHT
    );
    backBtn.addListener('action', () => {
      game.setActiveScreen(previous);
    });
    this.addMenuItem(backBtn);
  }
}

class OptionsMenu extends UIMenu {
  protected _options: Options;

  public get options(): Options { return this._options; }

  public constructor(game: Game, previous: UIMenu) {
    super(game);
    this._options = new Options();
    // Add title
    this.addMenuItem(new UIImageLabel(game, 'ui/menu/options-title', TITLE_WIDTH, TITLE_HEIGHT));
    // Add debug on/off button
    const debugButton = new UIButton(
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
    // Add blood level option
    const getBloodLevelText = () => {
      if (this._options.blood === Options.BLOOD_NORMAL) {
        return 'Blood: Normal';
      } else {
        return 'Blood: Extra';
      }
    }
    const bloodLevelButton = new UIButton(game, getBloodLevelText());
    bloodLevelButton.addListener('action', () => {
      if (Options.BLOOD_NORMAL === this._options.blood) {
        this._options.blood = Options.BLOOD_EXTRA;
      } else {
        this._options.blood = Options.BLOOD_NORMAL;
      }
      bloodLevelButton.title = getBloodLevelText();
    });
    this.addMenuItem(bloodLevelButton);
    // Add back button to return to previous menu
    const backBtn = new UIImageButton(
      game, 'ui/menu/back-btn',
      BUTTON_WIDTH, BUTTON_HEIGHT
    );
    backBtn.addListener('action', () => {
      game.setActiveScreen(previous);
    });
    this.addMenuItem(backBtn);
  }
}

class CreditsMenu extends UIMenu {
  public constructor(game: Game, previous: UIMenu) {
    super(game);
    // Add title - "Credits" has no letters that go below the baseline like
    // "Options" and "Nightcrawlers" so decrease the height a bit to match
    this.addMenuItem(new UIImageLabel(
      game, 'ui/menu/credits-title',
      TITLE_WIDTH, TITLE_HEIGHT - 50
    ));
    // Add contributor labels
    const LABEL_WIDTH = 975;
    const LABEL_HEIGHT = 270;
    this.addMenuItem(new UIImageLabel(
      game,
      'ui/menu/credits-label-rob',
      LABEL_WIDTH,
      LABEL_HEIGHT
    ));
    this.addMenuItem(new UIImageLabel(
      game,
      'ui/menu/credits-label-joe',
      LABEL_WIDTH,
      LABEL_HEIGHT
    ));
    // Add back button to return to previous menu
    const backBtn = new UIImageButton(
      game, 'ui/menu/back-btn',
      BUTTON_WIDTH, BUTTON_HEIGHT
    );
    backBtn.addListener('action', () => {
      game.setActiveScreen(previous);
    });
    this.addMenuItem(backBtn);
  }
}

export class PauseMenu extends UIMenu {
  public constructor(game: Game, gameInstance: GameInstance) {
    super(game, false);
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
  public constructor(game: Game, gameInst: GameInstance) {
    super(game, false);
    // Add title
    this.addMenuItem(new UILabel(game, 'Game Over', { fontSize: TITLE_FONT_SIZE }));
    // Add button to start a new game
    const playAgainBtn = new UIButton(game, 'Play Again');
    playAgainBtn.addListener('action', () => {
      const newGameInst = new GameInstance(
        game,
        gameInst.options,
        gameInst.level.initialData
      );
      gameInst = null;
      game.setActiveScreen(newGameInst);
    });
    this.addMenuItem(playAgainBtn);
    // Add button to quit to main menu
    const mainMenuBtn = new UIButton(game, 'Main Menu');
    mainMenuBtn.addListener('action', () => {
      gameInst = null;
      game.setActiveScreen(game.mainMenu);
    });
    this.addMenuItem(mainMenuBtn);
    // Make background semi transparent
    this.bgcolor = new Color(0, 0, 0, 0.8);
  }
}
