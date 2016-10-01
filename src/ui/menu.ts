import { UIContainer } from './container';
import { UIButton } from './button';
import { UILabel } from './label';
import { Game } from '../game';
import { GameInstance } from '../game-instance';
import { MouseState } from '../input/mousestate';
import { Color } from '../math/color';

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
  public constructor(game: Game) {
    super(game, 'Nightcrawlers');
    this.addMenuItem(new UIButton(game, 'Play Game').addActionListener(() => {
      game.activeScreen = new GameInstance(game);
    }));
    let optionsMenu = new OptionsMenu(game, this);
    this.addMenuItem(new UIButton(game, 'Options').addActionListener(() => {
      game.activeScreen = optionsMenu;
    }));
    let creditsMenu = new CreditsMenu(game, this);
    this.addMenuItem(new UIButton(game, 'Credits').addActionListener(() => {
      game.activeScreen = creditsMenu;
    }));
  }
}

class OptionsMenu extends UIMenu {
  public constructor(game: Game, previous: UIMenu) {
    super(game, 'Options');
    this.addMenuItem(new UIButton(game, 'Option 1'));
    this.addMenuItem(new UIButton(game, 'Option 2'));
    this.addMenuItem(new UIButton(game, 'Option 3'));
    this.addMenuItem(new UIButton(game, 'Back').addActionListener(() => {
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
    this.addMenuItem(new UIButton(game, 'Back').addActionListener(() => {
      game.activeScreen = previous;
    }));
  }
}

export class PauseMenu extends UIMenu {
  public constructor(game: Game, gameInstance: GameInstance) {
    super(game, 'Paused');
    this.addMenuItem(new UIButton(game, 'Resume').addActionListener(() => {
      gameInstance.resume();
    }));
    this.addMenuItem(new UIButton(game, 'Quit').addActionListener(() => {
      game.activeScreen = new MainMenu(game);
    }));
    this.bgcolor = new Color(0, 0, 0, 0.8);
  }
}
