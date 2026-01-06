const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const login = require("ws3-fca");

const app = express();

/* ================= PATHS ================= */
const COMMAND_PATH = path.join(__dirname, "script", "commands");
const EVENT_PATH = path.join(__dirname, "script", "events");
const PUBLIC_PATH = path.join(__dirname, "public");

/* ================= GLOBAL UTILS ================= */
global.Utils = {
  commands: new Map(),
  handleEvent: new Map()
};

/* ================= ENSURE DATA ================= */
const DATA_PATH = path.join(__dirname, "data");
if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH, { recursive: true });

/* ================= LOAD COMMANDS ================= */
function loadCommands() {
  if (!fs.existsSync(COMMAND_PATH)) return;

  const files = fs.readdirSync(COMMAND_PATH).filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      const filePath = path.join(COMMAND_PATH, file);
      delete require.cache[require.resolve(filePath)];
      const cmd = require(filePath);

      if (!cmd?.config?.name || typeof cmd.run !== "function") continue;

      const name = cmd.config.name.toLowerCase();
      Utils.commands.set(name, cmd);

      if (Array.isArray(cmd.config.aliases)) {
        cmd.config.aliases.forEach(a => {
          Utils.commands.set(a.toLowerCase(), cmd);
        });
      }

      console.log(`[CMD] Loaded: ${name}`);
    } catch (e) {
      console.log(`[CMD] Failed: ${file} → ${e.message}`);
    }
  }
}

/* ================= LOAD EVENTS ================= */
function loadEvents() {
  if (!fs.existsSync(EVENT_PATH)) return;

  const files = fs.readdirSync(EVENT_PATH).filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      const evt = require(path.join(EVENT_PATH, file));
      if (evt?.name && typeof evt.run === "function") {
        Utils.handleEvent.set(evt.name, evt);
        console.log(`[EVENT] Loaded: ${evt.name}`);
      }
    } catch (e) {
      console.log(`[EVENT] Failed: ${file}`);
    }
  }
}

loadCommands();
loadEvents();

/* ================= EXPRESS ================= */
app.use(bodyParser.json());
app.use(express.static(PUBLIC_PATH));

/* ================= COMMAND LIST API (WEBSITE) ================= */
app.get("/commands", (req, res) => {
  const commandNames = new Set();
  const commands = [];
  const handleEvent = [];

  for (const cmd of Utils.commands.values()) {
    if (cmd?.config?.name && !commandNames.has(cmd.config.name)) {
      commandNames.add(cmd.config.name);
      commands.push(cmd.config.name);
    }
  }

  for (const evt of Utils.handleEvent.keys()) {
    handleEvent.push(evt);
  }

  res.json({
    commands: commands.sort(),
    handleEvent: handleEvent.sort(),
    aliases: []
  });
});

/* ================= LOGIN ================= */
app.post("/login", (req, res) => {
  const { state, prefix } = req.body;
  if (!state) return res.json({ success: false, message: "Missing appstate" });

  login({ appState: state }, (err, api) => {
    if (err) return res.json({ success: false, message: err.message });

    api.setOptions({ listenEvents: true });

    api.listenMqtt((error, event) => {
      if (error || !event) return;

      /* ===== HANDLE EVENTS ===== */
      const evtHandler = Utils.handleEvent.get(event.type);
      if (evtHandler) {
        try {
          evtHandler.run({ api, event });
        } catch {}
      }

      if (!event.body) return;

      const body = event.body.trim();
      if (!body) return;

      let args = [];
      let commandName = "";

      /* PREFIX MODE */
      if (prefix && body.startsWith(prefix)) {
        args = body.slice(prefix.length).trim().split(/\s+/);
        commandName = args.shift()?.toLowerCase();
      }
      /* NO PREFIX MODE */
      else {
        args = body.split(/\s+/);
        commandName = args.shift()?.toLowerCase();
      }

      if (!commandName) return;

      const command = Utils.commands.get(commandName);
      if (!command) return;

      try {
        command.run({ api, event, args });
      } catch (e) {
        api.sendMessage("⚠️ Command error.", event.threadID);
      }
    });

    res.json({ success: true, message: "Bot logged in successfully" });
  });
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});