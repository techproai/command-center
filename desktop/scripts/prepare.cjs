const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");
const webDir = path.join(rootDir, "web");
const standaloneDir = path.join(webDir, ".next", "standalone");
const staticDir = path.join(webDir, ".next", "static");
const publicDir = path.join(webDir, "public");
const appOutDir = path.join(rootDir, "desktop", "app");

function resetOutput() {
  fs.rmSync(appOutDir, { recursive: true, force: true });
  fs.mkdirSync(appOutDir, { recursive: true });
}

function copyStandalone() {
  if (!fs.existsSync(standaloneDir)) {
    throw new Error("Missing standalone output. Run NEXT_STANDALONE=true web build first.");
  }

  const rootServer = path.join(standaloneDir, "server.js");
  const nestedServer = path.join(standaloneDir, "web", "server.js");

  if (fs.existsSync(rootServer)) {
    fs.cpSync(standaloneDir, appOutDir, { recursive: true });
    return;
  }

  if (fs.existsSync(nestedServer)) {
    fs.cpSync(path.join(standaloneDir, "web"), appOutDir, { recursive: true });

    const rootNodeModules = path.join(standaloneDir, "node_modules");
    if (fs.existsSync(rootNodeModules)) {
      fs.cpSync(rootNodeModules, path.join(appOutDir, "node_modules"), { recursive: true });
    }

    const rootPackageJson = path.join(standaloneDir, "package.json");
    if (fs.existsSync(rootPackageJson)) {
      fs.copyFileSync(rootPackageJson, path.join(appOutDir, "package.json"));
    }

    return;
  }

  throw new Error("Unable to locate standalone server.js output.");
}

function copyStaticAssets() {
  if (fs.existsSync(staticDir)) {
    fs.mkdirSync(path.join(appOutDir, ".next"), { recursive: true });
    fs.cpSync(staticDir, path.join(appOutDir, ".next", "static"), { recursive: true });
  }

  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, path.join(appOutDir, "public"), { recursive: true });
  }
}

function main() {
  resetOutput();
  copyStandalone();
  copyStaticAssets();

  console.log(`Desktop app bundle prepared at ${appOutDir}`);
}

main();
