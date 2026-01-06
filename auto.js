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
const DATA_PATH = path.join(__dirname, "data");

/* ================= ENSURE DATA ================= */
if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH, { recursive: true });

/* ================= GLOBAL ================= */
global.Utils = {
  commands: new Map(),
  handleEvent: new Map()
};

/* ================= LOAD COMMANDS ================= */
function loadCommands() {
  if (!fs.existsSync(COMMAND_PATH)) return;

  const files = fs.readdirSync(COMMAND_PATH).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(COMMAND_PATH, file);
    try {
      delete require.cache[require.resolve(filePath)];
      const cmd = require(filePath);

      if (!cmd?.config?.name || typeof cmd.run !== "function") continue;

      const name = cmd.config.name.toLowerCase();
      Utils.commands.set(name, cmd);

      if (Array.isArray(cmd.config.aliases)) {
        cmd.config.aliases.forEach(a =>
          Utils.commands.set(a.toLowerCase(), cmd)
        );
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
    const filePath = path.join(EVENT_PATH, file);
    try {
      delete require.cache[require.resolve(filePath)];
      const evt = require(filePath);

      if (!evt?.name || typeof evt.run !== "function") continue;

      Utils.handleEvent.set(evt.name, evt);
      console.log(`[EVENT] Loaded: ${evt.name}`);
    } catch (err) {
      console.log(`[EVENT] Failed: ${file}`);
    }
  }
}

loadCommands();
loadEvents();

/* ================= EXPRESS ================= */
app.use(bodyParser.json());
app.use(express.static(PUBLIC_PATH));

/* ================= COMMAND LIST (WEBSITE) ================= */
app.get("/commands", (req, res) => {
  const cmdSet = new Set();
  const commands = [];
  const handleEvent = [];

  for (const cmd of Utils.commands.values()) {
    if (cmd?.config?.name && !cmdSet.has(cmd.config.name)) {
      cmdSet.add(cmd.config.name);
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
  const { state, prefix = "" } = req.body;
  if (!state) return res.json({ success: false, message: "Missing appstate" });

  login({ appState: state }, (err, api) => {
    if (err) return res.json({ success: false, message: err.message });

    api.setOptions({
      listenEvents: true,
      selfListen: false
    });

    api.listenMqtt(async (error, event) => {
      try {
        if (error || !event) return;

        /* ===== EVENTS ===== */
        for (const evt of Utils.handleEvent.values()) {
          try {
            await evt.run({ api, event });
          } catch {}
        }

        if (!event.body) return;

        const body = event.body.trim();
        if (!body) return;

        let commandName;
        let args;

        /* PREFIX */
        if (prefix && body.startsWith(prefix)) {
          args = body.slice(prefix.length).trim().split(/\s+/);
          commandName = args.shift()?.toLowerCase();
        }
        /* NO PREFIX */
        else {
          args = body.split(/\s+/);
          commandName = args.shift()?.toLowerCase();
        }

        if (!commandName) return;

        const command = Utils.commands.get(commandName);
        if (!command) return;

        /* SAFE EXECUTION (NO CRASH) */
        Promise.resolve(
          command.run({ api, event, args })
        ).catch(() => {
          api.sendMessage("⚠️ Command error.", event.threadID);
        });

      } catch {
        // never crash listener
      }
    });

    res.json({ success: true, message: "Bot logged in successfully" });
  });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});