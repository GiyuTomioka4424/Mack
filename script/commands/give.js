const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

const ADMIN_UID = "61562953390569";

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

module.exports = {
  config: {
    name: "give",
    aliases: [],
    cooldown: 2,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, mentions } = event;

    /* 🔒 ADMIN CHECK */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ You are not allowed to use this command.",
        threadID
      );
    }

    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH, "utf8"));

    /* ================= GET TARGET ================= */
    let targetID;

    if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args[0]) {
      targetID = args[0];
    }

    const amount = parseInt(args[mentions && Object.keys(mentions).length ? 1 : 1]);

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

    /* ================= REGISTER CHECK ================= */
    if (!users[targetID]) {
      return api.sendMessage(
        "❌ That user is not registered.",
        threadID
      );
    }

    /* ================= GIVE MONEY ================= */
    balance[targetID] = Number(balance[targetID]) || 0;
    balance[targetID] += amount;

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

    /* ================= CONFIRM ================= */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "💸 MONEY SENT\n" +
      "╚════════════════════╝\n\n" +
      `👤 Receiver: ${users[targetID].name}\n` +
      `💰 Amount: ₱${amount.toLocaleString()}\n\n` +
      "✅ Transaction successful.",
      threadID
    );

    api.sendMessage(
      "╔════════════════════╗\n" +
      "🎉 YOU RECEIVED MONEY\n" +
      "╚════════════════════╝\n\n" +
      `💰 Amount: ₱${amount.toLocaleString()}\n` +
      "🎁 From: Admin",
      targetID
    );
  }
};