const { app, BrowserWindow, nativeTheme, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

nativeTheme.themeSource = 'dark'

const isMac = process.platform === 'darwin'

const menuTemplate = [
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  { role: 'editMenu' },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  { role: 'windowMenu' }
]

function getIconPath() {
  const candidates = [
    isMac && path.join(__dirname, 'assets', 'logo.icns'),
    process.platform === 'win32' && path.join(__dirname, 'assets', 'logo.ico'),
    path.join(__dirname, 'assets', 'logo.png'),
    path.join(__dirname, 'assets', 'logo.svg'),
  ]
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }
  return undefined
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 920,
    minHeight: 580,
    show: false,
    backgroundColor: '#0a0a14',
    icon: getIconPath(),
    title: 'Timezone Converter',
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 16, y: 18 } : undefined,
    autoHideMenuBar: !isMac,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))

  win.loadFile(path.join(__dirname, 'src', 'index.html'))
  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})
