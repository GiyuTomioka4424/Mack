const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const login = require("ws3-fca");

const app = express();

const COMMAND_DIR = path.join(__dirname, "script", "commands");
const EVENT_DIR = path.join(__dirname, "script", "events");

const Utils = {
  commands: new Map(),
  events: new Map()
};

/* ===================== RECURSIVE LOADER ===================== */
function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, callback);
    } else if (file.endsWith(".js")) {
      callback(full);
    }
  }
}

/* ===================== LOAD COMMANDS ===================== */
function loadCommands() {
  Utils.commands.clear();

  walk(COMMAND_DIR, (filePath) => {
    try {
      delete require.cache[require.resolve(filePath)];
      const cmd = require(filePath);

      if (!cmd?.config?.name || typeof cmd.run !== "function") return;

      const name = cmd.config.name.toLowerCase();
      Utils.commands.set(name, cmd);

      (cmd.config.aliases || []).forEach(a =>
        Utils.commands.set(a.toLowerCase(), cmd)
      );

      console.log(`[CMD] Loaded: ${name}`);
    } catch (e) {
      console.log(`[CMD] Failed: ${path.basename(filePath)} → ${e.message}`);
    }
  });
}

/* ===================== LOAD EVENTS ===================== */
function loadEvents() {
  Utils.events.clear();

  walk(EVENT_DIR, (filePath) => {
    try {
      delete require.cache[require.resolve(filePath)];
      const ev = require(filePath);

      if (!ev?.name || typeof ev.run !== "function") return;

      Utils.events.set(ev.name, ev);
      console.log(`[EVENT] Loaded: ${ev.name}`);
    } catch (e) {
      console.log(`[EVENT] Failed: ${path.basename(filePath)} → ${e.message}`);
    }
  });
}

loadCommands();
loadEvents();

/* ===================== EXPRESS ===================== */
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===================== WEBSITE API ===================== */
app.get("/commands", (req, res) => {
  const unique = [...new Set(
    [...Utils.commands.values()].map(c => c.config.name)
  )];

  res.json({
    commands: unique.sort(),
    events: [...Utils.events.keys()].sort()
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
      if (error) return;

      /* EVENTS */
      if (Utils.events.has(event.type)) {
        try {
          Utils.events.get(event.type).run({ api, event });
        } catch {}
      }

      if (!event.body) return;

      const body = event.body.trim();
      const usedPrefix = prefix || "";

      if (usedPrefix && !body.startsWith(usedPrefix)) return;

      const args = body.slice(usedPrefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      const command = Utils.commands.get(commandName);
      if (!command) return;

      /* SAFE EXECUTION (NO FREEZE) */
      Promise.resolve().then(() =>
        command.run({ api, event, args })
      ).catch(err => {
        console.log("[CMD ERROR]", commandName, err.message);
        api.sendMessage("⚠️ Command error.", event.threadID);
      });
    });

    res.json({ success: true, message: "Bot logged in successfully" });
  });
});

/* ===================== START ===================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Web running on port", PORT);
});