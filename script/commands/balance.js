const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "money"],
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event }) {
    const uid = event.senderID;
    const threadID = event.threadID;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));

    /* 🔒 REGISTER CHECK */
    if (!users[uid]) {
      return api.sendMessage("📝 You must register first.", threadID);
    }

    /* 🚨 DO NOT RESET MONEY */
    if (typeof balance[uid] !== "number") {
      balance[uid] = 0;
      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    }

    const msg =
      "╔════════════════════╗\n" +
      "💰 BALANCE 💰\n" +
      "╚════════════════════╝\n\n" +
      `👤 Name: ${users[uid].name}\n` +
      `🆔 User ID: ${uid}\n\n` +
      `💵 Money: ₱${balance[uid].toLocaleString()}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎮 Earn more by playing games!";

    api.sendMessage(msg, threadID);
  }
};