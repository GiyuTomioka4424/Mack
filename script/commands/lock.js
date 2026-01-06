const fs = require("fs");
const path = require("path");

const LOCK_PATH = path.join(__dirname, "../../data/lock.json");
const ADMIN_UID = "61562953390569";

// auto create lock.json if missing
if (!fs.existsSync(LOCK_PATH)) {
  fs.writeFileSync(LOCK_PATH, JSON.stringify({ locked: false }, null, 2));
}

module.exports = {
  config: {
    name: "lock",
    aliases: ["unlock"],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID } = event;

    // admin only
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ This command is for Admin only.",
        event.threadID
      );
    }

    const data = JSON.parse(fs.readFileSync(LOCK_PATH));

    // ===== LOCK =====
    if (args[0] === "on" || event.body === "lock") {
      if (data.locked) {
        return api.sendMessage("🔒 Bot is already locked.", event.threadID);
      }

      data.locked = true;
      fs.writeFileSync(LOCK_PATH, JSON.stringify(data, null, 2));

      const msg =
        "🔐 BOT LOCKED 🔐\n\n" +
        "The admin has locked the bot.\n" +
        "Only admin commands will work.\n\n" +
        "⏳ Please wait...";

      api.getThreadList(100, null, ["INBOX"], (err, list) => {
        if (!err) {
          list.forEach(t => api.sendMessage(msg, t.threadID));
        }
      });

      return;
    }

    // ===== UNLOCK =====
    if (args[0] === "off" || event.body === "unlock") {
      if (!data.locked) {
        return api.sendMessage("🔓 Bot is already unlocked.", event.threadID);
      }

      data.locked = false;
      fs.writeFileSync(LOCK_PATH, JSON.stringify(data, null, 2));

      const msg =
        "🔓 BOT UNLOCKED 🔓\n\n" +
        "The admin has unlocked the bot.\n" +
        "All commands are now available!\n\n" +
        "✅ Enjoy!";

      api.getThreadList(100, null, ["INBOX"], (err, list) => {
        if (!err) {
          list.forEach(t => api.sendMessage(msg, t.threadID));
        }
      });

      return;
    }

    api.sendMessage(
      "🔐 LOCK COMMAND\n\n" +
      "lock → lock the bot\n" +
      "unlock → unlock the bot",
      event.threadID
    );
  }
};