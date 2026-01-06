const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const login = require("ws3-fca");

const app = express();

const COMMAND_PATH = path.join(__dirname, "script", "commands");
const EVENT_PATH = path.join(__dirname, "script", "events");

const Utils = {
  commands: new Map(),
  handleEvent: new Map()
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
      const aliases = Array.isArray(cmd.config.aliases) ? cmd.config.aliases : [];

      Utils.commands.set(name, cmd);
      aliases.forEach(a => Utils.commands.set(a.toLowerCase(), cmd));

      console.log(`[CMD] Loaded: ${name}`);
    } catch (err) {
      console.log(`[CMD] Failed: ${file} ${err.message}`);
    }
  }
}

loadCommands();

/* ===================== LOAD EVENTS (WEBSITE ONLY) ===================== */
function loadEvents() {
  if (!fs.existsSync(EVENT_PATH)) {
    console.log("[EVENT] events folder not found");
    return;
  }

  const files = fs.readdirSync(EVENT_PATH).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(EVENT_PATH, file);
    try {
      delete require.cache[require.resolve(filePath)];
      const event = require(filePath);

      if (!event || !event.name || typeof event.handleEvent !== "function") {
        console.log(`[EVENT] Skipped: ${file} (invalid format)`);
        continue;
      }

      Utils.handleEvent.set(event.name, event);
      console.log(`[EVENT] Loaded: ${event.name}`);
    } catch (err) {
      console.log(`[EVENT] Failed: ${file} ${err.message}`);
    }
  }
}

loadEvents();

/* ===================== EXPRESS ===================== */
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===================== COMMAND LIST API ===================== */
app.get("/commands", (req, res) => {
  const commandSet = new Set();
  const commands = [];

  for (const cmd of Utils.commands.values()) {
    if (!commandSet.has(cmd.config.name)) {
      commandSet.add(cmd.config.name);
      commands.push(cmd.config.name);
    }
  }

  const events = [...Utils.handleEvent.keys()];

  res.json({
    commands,
    handleEvent: events,
    aliases: []
  });
});

/* ===================== LOGIN ===================== */
app.post("/login", async (req, res) => {
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

      /* COMMANDS */
      if (event.body && event.body.startsWith(prefix)) {
        const args = event.body.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        const command = Utils.commands.get(commandName);

        if (command) {
          try {
            command.run({ api, event, args });
          } catch {
            api.sendMessage("⚠️ Command error.", event.threadID);
          }
        }
      }
    });

    res.json({ success: true, message: "Bot logged in successfully" });
  });
});

/* ===================== START SERVER ===================== */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
});