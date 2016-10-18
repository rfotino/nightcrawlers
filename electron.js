const {app, BrowserWindow} = require('electron');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 1000,
    height: 600,
    fullscreen: true,
  });

  // Load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`)

  // Since it's a game, we want to hide the menu bar. 
  win.setMenuBarVisibility(false);
});
