const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const login = require("ws3-fca");

const app = express();
const COMMAND_PATH = path.join(__dirname, "script", "commands");
const CONFIG_PATH = path.join(__dirname, "config", "config.json");

const config = fs.existsSync(CONFIG_PATH)
  ? JSON.parse(fs.readFileSync(CONFIG_PATH))
  : { prefix: false };

const Utils = {
  commands: new Map()
};

/* ===================== BOT UPTIME ===================== */
const onlineSince = Date.now();

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
      console.log(`[CMD] Failed: ${file} → ${err.message}`);
    }
  }
}

loadCommands();

/* ===================== EXPRESS ===================== */
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===================== ROUTES ===================== */

// Home (for uptime pinger)
app.get("/", (req, res) => {
  res.send("🤖 Macky System is running");
});

// Active / online page FIX
app.get("/online_user", (req, res) => {
  res.json({
    status: "online",
    bot: config.botName || "Macky System",
    uptime: Math.floor((Date.now() - onlineSince) / 1000) + " seconds",
    time: new Date().toLocaleString()
  });
});

// Command list API
app.get("/commands", (req, res) => {
  const unique = new Set();
  const commands = [];

  for (const cmd of Utils.commands.values()) {
    if (!unique.has(cmd.config.name)) {
      unique.add(cmd.config.name);
      commands.push(cmd.config.name);
    }
  }

  res.json({ commands });
});

/* ===================== LOGIN ===================== */
app.post("/login", async (req, res) => {
  const { state } = req.body;

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

      const body = event.body.trim();

      // PREFIX HANDLING
      if (config.prefix !== false) {
        if (!body.startsWith(config.prefix)) return;
      }

      const args = config.prefix !== false
        ? body.slice(config.prefix.length).trim().split(/\s+/)
        : body.split(/\s+/);

      const commandName = args.shift().toLowerCase();
      const command = Utils.commands.get(commandName);
      if (!command) return;

      try {
        command.run({ api, event, args });
      } catch (e) {
        api.sendMessage("⚠️ Command error.", event.threadID);
        console.error(e);
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