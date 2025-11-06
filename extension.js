// extension.js
const vscode = require("vscode");
const axios = require("axios");
const os = require("os");
const path = require("path");

// --------- state ----------
const state = {
  timer: undefined,
  lastActivityMs: Date.now(),
  startedMs: undefined,
  bufferedMinutes: 0,
  lastKnownFile: "unknown",
  linesAdded: 0,
  linesRemoved: 0,
};

// --------- config helpers ----------
function getCfg() {
  const cfg = vscode.workspace.getConfiguration("codetrackr");
  return {
    apiBase: cfg.get("apiBase", "http://127.0.0.1:5050"),
    userId: cfg.get("userId") || safeUsername(),
    apiKey: cfg.get("apiKey") || "",
    flushIntervalSeconds: Math.max(5, cfg.get("flushIntervalSeconds", 30)),
    minFlushMinutes: Math.max(0.1, cfg.get("minFlushMinutes", 0.5)),
  };
}

function safeUsername() {
  try {
    return os.userInfo().username || "unknown";
  } catch {
    return "unknown";
  }
}

// --------- helpers ----------
function getFileMeta(filePath) {
  if (!filePath) return {};
  const ext = path.extname(filePath).toLowerCase();
  const projectName = vscode.workspace.name || path.basename(vscode.workspace.rootPath || path.dirname(filePath));
  const language = vscode.window.activeTextEditor?.document?.languageId || "unknown";
  return { fileType: ext, projectName, language };
}

function markActivity(fileNameMaybe) {
  state.lastActivityMs = Date.now();
  if (fileNameMaybe) {
    state.lastKnownFile = fileNameMaybe;
  } else {
    const active = vscode.window.activeTextEditor?.document?.fileName;
    if (active) state.lastKnownFile = active;
  }
}

// --------- backend calls ----------
async function sendActivity(minutes, fileOpened) {
  const { apiBase, userId, apiKey } = getCfg();

  const fullPath = fileOpened || vscode.window.activeTextEditor?.document?.fileName || "unknown";
  const { fileType, projectName, language } = getFileMeta(fullPath);

  const payload = {
    timestamp: new Date().toISOString(),
    userId,
    fileName: fullPath,
    fileType,
    projectName,
    language,
    duration: Number(minutes.toFixed(3)),
    linesAdded: state.linesAdded,
    linesRemoved: state.linesRemoved,
  };

  const headers = apiKey ? { "x-api-key": apiKey } : undefined;

  try {
    const res = await axios.post(`${apiBase}/api/user-activity`, payload, { headers });
    console.log("✅ Uploaded:", res.data);
    vscode.window.setStatusBarMessage("CodeTrackr: flushed ✅", 2000);
  } catch (err) {
    console.error("❌ Upload failed:", err?.message || err);
    vscode.window.setStatusBarMessage("CodeTrackr: flush failed 🔁", 3000);
    throw err;
  } finally {
    // reset line counters after flush
    state.linesAdded = 0;
    state.linesRemoved = 0;
  }
}

function minutesSince(ms) {
  return (Date.now() - ms) / 60000;
}

// try to flush if buffered time meets threshold
async function flushIfNeeded(force = false) {
  if (!state.startedMs) return;

  const elapsedFromStartMin = minutesSince(state.startedMs);
  const totalBuffered = state.bufferedMinutes + elapsedFromStartMin;

  const { minFlushMinutes } = getCfg();
  if (!force && totalBuffered < minFlushMinutes) return;

  const fileOpened =
    vscode.window.activeTextEditor?.document?.fileName ||
    state.lastKnownFile ||
    "unknown";

  try {
    await sendActivity(totalBuffered, fileOpened);
    state.startedMs = Date.now();
    state.bufferedMinutes = 0;
  } catch {
    state.bufferedMinutes = totalBuffered;
    state.startedMs = Date.now();
  }
}

// --------- commands ----------
function start(context) {
  if (state.timer) {
    vscode.window.setStatusBarMessage("CodeTrackr: already running ⏱️", 2000);
    return;
  }

  const { flushIntervalSeconds } = getCfg();

  state.startedMs = Date.now();
  markActivity();

  // Watch file edits for line changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const changes = event.contentChanges;
      for (const c of changes) {
        const added = (c.text.match(/\n/g) || []).length;
        const removed = c.range.end.line - c.range.start.line;
        state.linesAdded += added;
        state.linesRemoved += removed > 0 ? removed : 0;
      }
      markActivity(event.document.fileName);
    })
  );

  state.timer = setInterval(() => {
    const idleMin = minutesSince(state.lastActivityMs);
    if (idleMin > 10) {
      state.startedMs = Date.now();
      return;
    }
    flushIfNeeded(false).catch(() => {});
  }, flushIntervalSeconds * 1000);

  context.subscriptions.push({ dispose: stop });
  vscode.window.setStatusBarMessage("CodeTrackr: started ⏳", 2000);
}

function stop() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = undefined;
  }
  state.startedMs = undefined;
  state.bufferedMinutes = 0;
  vscode.window.setStatusBarMessage("CodeTrackr: stopped 🛑", 2000);
}

async function flushNow() {
  await flushIfNeeded(true);
}

// --------- VS Code hooks ----------
function activate(context) {
  console.log("💻 CodeTrackr extension activated");

  const cmdStart = vscode.commands.registerCommand("codetrackr.start", () => start(context));
  const cmdStop = vscode.commands.registerCommand("codetrackr.stop", () => stop());
  const cmdFlush = vscode.commands.registerCommand("codetrackr.flushNow", () => flushNow());

  context.subscriptions.push(cmdStart, cmdStop, cmdFlush);
}

function deactivate() {
  stop();
}

module.exports = { activate, deactivate };
