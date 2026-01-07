const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

const ADMIN_UID = "61562953390569";
const COMMAND_DIR = path.join(__dirname);

// ❌ blocked dangerous shell cmds
const BLOCKED = [
  "rm ",
  "shutdown",
  "reboot",
  "kill ",
  "pkill",
  "poweroff",
  ":(){",
  "mkfs",
  "dd "
];

module.exports = {
  config: {
    name: "shell",
    aliases: ["sh", "terminal"],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, body } = event;

    /* 🔒 ADMIN ONLY */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage("⛔ Admin only command.", threadID);
    }

    /* ================= INSTALL ================= */
    if (args[0] === "install") {
      const fileName = args[1];
      const url = args[2];

      if (!fileName || !fileName.endsWith(".js") || !url) {
        return api.sendMessage(
          "📦 SHELL INSTALL\n\n" +
          "Usage:\n" +
          "shell install <file>.js <raw_url>\n\n" +
          "Example:\n" +
          "shell install test.js https://pastebin.com/raw/xxxx",
          threadID
        );
      }

      const filePath = path.join(COMMAND_DIR, fileName);

      if (fs.existsSync(filePath)) {
        return api.sendMessage("⚠️ Command already exists.", threadID);
      }

      api.sendMessage("⏳ Downloading command...", threadID);

      https.get(url, res => {
        let data = "";

        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          if (!data.includes("module.exports")) {
            return api.sendMessage(
              "❌ Invalid command file.\nMissing module.exports.",
              threadID
            );
          }

          try {
            fs.writeFileSync(filePath, data);

            // 🔁 hot-load command
            delete require.cache[require.resolve(filePath)];
            const cmd = require(filePath);

            if (!cmd?.config?.name || typeof cmd.run !== "function") {
              fs.unlinkSync(filePath);
              return api.sendMessage("❌ Invalid command structure.", threadID);
            }

            global.Utils.commands.set(cmd.config.name, cmd);
            if (Array.isArray(cmd.config.aliases)) {
              cmd.config.aliases.forEach(a =>
                global.Utils.commands.set(a, cmd)
              );
            }

            api.sendMessage(
              "✅ COMMAND INSTALLED\n\n" +
              `📁 File: ${fileName}\n` +
              `⚡ Loaded instantly\n\n` +
              "No restart needed.",
              threadID
            );

          } catch (e) {
            api.sendMessage("❌ Install failed:\n" + e.message, threadID);
          }
        });
      }).on("error", err => {
        api.sendMessage("❌ Download error:\n" + err.message, threadID);
      });

      return;
    }

    /* ================= NORMAL SHELL ================= */
    if (!args.length) {
      return api.sendMessage(
        "💻 SHELL TERMINAL\n\n" +
        "shell <command>\n" +
        "shell install <file>.js <url>",
        threadID
      );
    }

    const command = body.slice(body.indexOf("shell") + 5).trim();

    for (const bad of BLOCKED) {
      if (command.includes(bad)) {
        return api.sendMessage("🚫 BLOCKED COMMAND.", threadID);
      }
    }

    exec(command, { timeout: 8000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return api.sendMessage(
          "❌ SHELL ERROR\n\n" +
          (stderr || err.message).slice(0, 1800),
          threadID
        );
      }

      api.sendMessage(
        "✅ SHELL OUTPUT\n\n" +
        (stdout || "(no output)").slice(0, 1800),
        threadID
      );
    });
  }
};