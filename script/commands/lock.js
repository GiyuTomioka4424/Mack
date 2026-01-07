const fs = require("fs");
const path = require("path");

const LOCK_PATH = path.join(__dirname, "../../data/lock.json");
const ADMIN_UID = "61562953390569";

// auto create file
if (!fs.existsSync(LOCK_PATH)) {
  fs.writeFileSync(LOCK_PATH, JSON.stringify({ locked: false }, null, 2));
}

module.exports = {
  config: {
    name: "lock",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    if (senderID !== ADMIN_UID) {
      return api.sendMessage("⛔ Admin only command.", threadID);
    }

    const data = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));

    // ===== LOCK =====
    if (args[0] === "on") {
      if (data.locked) {
        return api.sendMessage("🔒 Bot is already locked.", threadID);
      }

      data.locked = true;
      fs.writeFileSync(LOCK_PATH, JSON.stringify(data, null, 2));

      broadcast(api,
        "🔐 BOT LOCKED 🔐\n\n" +
        "Only admin commands will work.\n" +
        "Please wait until unlocked."
      );

      return api.sendMessage("✅ Bot locked successfully.", threadID);
    }

    // ===== UNLOCK =====
    if (args[0] === "off") {
      if (!data.locked) {
        return api.sendMessage("🔓 Bot is already unlocked.", threadID);
      }

      data.locked = false;
      fs.writeFileSync(LOCK_PATH, JSON.stringify(data, null, 2));

      broadcast(api,
        "🔓 BOT UNLOCKED 🔓\n\n" +
        "All commands are now available.\n" +
        "Enjoy!"
      );

      return api.sendMessage("✅ Bot unlocked successfully.", threadID);
    }

    // ===== HELP =====
    api.sendMessage(
      "🔐 LOCK COMMAND\n\n" +
      "lock on  → Lock the bot\n" +
      "lock off → Unlock the bot",
      threadID
    );
  }
};

// ===== BROADCAST HELPER =====
function broadcast(api, message) {
  api.getThreadList(100, null, ["INBOX"], (err, list) => {
    if (err) return;
    list.forEach(t => api.sendMessage(message, t.threadID));
  });
}