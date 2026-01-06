const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const login = require("ws3-fca");

const app = express();

// paths
const ROOT = __dirname;
const COMMAND_PATH = path.join(ROOT, "script", "commands");
const DATA_PATH = path.join(ROOT, "data");

// utils
const Utils = {
  commands: new Map(),
  handleEvent: new Map()
};

/* ===================== ENSURE DATA FOLDER ===================== */
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

/* ===================== SAFE LOAD COMMANDS ===================== */
function loadCommands() {
  Utils.commands.clear();

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

      if (!cmd?.config?.name || typeof cmd.run !== "function") {
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
app.use(express.static(path.join(ROOT, "public")));

/* ===================== COMMAND LIST API ===================== */
app.get("/commands", (req, res) => {
  const unique = new Set();
  const commands = [];

  for (const cmd of Utils.commands.values()) {
    if (!unique.has(cmd.config.name)) {
      unique.add(cmd.config.name);
      commands.push(cmd.config.name);
    }
  }

  res.json({
    commands,
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

    api.setOptions({ listenEvents: true });

    api.listenMqtt((error, event) => {
      if (error || !event.body) return;

      let body = event.body.trim();
      let args = [];
      let commandName = "";

      // ✅ NO PREFIX MODE
      if (!prefix || prefix === false) {
        args = body.split(/\s+/);
        commandName = args.shift().toLowerCase();
      } else {
        if (!body.startsWith(prefix)) return;
        args = body.slice(prefix.length).trim().split(/\s+/);
        commandName = args.shift().toLowerCase();
      }

      const command = Utils.commands.get(commandName);
      if (!command) return;

      try {
        command.run({ api, event, args });
      } catch (e) {
        console.error(e);
        api.sendMessage("⚠️ Command error.", event.threadID);
      }
    });

    res.json({ success: true, message: "Bot logged in successfully" });
  });
});

/* ===================== START SERVER ===================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});