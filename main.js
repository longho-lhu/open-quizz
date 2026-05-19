const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow;
let nextServer;

// Helper to check if a port is in use or wait for it
const waitForServer = (port, maxRetries = 30) => {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const interval = setInterval(() => {
      const socket = new net.Socket();
      socket.connect(port, '127.0.0.1', () => {
        clearInterval(interval);
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        retries++;
        if (retries >= maxRetries) {
          clearInterval(interval);
          reject(new Error('Server did not start in time.'));
        }
      });
    }, 1000);
  });
};

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  const isDev = !app.isPackaged;
  const port = isDev ? 3000 : 3000; // You can make this dynamic in prod if needed

  if (!isDev) {
    // In production, start the standalone Next.js server
    const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');
    nextServer = spawn('node', [serverPath], {
      env: {
        ...process.env,
        PORT: port,
        NODE_ENV: 'production',
      },
    });

    nextServer.stdout.on('data', (data) => console.log(`[Next.js]: ${data}`));
    nextServer.stderr.on('data', (data) => console.error(`[Next.js Error]: ${data}`));

    try {
      await waitForServer(port);
      createWindow(port);
    } catch (err) {
      console.error(err);
      app.quit();
    }
  } else {
    // In dev, the concurrently script runs Next.js, we just wait for it to be ready
    // Actually, wait-on already waits before launching electron, so we can just create the window.
    createWindow(port);
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Kill the Next.js server if we started it
  if (nextServer) {
    nextServer.kill();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow(3000);
  }
});
