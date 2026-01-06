const fs = require("fs");
const path = require("path");

const ADMIN_UID = "61562953390569";
const COMMAND_DIR = path.join(__dirname, "../commands"); // ✅ FIXED PATH

module.exports = {
  config: {
    name: "cmd",
    aliases: ["command"],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    /* 🔒 ADMIN CHECK */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ ACCESS DENIED\n\nOnly the bot admin can manage commands.",
        threadID
      );
    }

    /* ================= HELP ================= */
    if (!args[0]) {
      return api.sendMessage(
        "📦 CMD MANAGER\n\n" +
        "Commands:\n" +
        "cmd install <file>.js <code>\n" +
        "cmd uninstall <file>.js\n\n" +
        "⚠️ Note:\n" +
        "• Restart bot after install/uninstall\n" +
        "• File name must end with .js",
        threadID
      );
    }

    /* ================= INSTALL ================= */
    if (args[0] === "install") {
      const fileName = args[1];

      /* 🛑 VALIDATION */
      if (
        !fileName ||
        !fileName.endsWith(".js") ||
        fileName.includes("/") ||
        fileName.includes("\\")
      ) {
        return api.sendMessage(
          "❌ Invalid filename.\nExample:\ncmd install test.js",
          threadID
        );
      }

      const filePath = path.join(COMMAND_DIR, fileName);

      if (fs.existsSync(filePath)) {
        return api.sendMessage(
          "⚠️ Command already exists.\nUninstall it first.",
          threadID
        );
      }

      /* 📦 EXTRACT CODE */
      const code = args.slice(2).join(" ");

      if (!code) {
        return api.sendMessage(
          "❌ No code detected.\nPaste command code after filename.",
          threadID
        );
      }

      if (!code.includes("module.exports")) {
        return api.sendMessage(
          "❌ Invalid command format.\nMissing module.exports.",
          threadID
        );
      }

      try {
        fs.writeFileSync(filePath, code, "utf8");

        return api.sendMessage(
          "✅ COMMAND INSTALLED\n\n" +
          `📁 File: ${fileName}\n\n` +
          "🔁 Restart the bot to load the new command.",
          threadID
        );
      } catch (err) {
        return api.sendMessage(
          "❌ Failed to install command.\n" + err.message,
          threadID
        );
      }
    }

    /* ================= UNINSTALL ================= */
    if (args[0] === "uninstall") {
      const fileName = args[1];

      if (
        !fileName ||
        !fileName.endsWith(".js") ||
        fileName.includes("/") ||
        fileName.includes("\\")
      ) {
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
        fs.unlinkSync(filePath);

        return api.sendMessage(
          "🗑️ COMMAND UNINSTALLED\n\n" +
          `📁 Removed: ${fileName}\n\n` +
          "🔁 Restart the bot to apply changes.",
          threadID
        );
      } catch (err) {
        return api.sendMessage(
          "❌ Failed to uninstall command.\n" + err.message,
          threadID
        );
      }
    }

    /* ================= UNKNOWN ================= */
    api.sendMessage("❓ Unknown cmd action.\nUse: cmd", threadID);
  }
};