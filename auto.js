const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const login = require("ws3-fca");

const app = express();

const COMMAND_PATH = path.join(__dirname, "script", "commands");
const EVENT_PATH = path.join(__dirname, "script", "events");
const CONFIG_PATH = path.join(__dirname, "config", "config.json");

const Utils = {
  commands: new Map(),
  events: new Map(),
  startTime: Date.now()
};

/* ===================== LOAD CONFIG ===================== */
const config = fs.existsSync(CONFIG_PATH)
  ? JSON.parse(fs.readFileSync(CONFIG_PATH))
  : { prefix: false, admins: [] };

/* ===================== HELPERS ===================== */
function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

/* ===================== LOAD COMMANDS ===================== */
function loadCommands() {
  Utils.commands.clear();

  const files = walk(COMMAND_PATH);
  for (const file of files) {
    try {
      delete require.cache[require.resolve(file)];
      const cmd = require(file);

      if (!cmd?.config?.name || typeof cmd.run !== "function") continue;

      const name = cmd.config.name.toLowerCase();
      Utils.commands.set(name, cmd);

      if (Array.isArray(cmd.config.aliases)) {
        for (const a of cmd.config.aliases) {
          Utils.commands.set(a.toLowerCase(), cmd);
        }
      }

      console.log(`[CMD] Loaded: ${name}`);
    } catch (e) {
      console.log(`[CMD] Failed: ${path.basename(file)} → ${e.message}`);
    }
  }
}

/* ===================== LOAD EVENTS ===================== */
function loadEvents() {
  Utils.events.clear();

  const files = walk(EVENT_PATH);
  for (const file of files) {
    try {
      delete require.cache[require.resolve(file)];
      const ev = require(file);

      if (!ev?.name || typeof ev.run !== "function") continue;

      Utils.events.set(ev.name, ev);
      console.log(`[EVENT] Loaded: ${ev.name}`);
    } catch (e) {
      console.log(`[EVENT] Failed: ${path.basename(file)} → ${e.message}`);
    }
  }
}

loadCommands();
loadEvents();

/* ===================== EXPRESS ===================== */
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===================== PANEL APIs ===================== */
app.get("/commands", (req, res) => {
  const unique = [...new Set([...Utils.commands.values()].map(c => c.config.name))];
  res.json({ commands: unique });
});

app.get("/events", (req, res) => {
  res.json({ events: [...Utils.events.keys()] });
});

app.get("/online_user", (req, res) => {
  res.json({
    online: true,
    uptime: Math.floor((Date.now() - Utils.startTime) / 1000)
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
      if (error || !event) return;

      /* ===== EVENTS ===== */
      if (Utils.events.has(event.type)) {
        try {
          Utils.events.get(event.type).run({ api, event });
        } catch {}
      }

      if (!event.body) return;

      const botPrefix = prefix ?? config.prefix;
      if (botPrefix && !event.body.startsWith(botPrefix)) return;

      const args = botPrefix
        ? event.body.slice(botPrefix.length).trim().split(/\s+/)
        : event.body.trim().split(/\s+/);

      const cmdName = args.shift().toLowerCase();
      const cmd = Utils.commands.get(cmdName);
      if (!cmd) return;

      try {
        cmd.run({ api, event, args });
      } catch {
        api.sendMessage("⚠️ Command error.", event.threadID);
      }
    });

    res.json({ success: true, message: "Bot logged in successfully" });
  });
});

/* ===================== START ===================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});