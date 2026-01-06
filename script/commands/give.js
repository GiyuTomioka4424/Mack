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
    role: 0,
    cooldown: 2,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, mentions } = event;

    /* 🔒 ADMIN CHECK */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage("⛔ You are not allowed to use this command.", threadID);
    }

    /* 🎯 GET TARGET */
    let targetID;
    let amount;

    if (Object.keys(mentions || {}).length > 0) {
      targetID = Object.keys(mentions)[0];
      amount = parseInt(args[1]);
    } else {
      targetID = args[0];
      amount = parseInt(args[1]);
    }

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
    const balance = JSON.parse(fs.readFileSync(BAL_PATH, "utf8"));

    /* 📝 REGISTER CHECK */
    if (!users[targetID]) {
      return api.sendMessage("❌ That user is not registered.", threadID);
    }

    /* 💰 GIVE MONEY (SAFE) */
    balance[targetID] = (balance[targetID] || 0) + amount;

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

    /* ✅ CONFIRM TO ADMIN */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "💸 MONEY SENT\n" +
      "╚════════════════════╝\n\n" +
      `👤 Receiver: ${users[targetID].name}\n` +
      `🆔 UID: ${targetID}\n` +
      `💰 Amount: ₱${amount.toLocaleString()}\n\n` +
      "✅ Transaction successful.",
      threadID
    );

    /* 🎉 NOTIFY RECEIVER */
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