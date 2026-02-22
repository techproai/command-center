const { app, BrowserWindow, dialog } = require("electron");
const { fork } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const isDev = !app.isPackaged;
const host = process.env.DESKTOP_HOST ?? "127.0.0.1";
const port = Number(process.env.DESKTOP_PORT ?? (isDev ? 3000 : 4120));
const baseUrl = `http://${host}:${port}`;

let mainWindow = null;
let serverProcess = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // keep polling
    }

    await sleep(300);
  }

  throw new Error(`Timed out waiting for web server at ${url}`);
}

function resolveServerEntry(searchRoots) {
  const roots = Array.isArray(searchRoots) ? searchRoots : [searchRoots];

  for (const root of roots) {
    const directEntry = path.join(root, "server.js");
    if (fs.existsSync(directEntry)) {
      return directEntry;
    }

    const nestedEntry = path.join(root, "web", "server.js");
    if (fs.existsSync(nestedEntry)) {
      return nestedEntry;
    }
  }

  throw new Error("Cannot find Next standalone server.js in packaged app directory.");
}

async function startBundledServer() {
  if (isDev) {
    return;
  }

  const resourcesAppDir = path.join(process.resourcesPath, "app");
  const bundledAppDir = path.join(__dirname, "app");
  const serverEntry = resolveServerEntry([
    bundledAppDir,
    path.join(resourcesAppDir, "desktop", "app"),
    resourcesAppDir,
  ]);
  const serverWorkingDir = path.dirname(serverEntry);
  const dbFile = path.join(app.getPath("userData"), "command-center.db");

  serverProcess = fork(serverEntry, [], {
    cwd: serverWorkingDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      HOSTNAME: host,
      PORT: String(port),
      DATABASE_URL: `file:${dbFile}`,
      PRISMA_LOG_QUERIES: "false",
      RUNTIME_API_URL: process.env.RUNTIME_API_URL ?? "http://127.0.0.1:8010",
      RUNTIME_API_TIMEOUT_MS: process.env.RUNTIME_API_TIMEOUT_MS ?? "2000",
      DEFAULT_WORKSPACE_NAME: process.env.DEFAULT_WORKSPACE_NAME ?? "Command Center",
    },
    stdio: "pipe",
  });

  serverProcess.stdout?.on("data", (chunk) => {
    process.stdout.write(`[next] ${chunk}`);
  });

  serverProcess.stderr?.on("data", (chunk) => {
    process.stderr.write(`[next] ${chunk}`);
  });

  serverProcess.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Bundled Next server exited with code ${code}`);
    }
  });

  await waitForServer(baseUrl);
}

function stopBundledServer() {
  if (!serverProcess) {
    return;
  }

  serverProcess.kill();
  serverProcess = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1120,
    minHeight: 760,
    title: "Command Center",
    autoHideMenuBar: true,
    backgroundColor: "#f6f5ef",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(baseUrl);
}

app.on("window-all-closed", () => {
  stopBundledServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopBundledServer();
});

app.whenReady().then(async () => {
  try {
    await startBundledServer();
    createWindow();
  } catch (error) {
    dialog.showErrorBox(
      "Command Center failed to start",
      error instanceof Error ? error.message : "Unknown startup error",
    );
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
