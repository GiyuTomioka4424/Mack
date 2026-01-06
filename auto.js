const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const login = require("ws3-fca");

const app = express();
const COMMAND_PATH = path.join(__dirname, "script", "commands");
const EVENT_PATH = path.join(__dirname, "script", "events");

/* ================= GLOBAL STORE ================= */
global.Utils = {
  commands: new Map(),
  handleEvent: new Map()
};

/* ================= ENSURE DATA FOLDER ================= */
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

/* ================= LOAD COMMANDS ================= */
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

      if (!cmd?.config?.name || typeof cmd.run !== "function") {
        console.log(`[CMD] Skipped: ${file}`);
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
    } catch (err) {
      console.log(`[EVENT] Failed: ${file}`);
    }
  }
}

loadCommands();
loadEvents();

/* ================= EXPRESS ================= */
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= COMMANDS API (WEBSITE FIX) ================= */
app.get("/commands", (req, res) => {
  try {
    const uniqueCommands = new Set();
    const commandList = [];
    const eventList = [];

    for (const cmd of Utils.commands.values()) {
      if (cmd?.config?.name && !uniqueCommands.has(cmd.config.name)) {
        uniqueCommands.add(cmd.config.name);
        commandList.push(cmd.config.name);
      }
    }

    if (fs.existsSync(EVENT_PATH)) {
      const files = fs.readdirSync(EVENT_PATH).filter(f => f.endsWith(".js"));
      for (const f of files) {
        eventList.push(f.replace(".js", ""));
      }
    }

    res.json({
      commands: commandList.sort(),
      handleEvent: eventList.sort(),
      aliases: []
    });
  } catch (e) {
    res.json({ commands: [], handleEvent: [], aliases: [] });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  const { state, prefix } = req.body;
  if (!state) return res.json({ success: false, message: "Missing appstate" });

  login({ appState: state }, (err, api) => {
    if (err) return res.json({ success: false, message: err.message });

    api.setOptions({ listenEvents: true });

    api.listenMqtt((error, event) => {
      if (error || !event?.body) return;

      /* EVENTS */
      if (Utils.handleEvent.has(event.type)) {
        try {
          Utils.handleEvent.get(event.type).run({ api, event });
        } catch {}
      }

      /* COMMANDS */
      if (!prefix || !event.body.startsWith(prefix)) return;

      const args = event.body.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift().toLowerCase();
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
  console.log(`🌐 Server running on http://localhost:${PORT}`);
});