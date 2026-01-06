const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");

if (!fs.existsSync(USERS_PATH)) {
  fs.writeFileSync(USERS_PATH, JSON.stringify({}, null, 2));
}

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "money"],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    // 🔒 REGISTER CHECK
    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register",
        threadID
      );
    }

    const money = users[senderID].money || 0;

    api.sendMessage(
      "╔════════════════════╗\n" +
      "💰 𝗕𝗔𝗟𝗔𝗡𝗖𝗘\n" +
      "╚════════════════════╝\n\n" +
      `👤 User ID:\n${senderID}\n\n` +
      `💵 Money:\n➤ ${money.toLocaleString()} coins\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "🪙 Earn more by playing games!",
      threadID
    );
  }
};