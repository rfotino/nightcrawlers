import { Screen } from './screen';
import { Game } from '../game';
import { GameInstance } from '../game-instance';
import { MouseState } from '../input/mousestate';

class MenuItem extends PIXI.Container {
  public title: string;
  public action: () => void;
  public text: PIXI.Text;

  public constructor(title: string, action: () => void) {
    super();
    this.title = title;
    this.action = action;
    this.text = new PIXI.Text(this.title, {
      align: 'center',
      fontFamily: 'sans-serif',
    });
    this.text.anchor.x = 0.5;
    this.addChild(this.text);
  }
}

export class Menu extends Screen {
  private _items: MenuItem[];

  public constructor(game: Game) {
    super(game);
    this._items = [];
  }

  public addItem(title: string, action: () => void) {
    let item = new MenuItem(title, action);
    this.addChild(item);
    this._items.push(item);
  }

  public update(): void {
    let lineHeight = this.view.height / (this._items.length + 2);
    let fontSize = lineHeight * 0.8;
    let marginTop = lineHeight;
    this._items.forEach((item, index) => {
      item.text.style.fontSize = `${fontSize}px`;
      item.text.style.lineHeight = lineHeight;
      item.position.y = marginTop + (index * item.height);
      item.text.position.x = this.width / 2;
      if (this.mouseState.y >= item.position.y &&
          this.mouseState.y <= item.position.y + item.height) {
        // Hovering over this item
        item.text.style.fill = 'gray';
        if (this.mouseState.isClicked(MouseState.LEFT)) {
          // Clicked on this item
          item.action();
        }
      } else {
        item.text.style.fill = 'white';
      }
    });
    this.position.x = (this.view.width - this.width) / 2;
  }
}

export class MainMenu extends Menu {
  public constructor (game: Game) {
    super(game);
    this.addItem('Play Game', () => {
      let gameInstance = new GameInstance(game);
      gameInstance.update();
      game.activeScreen = gameInstance;
    });
    this.addItem('Options', () => alert('options coming soon'));
    this.addItem('Credits', () => alert('credits coming soon'));
  }
}
