const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const ADMIN_UID = "61562953390569";

if (!fs.existsSync(USERS_PATH)) {
  fs.writeFileSync(USERS_PATH, JSON.stringify({}, null, 2));
}

module.exports = {
  config: {
    name: "give",
    aliases: [],
    role: 0,
    cooldown: 2,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, mentions } = event;

    /* ================= ADMIN CHECK ================= */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ You are not allowed to use this command.",
        threadID
      );
    }

    /* ================= GET TARGET ================= */
    let targetID;

    if (Object.keys(mentions || {}).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args[0]) {
      targetID = args[0];
    }

    const amount = parseInt(args[Object.keys(mentions || {}).length ? 1 : 1]);

    if (!targetID || isNaN(amount) || amount <= 0) {
      return api.sendMessage(
        "╔════════════════════╗\n" +
        "💸 GIVE MONEY\n" +
        "╚════════════════════╝\n\n" +
        "Usage:\n" +
        "➤ give @user 1000\n" +
        "➤ give uid 1000",
        threadID
      );
    }

    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));

    /* ================= REGISTER CHECK (RECEIVER) ================= */
    if (!users[targetID]) {
      return api.sendMessage(
        "❌ That user is not registered.",
        threadID
      );
    }

    /* ================= GIVE MONEY ================= */
    users[targetID].money = (users[targetID].money || 0) + amount;

    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    /* ================= CONFIRM ================= */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "💸 MONEY SENT\n" +
      "╚════════════════════╝\n\n" +
      `👤 Receiver: ${targetID}\n` +
      `💰 Amount : ${amount.toLocaleString()} coins\n\n` +
      "✅ Transaction successful.",
      threadID
    );

    api.sendMessage(
      "╔════════════════════╗\n" +
      "🎉 YOU RECEIVED MONEY\n" +
      "╚════════════════════╝\n\n" +
      `💰 Amount: ${amount.toLocaleString()} coins\n` +
      "🎁 From: Admin",
      targetID
    );
  }
};