const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const BANK_PATH = path.join(__dirname, "../../data/bank.json");

/* ================= INIT FILES ================= */
if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(BANK_PATH)) fs.writeFileSync(BANK_PATH, "{}");

module.exports = {
  config: {
    name: "bank",
    aliases: [],
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const bank = JSON.parse(fs.readFileSync(BANK_PATH));

    /* 📝 REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    balance[senderID] = Number(balance[senderID]) || 0;
    bank[senderID] ??= { money: 0, loan: 0 };

    /* ================= VIEW BANK ================= */
    if (!args[0]) {
      return api.sendMessage(
        "╔════════════════════╗\n" +
        "🏦 BANK ACCOUNT\n" +
        "╚════════════════════╝\n\n" +
        `💰 Wallet: ₱${balance[senderID].toLocaleString()}\n` +
        `🏦 Bank: ₱${bank[senderID].money.toLocaleString()}\n` +
        `💳 Loan: ₱${bank[senderID].loan.toLocaleString()}\n\n` +
        "Usage:\n" +
        "bank deposit <amount>\n" +
        "bank withdraw <amount>",
        threadID
      );
    }

    const amount = parseInt(args[1]);

    if (!amount || amount <= 0) {
      return api.sendMessage("❌ Invalid amount.", threadID);
    }

    /* ================= DEPOSIT ================= */
    if (args[0] === "deposit") {
      if (balance[senderID] < amount) {
        return api.sendMessage(
          "❌ Not enough wallet balance.\n\n" +
          `💰 Wallet: ₱${balance[senderID].toLocaleString()}`,
          threadID
        );
      }

      balance[senderID] -= amount;
      bank[senderID].money += amount;

      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
      fs.writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2));

      return api.sendMessage(
        "✅ DEPOSIT SUCCESSFUL\n\n" +
        `💰 Deposited: ₱${amount.toLocaleString()}\n` +
        `🏦 Bank Balance: ₱${bank[senderID].money.toLocaleString()}`,
        threadID
      );
    }

    /* ================= WITHDRAW ================= */
    if (args[0] === "withdraw") {
      if (bank[senderID].money < amount) {
        return api.sendMessage(
          "❌ Not enough bank balance.\n\n" +
          `🏦 Bank: ₱${bank[senderID].money.toLocaleString()}`,
          threadID
        );
      }

      bank[senderID].money -= amount;
      balance[senderID] += amount;

      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
      fs.writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2));

      return api.sendMessage(
        "✅ WITHDRAW SUCCESSFUL\n\n" +
        `💰 Withdrawn: ₱${amount.toLocaleString()}\n` +
        `💼 Wallet: ₱${balance[senderID].toLocaleString()}`,
        threadID
      );
    }

    api.sendMessage("❌ Unknown bank command.", threadID);
  }
};