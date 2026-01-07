const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { PasteClient } = require("pastebin-api");

const ADMIN_UID = "61562953390569";
const COMMAND_DIR = __dirname;
const PASTEBIN_KEY = "N5NL5MiwHU6EbQxsGtqy7iaodOcHithV";

module.exports = {
  config: {
    name: "adc",
    aliases: ["bin"],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { senderID, threadID, messageReply } = event;

    /* 🔒 ADMIN ONLY */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "❌ You are not allowed to use this command.",
        threadID
      );
    }

    /* ================= UPLOAD LOCAL FILE ================= */
    if (!messageReply && args[0]) {
      const fileName = args[0].replace(".js", "") + ".js";
      const filePath = path.join(COMMAND_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        return api.sendMessage(
          `❌ Command "${fileName}" does not exist.`,
          threadID
        );
      }

      const code = fs.readFileSync(filePath, "utf8");
      const client = new PasteClient(PASTEBIN_KEY);

      try {
        const url = await client.createPaste({
          code,
          expireDate: "N",
          format: "javascript",
          name: fileName,
          publicity: 1
        });

        const raw = "https://pastebin.com/raw/" + url.split("/")[3];
        return api.sendMessage(
          "✅ UPLOADED TO PASTEBIN\n\n" + raw,
          threadID
        );
      } catch (e) {
        return api.sendMessage("❌ Pastebin error.", threadID);
      }
    }

    /* ================= APPLY FROM LINK ================= */
    if (messageReply && args[0]) {
      const fileName = args[0].replace(".js", "") + ".js";
      const filePath = path.join(COMMAND_DIR, fileName);
      const url = messageReply.body;

      if (!url.startsWith("http")) {
        return api.sendMessage(
          "❌ Reply to a valid raw / pastebin link.",
          threadID
        );
      }

      try {
        const res = await axios.get(url);
        const code = res.data;

        if (!code.includes("module.exports")) {
          return api.sendMessage(
            "❌ Invalid command code.\nMissing module.exports",
            threadID
          );
        }

        fs.writeFileSync(filePath, code);

        return api.sendMessage(
          "✅ COMMAND APPLIED\n\n" +
          `📁 File: ${fileName}\n` +
          "🔁 Use it immediately (no restart needed)",
          threadID
        );
      } catch (e) {
        return api.sendMessage(
          "❌ Failed to apply code.",
          threadID
        );
      }
    }

    /* ================= HELP ================= */
    api.sendMessage(
      "📦 ADC COMMAND\n\n" +
      "Upload command:\n" +
      "adc <commandName>\n\n" +
      "Apply from link:\n" +
      "Reply to raw link + adc <newName>",
      threadID
    );
  }
};