import { UIContainer } from './container';
import { UIButton } from './button';
import { UILabel } from './label';
import { Game } from '../game';
import { GameInstance } from '../game-instance';
import { MouseState } from '../input/mousestate';

export class UIMenu extends UIContainer {
  public constructor(game: Game) {
    super(game);
  }

  public doLayout(): void {
    super.doLayout();
    let lineHeight = this.view.height / (this._childComponents.length + 2);
    let marginTop = lineHeight;
    this._childComponents.forEach((item, index) => {
      item.height = lineHeight;
      item.position.y = marginTop + (index * item.height);
      item.position.x = (this.width - item.width) / 2;
    });
    this.position.x = (this.view.width - this.width) / 2;
  }
}

export class MainMenu extends UIMenu {
  public constructor(game: Game) {
    super(game);
    this.addComponent(new UIButton(game, 'Play Game').addActionListener(() => {
      game.activeScreen = new GameInstance(game);
    }));
    let optionsMenu = new OptionsMenu(game, this);
    this.addComponent(new UIButton(game, 'Options').addActionListener(() => {
      game.activeScreen = optionsMenu;
    }));
    let creditsMenu = new CreditsMenu(game, this);
    this.addComponent(new UIButton(game, 'Credits').addActionListener(() => {
      game.activeScreen = creditsMenu;
    }));
  }
}

class OptionsMenu extends UIMenu {
  public constructor(game: Game, previous: UIMenu) {
    super(game);
    this.addComponent(new UIButton(game, 'Option 1'));
    this.addComponent(new UIButton(game, 'Option 2'));
    this.addComponent(new UIButton(game, 'Option 3'));
    this.addComponent(new UIButton(game, 'Back').addActionListener(() => {
      game.activeScreen = previous;
    }));
  }
}

class CreditsMenu extends UIMenu {
  public constructor(game: Game, previous: UIMenu) {
    super(game);
    let contributors = ['Robert Fotino', 'Joe Calvi', 'Chris Sweeney'].sort();
    contributors.forEach(name => {
      this.addComponent(new UILabel(game, name));
    });
    this.addComponent(new UIButton(game, 'Back').addActionListener(() => {
      game.activeScreen = previous;
    }));
  }
}
