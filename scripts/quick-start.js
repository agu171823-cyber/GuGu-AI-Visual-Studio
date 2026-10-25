"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const APP_NAME = "GuGu AI Visual Studio";
const RECOGNIZED_APP_NAMES = new Set([APP_NAME, "Gugu Image Edit"]);

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const envPath = path.join(rootDir, ".env");
  const examplePath = path.join(rootDir, ".env.example");
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) fs.copyFileSync(examplePath, envPath);
  loadDotEnv(envPath);
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) {
    console.error(`[${APP_NAME}] 当前 Node.js 为 ${process.version}，请安装 Node.js 24 LTS 或 22.13+。`);
    process.exitCode = 1;
    return;
  }

  const host = process.env.HOST || "127.0.0.1";
  const port = positiveInteger(process.env.PORT, 8797);
  const browserHost = host === "0.0.0.0" || host === "::" ? "127.0.0.1" : host;
  const url = `http://${browserHost}:${port}`;

  if (await probeExistingApp(url)) {
    console.log(`[${APP_NAME}] 程序已经在运行，正在打开：${url}`);
    openBrowser(url);
    return;
  }

  const { server } = require(path.join(rootDir, "server", "server.js"));
  server.once("listening", () => {
    const address = server.address();
    const listeningHost = address.address === "::" || address.address === "0.0.0.0" ? "127.0.0.1" : address.address;
    const listeningUrl = `http://${listeningHost}:${address.port}`;
    console.log(`[${APP_NAME}] 浏览器地址：${listeningUrl}`);
    console.log(`[${APP_NAME}] 保持此窗口打开；按 Ctrl+C 停止。\n`);
    openBrowser(listeningUrl);
  });

  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE" && await probeExistingApp(url)) {
      console.log(`[${APP_NAME}] 程序已经在运行，正在打开：${url}`);
      openBrowser(url);
      process.exitCode = 0;
      return;
    }
    if (error.code === "EADDRINUSE") {
      console.error(`[${APP_NAME}] 端口 ${port} 被其他程序占用，请关闭占用程序，或设置 PORT 后重试。`);
    } else {
      console.error(`[${APP_NAME}] 启动失败：${error.message}`);
    }
    process.exitCode = 1;
  });
}

async function probeExistingApp(url, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`${url}/api/health`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(1500)
    });
    if (!response.ok) return false;
    const status = await response.json();
    return RECOGNIZED_APP_NAMES.has(status?.app);
  } catch {
    return false;
  }
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= 65535 ? number : fallback;
}

function openBrowser(url) {
  let command;
  let args;
  if (process.platform === "win32") {
    command = "cmd.exe";
    args = ["/d", "/s", "/c", "start", "", url];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else {
    command = "xdg-open";
    args = [url];
  }
  try {
    const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
    child.unref();
  } catch {
    console.log(`[${APP_NAME}] 请手动打开 ${url}`);
  }
}

if (require.main === module) main().catch((error) => {
  console.error(`[${APP_NAME}] 启动失败：${error.message}`);
  process.exitCode = 1;
});

module.exports = { main, probeExistingApp, positiveInteger, loadDotEnv };
