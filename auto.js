const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const login = require("ws3-fca");

const app = express();

/* ===================== PATHS ===================== */
const COMMAND_PATH = path.join(__dirname, "script", "commands");
const DATA_PATH = path.join(__dirname, "data");

/* ===================== ENSURE DATA FOLDER ===================== */
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

/* ===================== GLOBAL UTILS ===================== */
const Utils = {
  commands: new Map(),
  events: new Map()
};

/* ===================== LOAD COMMANDS ===================== */
function loadCommands() {
  if (!fs.existsSync(COMMAND_PATH)) {
    console.log("[CMD] commands folder not found");
    return;
  }

  const files = fs.readdirSync(COMMAND_PATH).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(COMMAND_PATH, file);
    try {
      delete require.cache[require.resolve(filePath)];
      const cmd = require(filePath);

      if (!cmd || !cmd.config || !cmd.config.name || typeof cmd.run !== "function") {
        console.log(`[CMD] Skipped: ${file} (invalid format)`);
        continue;
      }

      const name = cmd.config.name.toLowerCase();
      Utils.commands.set(name, cmd);

      if (Array.isArray(cmd.config.aliases)) {
        for (const a of cmd.config.aliases) {
          Utils.commands.set(a.toLowerCase(), cmd);
        }
      }

      console.log(`[CMD] Loaded: ${name}`);
    } catch (err) {
      console.log(`[CMD] Failed: ${file} → ${err.message}`);
    }
  }
}

loadCommands();

/* ===================== EXPRESS ===================== */
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===================== COMMAND LIST API (WEBSITE) ===================== */
app.get("/commands", (req, res) => {
  const unique = new Set();
  const list = [];

  for (const cmd of Utils.commands.values()) {
    if (!unique.has(cmd.config.name)) {
      unique.add(cmd.config.name);
      list.push(cmd.config.name);
    }
  }

  res.json({
    commands: list.sort(),
    events: []
  });
});

/* ===================== LOGIN ===================== */
app.post("/login", (req, res) => {
  const { state, prefix } = req.body;

  if (!state) {
    return res.json({ success: false, message: "Missing appstate" });
  }

  login({ appState: state }, (err, api) => {
    if (err) {
      return res.json({ success: false, message: err.message });
    }

    api.setOptions({
      listenEvents: true,
      selfListen: false
    });

    console.log("[BOT] Logged in successfully");

    api.listenMqtt((error, event) => {
      if (error || !event || !event.body) return;

      const body = event.body.trim();
      if (!body) return;

      let args = [];
      let commandName = null;

      /* ================= PREFIX MODE ================= */
      if (prefix && body.startsWith(prefix)) {
        args = body.slice(prefix.length).trim().split(/\s+/);
        commandName = args.shift()?.toLowerCase();
      }

      /* ================= NO PREFIX MODE ================= */
      else {
        args = body.split(/\s+/);
        commandName = args.shift()?.toLowerCase();
      }

      if (!commandName) return;

      const command = Utils.commands.get(commandName);
      if (!command) return;

      try {
        command.run({
          api,
          event,
          args
        });
      } catch (e) {
        console.error("[CMD ERROR]", e);
        api.sendMessage("⚠️ Command error.", event.threadID);
      }
    });

    res.json({
      success: true,
      message: "Bot logged in successfully"
    });
  });
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});