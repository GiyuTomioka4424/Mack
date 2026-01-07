const fs = require("fs");
const path = require("path");

const ADMIN_UID = "61562953390569";
const COMMAND_DIR = __dirname; // script/commands

module.exports = {
  config: {
    name: "cmd",
    aliases: ["command"],
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { senderID, threadID, body } = event;

    /* 🔒 ADMIN ONLY */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ ACCESS DENIED\nOnly the bot admin can manage commands.",
        threadID
      );
    }

    /* ================= HELP ================= */
    if (!args[0]) {
      return api.sendMessage(
        "╔════════════════════╗\n" +
        "📦 CMD MANAGER\n" +
        "╚════════════════════╝\n\n" +
        "cmd install <file>.js <code>\n" +
        "cmd uninstall <file>.js\n\n" +
        "⚡ No restart required",
        threadID
      );
    }

    /* ================= INSTALL ================= */
    if (args[0] === "install") {
      const fileName = args[1];

      if (!fileName || !fileName.endsWith(".js")) {
        return api.sendMessage(
          "❌ Invalid filename.\nExample:\ncmd install test.js",
          threadID
        );
      }

      const filePath = path.join(COMMAND_DIR, fileName);

      /* extract code after filename */
      const codeIndex = body.indexOf(fileName) + fileName.length;
      const code = body.slice(codeIndex).trim();

      if (!code || !code.includes("module.exports")) {
        return api.sendMessage(
          "❌ Invalid command code.\nMust include module.exports",
          threadID
        );
      }

      try {
        /* write file */
        fs.writeFileSync(filePath, code);

        /* hot reload */
        delete require.cache[require.resolve(filePath)];
        const cmd = require(filePath);

        if (!cmd?.config?.name || typeof cmd.run !== "function") {
          fs.unlinkSync(filePath);
          return api.sendMessage(
            "❌ Invalid command format.\nMissing config or run()",
            threadID
          );
        }

        /* register command */
        global.Utils.commands.set(cmd.config.name.toLowerCase(), cmd);
        (cmd.config.aliases || []).forEach(a =>
          global.Utils.commands.set(a.toLowerCase(), cmd)
        );

        return api.sendMessage(
          "✅ COMMAND INSTALLED\n\n" +
          `📁 File: ${fileName}\n` +
          `⚡ Loaded instantly\n` +
          `📌 Command: ${cmd.config.name}`,
          threadID
        );

      } catch (err) {
        return api.sendMessage(
          "❌ INSTALL FAILED\n\n" + err.message,
          threadID
        );
      }
    }

    /* ================= UNINSTALL ================= */
    if (args[0] === "uninstall") {
      const fileName = args[1];

      if (!fileName || !fileName.endsWith(".js")) {
        return api.sendMessage(
          "❌ Invalid filename.\nExample:\ncmd uninstall test.js",
          threadID
        );
      }

      const filePath = path.join(COMMAND_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        return api.sendMessage("❌ Command not found.", threadID);
      }

      try {
        /* unload */
        delete require.cache[require.resolve(filePath)];
        const cmd = require(filePath);

        global.Utils.commands.delete(cmd.config.name.toLowerCase());
        (cmd.config.aliases || []).forEach(a =>
          global.Utils.commands.delete(a.toLowerCase())
        );

        fs.unlinkSync(filePath);

        return api.sendMessage(
          "🗑️ COMMAND REMOVED\n\n" +
          `📁 File: ${fileName}\n` +
          "⚡ Unloaded instantly",
          threadID
        );
      } catch (err) {
        return api.sendMessage(
          "❌ UNINSTALL FAILED\n\n" + err.message,
          threadID
        );
      }
    }

    /* ================= UNKNOWN ================= */
    api.sendMessage("❓ Unknown cmd action.\nUse: cmd", threadID);
  }
};