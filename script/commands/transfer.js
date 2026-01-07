const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

module.exports = {
  config: {
    name: "transfer",
    aliases: ["send"],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, mentions } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH, "utf8"));

    /* 📝 REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    /* 🎯 GET TARGET */
    let targetID;
    if (Object.keys(mentions || {}).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (args[0]) {
      targetID = args[0];
    }

    const amount = parseInt(
      args[Object.keys(mentions || {}).length ? 1 : 1]
    );

    if (!targetID || isNaN(amount) || amount <= 0) {
      return api.sendMessage(
        "╔════════════════════╗\n" +
        "💸 TRANSFER MONEY\n" +
        "╚════════════════════╝\n\n" +
        "Usage:\n" +
        "transfer @user <amount>\n" +
        "transfer <uid> <amount>",
        threadID
      );
    }

    if (targetID === senderID) {
      return api.sendMessage("❌ You cannot transfer to yourself.", threadID);
    }

    if (!users[targetID]) {
      return api.sendMessage("❌ Receiver is not registered.", threadID);
    }

    /* 💰 INIT BALANCE */
    balance[senderID] = Number(balance[senderID]) || 0;
    balance[targetID] = Number(balance[targetID]) || 0;

    if (balance[senderID] < amount) {
      return api.sendMessage(
        "❌ Not enough balance.\n" +
        `💰 Your balance: ₱${balance[senderID].toLocaleString()}`,
        threadID
      );
    }

    /* 🔁 TRANSFER */
    balance[senderID] -= amount;
    balance[targetID] += amount;

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

    /* ✅ CONFIRM */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "💸 TRANSFER SUCCESS\n" +
      "╚════════════════════╝\n\n" +
      `👤 To: ${users[targetID].name || targetID}\n` +
      `💰 Amount: ₱${amount.toLocaleString()}`,
      threadID
    );

    api.sendMessage(
      "╔════════════════════╗\n" +
      "🎉 YOU RECEIVED MONEY\n" +
      "╚════════════════════╝\n\n" +
      `💰 Amount: ₱${amount.toLocaleString()}\n` +
      `👤 From: ${users[senderID].name || senderID}`,
      targetID
    );
  }
};