const { app, BrowserWindow, ipcMain, safeStorage, session, dialog, shell } = require("electron");
const { spawn } = require("child_process");
const { randomBytes } = require("crypto");
const fs = require("fs");
const store = require("./Store");
const path = require("path");
const EXCEL_TEMPLATE = require("./ExcelTemplate");

const apiToken = randomBytes(32).toString("hex");

// Vite HMR requires unsafe-eval in dev; suppress the advisory-only warning
if (!app.isPackaged) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}


let backendProcess;
let mainWindow;
let splash;
let isQuitting = false;
const MIN_SPLASH_TIME = 4000;
let splashStart = Date.now();

function encryptValue(plaintext) {
  return Array.from(safeStorage.encryptString(plaintext));
}

function decryptValue(arr) {
  return safeStorage.decryptString(Buffer.from(arr));
}

function waitForBackend(onReady) {
  const http = require("http");
  const TIMEOUT_MS = 5 * 60 * 1000; // show app anyway after 5 minutes
  const start = Date.now();
  const interval = setInterval(() => {
    if (Date.now() - start > TIMEOUT_MS) {
      clearInterval(interval);
      onReady();
      return;
    }
    const req = http.get(
      `http://127.0.0.1:8000/bot-status?token=${apiToken}`,
      (res) => {
        res.resume();
        if (res.statusCode === 200) {
          clearInterval(interval);
          onReady();
        }
      }
    );
    req.on("error", () => {});
    req.setTimeout(800, () => req.destroy());
  }, 1000);
}

function startBackend() {
  const isDev = !app.isPackaged;

  if (isDev) {
    return;
  }

  const exePath = path.join(process.resourcesPath, "Script", "Main", "Main.exe");

  const env = { ...process.env };
  const config = store.get("config");
  if (config && config.botToken) {
    try {
      env.BOT_TOKEN = decryptValue(config.botToken);
      env.CHAT_ID = decryptValue(config.chatId);
    } catch (e) {
      console.error("Failed to decrypt bot credentials:", e);
    }
  }
  if (config && config.csfloatApiKey) {
    try {
      env.CSFLOAT_API_KEY = decryptValue(config.csfloatApiKey);
    } catch (e) {
      console.error("Failed to decrypt CSFloat API key:", e);
    }
  }
  if (config && config.excelPath) {
    env.EXCEL_PATH = config.excelPath;
  }
  env.DATA_DIR = path.join(app.getPath("userData"), "Data");
  env.PLAYWRIGHT_BROWSERS_PATH = path.join(app.getPath("userData"), "browsers");
  env.API_TOKEN = apiToken;

  backendProcess = spawn(exePath, [], {
    detached: false,
    env,
    windowsHide: true,
  });

  backendProcess.stdout.on("data", (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`Backend error: ${data}`);
  });

  backendProcess.on("error", (err) => {
    console.error(`Backend spawn error: ${err}`);
    dialog.showErrorBox(
      "Startup Error",
      `Could not start the backend process. Please reinstall the app.\n\n${err.message}`
    );
  });

  backendProcess.on("exit", (code) => {
    if (!isQuitting && code !== 0 && code !== null) {
      console.error(`Backend exited unexpectedly with code ${code}`);
    }
  });
}

function createSplash() {
  splash = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    icon: path.join(__dirname, "Logo.ico"),
  });

  splash.setIgnoreMouseEvents(true, { forward: true });
  splash.loadFile(path.join(__dirname, "splash.html"));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: path.join(__dirname, "Logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "Preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      devTools: !app.isPackaged
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(
      process.resourcesPath,
      "frontend",
      "dist",
      "index.html"
    );

    mainWindow.loadFile(indexPath);
  }

  mainWindow.once("ready-to-show", () => {
    waitForBackend(() => {
      const elapsed = Date.now() - splashStart;
      const remaining = MIN_SPLASH_TIME - elapsed;
      setTimeout(() => {
        if (splash && !splash.isDestroyed()) splash.destroy();
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
      }, Math.max(0, remaining));
    });
  });

  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    isQuitting = true;
    mainWindow.minimize(); // hands focus back to desktop before process exits
    setTimeout(() => app.quit(), 150);
  });

  mainWindow.on("closed", () => {
    if (splash && !splash.isDestroyed()) splash.destroy();
    mainWindow = null;
  });

}



app.whenReady().then(() => {
  if (app.isPackaged) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:8000; img-src 'self' data: blob:; font-src 'self' data:",
          ],
        },
      });
    });
  }

  startBackend();
  createSplash();
  createWindow();
});



ipcMain.handle("get-api-token", () => apiToken);

ipcMain.handle("get-config", () => {
  const config = store.get("config");
  if (!config) return null;
  const result = {
    hasBot: config.hasBot || false,
    hasCsfloat: config.hasCsfloat || false,
    hasExcel: config.hasExcel || false,
    excelPath: config.excelPath || null,
  };
  try {
    if (config.botToken) {
      result.botToken = decryptValue(config.botToken);
      result.chatId = decryptValue(config.chatId);
    }
    if (config.csfloatApiKey) {
      result.csfloatApiKey = decryptValue(config.csfloatApiKey);
    }
  } catch {
    store.delete("config");
    return null;
  }
  return result;
});

ipcMain.handle("save-config", (event, data) => {
  const existing = store.get("config") || {};
  const merged = { ...existing };
  if (data.botToken !== undefined) {
    merged.botToken = encryptValue(data.botToken);
    merged.chatId = encryptValue(String(data.chatId));
    merged.hasBot = true;
  }
  if (data.csfloatApiKey !== undefined) {
    merged.csfloatApiKey = encryptValue(data.csfloatApiKey);
    merged.hasCsfloat = true;
  }
  if (data.excelPath !== undefined) {
    merged.excelPath = data.excelPath;
    merged.hasExcel = true;
  }
  store.set("config", merged);
});

ipcMain.handle("is-configured", () => {
  const config = store.get("config");
  return !!(config && config.hasBot && config.hasCsfloat);
});

ipcMain.handle("clear-config", () => {
  store.delete("config");
});

ipcMain.handle("clear-bot", () => {
  const config = store.get("config") || {};
  delete config.botToken;
  delete config.chatId;
  config.hasBot = false;
  store.set("config", config);
});


ipcMain.handle("pick-excel-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Choose folder for Trades.xlsm",
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle("copy-excel-template", (event, folder) => {
  const dest = path.join(folder, "Trades.xlsm");
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, EXCEL_TEMPLATE);
  }
  return dest;
});

ipcMain.handle("reset-excel-file", (event, filePath) => {
  if (!filePath || !filePath.endsWith("Trades.xlsm")) {
    throw new Error("Invalid file path");
  }
  fs.writeFileSync(filePath, EXCEL_TEMPLATE);
});

ipcMain.handle("open-external", (_, url) => {
  if (typeof url === "string" && url.startsWith("https://csfloat.com/")) {
    shell.openExternal(url);
  }
});

ipcMain.handle("open-excel-file", (event, filePath) => {
  if (!filePath || !filePath.endsWith(".xlsm")) return;
  shell.openPath(filePath);
});

ipcMain.handle("check-excel-path", (event, filePath) => {
  return fs.existsSync(filePath);
});

app.on("window-all-closed", () => app.quit());

app.on("before-quit", () => {
  isQuitting = true;
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
  if (splash && !splash.isDestroyed()) splash.destroy();
  if (backendProcess) {
    try {
      require("child_process").execSync(
        `taskkill /pid ${backendProcess.pid} /T /F`,
        { stdio: "ignore", timeout: 2000 }
      );
    } catch {}
  }
});
