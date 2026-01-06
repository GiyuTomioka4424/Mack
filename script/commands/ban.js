const fs = require("fs");
const path = require("path");

const BAN_PATH = path.join(__dirname, "../../data/ban.json");
const ADMIN_UID = "61562953390569";

if (!fs.existsSync(BAN_PATH)) {
  fs.writeFileSync(BAN_PATH, JSON.stringify({}, null, 2));
}

module.exports = {
  config: {
    name: "ban",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    // 🔒 ADMIN ONLY
    if (senderID !== ADMIN_UID) {
      return api.sendMessage("⛔ Admin only command.", threadID);
    }

    const bans = JSON.parse(fs.readFileSync(BAN_PATH, "utf8"));
    const targetID =
      args[0] ||
      event.mentions && Object.keys(event.mentions)[0];

    if (!targetID) {
      return api.sendMessage(
        "❌ Please mention a user or provide UID.\nExample:\nban @user",
        threadID
      );
    }

    if (bans[targetID]) {
      return api.sendMessage("⚠️ User is already banned.", threadID);
    }

    bans[targetID] = {
      bannedBy: senderID,
      time: Date.now()
    };

    fs.writeFileSync(BAN_PATH, JSON.stringify(bans, null, 2));

    api.sendMessage(
      "🚫 USER BANNED\n\n" +
      `👤 UID: ${targetID}\n` +
      "❌ They can no longer use the bot.",
      threadID
    );
  }
};