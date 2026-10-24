const {app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, Notification, globalShortcut, shell} = require('electron');
const path = require('node:path');
const {parseCommand} = require('./commands.cjs');
let win, tray;
function createWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({width:360, height:500, x:area.x+area.width-380, y:area.y+area.height-510,
    frame:false, transparent:true, alwaysOnTop:true, resizable:false, maximizable:false, fullscreenable:false,
    hasShadow:false, skipTaskbar:true, backgroundColor:'#00000000',
    webPreferences:{preload:path.join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false, sandbox:true}});
  win.loadFile(path.join(__dirname,'index.html'));
  win.webContents.setWindowOpenHandler(() => ({action:'deny'}));
  win.webContents.on('will-navigate', event => event.preventDefault());
  const icon = nativeImage.createFromPath(path.join(__dirname,'../assets/tray.png'));
  tray = new Tray(icon);
  tray.setToolTip('Zero Two Focus Buddy');
  tray.setContextMenu(Menu.buildFromTemplate([
    {label:'Show buddy',click:()=>win.show()},
    {label:'Chat',click:()=>{win.show();win.webContents.send('toggle-chat');}},
    {label:'Pause / resume',click:()=>win.webContents.send('pause')},
    {label:'Hide buddy',click:()=>win.hide()},
    {type:'separator'}, {label:'Quit',click:()=>app.quit()}
  ]));
  tray.on('click',()=>win.isVisible()?win.hide():win.show());
  globalShortcut.register('CommandOrControl+Shift+Space',()=>{win.show();win.webContents.send('toggle-chat');});
}
app.whenReady().then(createWindow);
app.on('window-all-closed',()=>app.quit());
app.on('will-quit',()=>globalShortcut.unregisterAll());
ipcMain.handle('command', async (event,text)=>{
  if (event.sender !== win.webContents || typeof text !== 'string' || text.length > 500) return {type:'chat'};
  const result = parseCommand(text);
  if (result.type === 'search') await shell.openExternal('https://www.google.com/search?q='+encodeURIComponent(result.query));
  return result;
});
ipcMain.on('move',(event,point)=>{
  if (event.sender !== win.webContents || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return;
  const area = screen.getDisplayNearestPoint({x:Math.round(point.x),y:Math.round(point.y)}).workArea;
  win.setPosition(Math.round(Math.max(area.x,Math.min(area.x+area.width-360,point.x))),Math.round(Math.max(area.y,Math.min(area.y+area.height-500,point.y))));
});
ipcMain.on('passthrough',(event,value)=>{if(event.sender===win.webContents)win.setIgnoreMouseEvents(value===true,{forward:true});});
ipcMain.on('hide',()=>win.hide());
ipcMain.on('quit',()=>app.quit());
ipcMain.on('notify',(event,text)=>{if(event.sender===win.webContents && typeof text==='string' && Notification.isSupported())new Notification({title:'Zero Two · a little nudge',body:text.slice(0,200)}).show();});
