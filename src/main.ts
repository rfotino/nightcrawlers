import { Game } from "./game";
let game = new Game();
// Make fullscreen on click/tap
function goFullscreen(): void {
  if (game.view.requestFullscreen) {
    game.view.requestFullscreen();
  } else if (game.view.webkitRequestFullscreen) {
    game.view.webkitRequestFullscreen();
  } else if (game.view['msRequestFullscreen']) {
    game.view['msRequestFullscreen']();
  } else if (game.view['mozRequestFullscreen']) {
    game.view['mozRequestFullscreen']();
  }
}
game.view.addEventListener('click', goFullscreen);
game.view.addEventListener('touchend', goFullscreen);
// Add canvas to document and give it the focus
document.body.appendChild(game.view);
game.view.focus();
