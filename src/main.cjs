const {app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, Notification, globalShortcut, shell} = require('electron');
const path = require('node:path');
const {parseCommand} = require('./commands.cjs');
let win, tray, gallery;
function showGallery(){
  if(gallery&&!gallery.isDestroyed()){gallery.show();gallery.focus();return;}
  gallery=new BrowserWindow({width:1000,height:800,title:'Zero Two · Expression & Animation Gallery',backgroundColor:'#fcf7f9',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
  gallery.loadFile(path.join(__dirname,'gallery.html'));
  gallery.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  gallery.webContents.on('will-navigate',event=>event.preventDefault());
}
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
    {label:'Expression & animation gallery',click:showGallery},
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
ipcMain.handle('desktop',(event,payload)=>{
  if(event.sender!==win.webContents)return null;
  const area=screen.getDisplayMatching(win.getBounds()).workArea;
  const bounds=win.getBounds();
  if(payload?.action==='reveal') {
    win.setPosition(Math.round(Math.max(area.x,Math.min(area.x+area.width-bounds.width,bounds.x))),Math.round(Math.max(area.y,Math.min(area.y+area.height-bounds.height,bounds.y))));
    return win.getBounds();
  }
  const rect=payload?.rect;
  if(!rect||!['x','y','width','height'].every(key=>Number.isFinite(rect[key]))||rect.width<50||rect.width>220||rect.height<100||rect.height>220||rect.x<0||rect.y<0||rect.x+rect.width>360||rect.y+rect.height>500)return null;
  const minX=area.x-rect.x,maxX=area.x+area.width-rect.x-rect.width;
  const minY=area.y-rect.y,maxY=area.y+area.height-rect.y-rect.height;
  let x=bounds.x,y=bounds.y;
  const edge=bounds.x+rect.x+rect.width/2<area.x+area.width/2?'left':'right';
  if(payload.action==='edge')x=edge==='left'?minX:maxX;
  else if(payload.action==='step'&&Number.isFinite(payload.dx)&&Number.isFinite(payload.dy)&&Math.abs(payload.dx)<=10&&Math.abs(payload.dy)<=10){x+=payload.dx;y+=payload.dy;}
  else return null;
  x=Math.round(Math.max(minX,Math.min(maxX,x)));y=Math.round(Math.max(minY,Math.min(maxY,y)));
  win.setPosition(x,y);
  return {x,y,dx:x-bounds.x,dy:y-bounds.y,edge,moved:x!==bounds.x||y!==bounds.y};
});
ipcMain.on('passthrough',(event,value)=>{if(event.sender===win.webContents)win.setIgnoreMouseEvents(value===true,{forward:true});});
ipcMain.on('hide',()=>win.hide());
ipcMain.on('gallery',event=>{if(event.sender===win.webContents)showGallery();});
ipcMain.on('quit',()=>app.quit());
ipcMain.on('notify',(event,text)=>{if(event.sender===win.webContents && typeof text==='string' && Notification.isSupported())new Notification({title:'Zero Two · a little nudge',body:text.slice(0,200)}).show();});
