import { UIContainer } from './container';
import { UIButton } from './button';
import { UILabel } from './label';
import { Game } from '../game';
import { GameInstance } from '../game-instance';
import { Level } from '../level';
import { MouseState } from '../input/mousestate';
import { Color } from '../math/color';
import { Options } from '../options';

export class UIMenu extends UIContainer {
  protected _menuTitle: UIContainer;
  protected _menuItems: UIContainer[];

  public constructor(game: Game, title: string) {
    super(game);
    this._menuTitle = new UILabel(game, title);
    this.addComponent(this._menuTitle);
    this._menuItems = [];
  }

  public doLayout(): void {
    // Resize self to fit whole view
    this.width = this.view.width;
    this.height = this.view.height;
    // First set heights of menu components
    let marginTop = this.height * 0.1;
    let innerHeight = this.height - (marginTop * 2);
    let titleHeight = 1.1 * innerHeight / this._menuItems.length;
    let itemHeight = (innerHeight - titleHeight) / this._menuItems.length;
    this._menuTitle.height = titleHeight;
    this._menuTitle.y = marginTop;
    this._menuItems.forEach((item, index) => {
      item.height = itemHeight;
      item.y = marginTop + titleHeight + (index * item.height);
    });
    // Then update the inner components
    super.doLayout();
    // Then center them
    this._menuTitle.x = (this.width - this._menuTitle.width) / 2;
    this._menuItems.forEach(item => {
      item.x = (this.width - item.width) / 2;
    });
  }

  public addMenuItem(component: UIContainer) {
    this._menuItems.push(component);
    this.addComponent(component);
  }
}

export class MainMenu extends UIMenu {
  protected _optionsMenu: OptionsMenu;

  public constructor(game: Game) {
    super(game, 'Nightcrawlers');
    this.addMenuItem(new UIButton(game, 'Play Game').addListener('action', () => {
      game.activeScreen = new GameInstance(
        game,
        this._optionsMenu.options
      );
    }));
    this._optionsMenu = new OptionsMenu(game, this);
    this.addMenuItem(new UIButton(game, 'Options').addListener('action', () => {
      game.activeScreen = this._optionsMenu;
    }));
    let creditsMenu = new CreditsMenu(game, this);
    this.addMenuItem(new UIButton(game, 'Credits').addListener('action', () => {
      game.activeScreen = creditsMenu;
    }));
  }
}

class OptionsMenu extends UIMenu {
  protected _options: Options;

  public get options(): Options { return this._options; }

  public constructor(game: Game, previous: UIMenu) {
    super(game, 'Options');
    this._options = new Options();
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
    // Add sound on/off button
    let soundButton = new UIButton(
      game,
      `Sound ${this._options.soundOn ? 'On' : 'Off'}`
    );
    soundButton.addListener('action', () => {
      this._options.soundOn = !this._options.soundOn;
      soundButton.title = `Sound ${this._options.soundOn ? 'On' : 'Off'}`;
      Howler.mute(!this._options.soundOn);
    });
    this.addMenuItem(soundButton);
    // Add load level from file option
    let loadLevelButton = new UIButton(game, 'Load Level');
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
    this.addMenuItem(new UIButton(game, 'Back').addListener('action', () => {
      game.activeScreen = previous;
    }));
  }
}

class CreditsMenu extends UIMenu {
  public constructor(game: Game, previous: UIMenu) {
    super(game, 'Credits');
    let contributors = ['Robert Fotino', 'Joe Calvi', 'Chris Sweeney'].sort();
    contributors.forEach(name => {
      this.addMenuItem(new UILabel(game, name));
    });
    this.addMenuItem(new UIButton(game, 'Back').addListener('action', () => {
      game.activeScreen = previous;
    }));
  }
}

export class PauseMenu extends UIMenu {
  public constructor(game: Game, gameInstance: GameInstance) {
    super(game, 'Paused');
    this.addMenuItem(new UIButton(game, 'Resume').addListener('action', () => {
      gameInstance.resume();
    }));
    this.addMenuItem(new UIButton(game, 'Quit').addListener('action', () => {
      gameInstance.cleanup();
      game.activeScreen = game.mainMenu;
    }));
    this.bgcolor = new Color(0, 0, 0, 0.8);
  }
}
