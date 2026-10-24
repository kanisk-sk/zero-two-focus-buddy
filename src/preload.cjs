const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('buddy', {
  command: text => ipcRenderer.invoke('command', text),
  move: (x,y) => ipcRenderer.send('move', {x,y}),
  desktop: payload => ipcRenderer.invoke('desktop',payload),
  layout: payload => ipcRenderer.invoke('layout',payload),
  passthrough: value => ipcRenderer.send('passthrough', value),
  hide: () => ipcRenderer.send('hide'),
  gallery: () => ipcRenderer.send('gallery'),
  quit: () => ipcRenderer.send('quit'),
  notify: text => ipcRenderer.send('notify', text),
  onToggle: callback => ipcRenderer.on('toggle-chat', () => callback()),
  onPause: callback => ipcRenderer.on('pause', () => callback())
});
