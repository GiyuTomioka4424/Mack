const { exec } = require("child_process");

const ADMIN_UID = "61562953390569";
const OUTPUT_LIMIT = 3500; // Messenger safe limit

module.exports = {
  config: {
    name: "shell",
    aliases: ["sh", "terminal"],
    cooldown: 2,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, body } = event;

    /* 🔒 ADMIN ONLY */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage("⛔ Admin only command.", threadID);
    }

    const cmd = body.replace(/^shell\s*/i, "").trim();

    if (!cmd) {
      return api.sendMessage(
        "🖥️ SHELL TERMINAL\n\n" +
        "Usage:\n" +
        "shell <command>\n\n" +
        "Examples:\n" +
        "shell ls\n" +
        "shell node -v\n" +
        "shell npm -v",
        threadID
      );
    }

    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
      let output = "";

      if (err) {
        output += `❌ ERROR:\n${err.message}\n\n`;
      }

      if (stderr) {
        output += `⚠️ STDERR:\n${stderr}\n\n`;
      }

      if (stdout) {
        output += `✅ OUTPUT:\n${stdout}`;
      }

      if (!output.trim()) {
        output = "✅ Command executed with no output.";
      }

      // prevent crash from huge output
      if (output.length > OUTPUT_LIMIT) {
        output = output.slice(0, OUTPUT_LIMIT) + "\n\n⚠️ Output truncated.";
      }

      api.sendMessage(
        "╔════════════════════╗\n" +
        "🖥️ SHELL RESULT\n" +
        "╚════════════════════╝\n\n" +
        output,
        threadID
      );
    });
  }
};