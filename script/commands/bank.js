const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BANK_PATH = path.join(__dirname, "../../data/bank.json");

if (!fs.existsSync(BANK_PATH)) {
  fs.writeFileSync(BANK_PATH, JSON.stringify({}, null, 2));
}

module.exports = {
  config: {
    name: "bank",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, mentions } = event;

    /* ================= REGISTER CHECK ================= */
    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    if (!users[senderID]) {
      return api.sendMessage(
        "╔════════════════════╗\n" +
        "📝 REGISTRATION REQUIRED\n" +
        "╚════════════════════╝\n\n" +
        "You must register first to use the bank.\n\n" +
        "➤ Type: register",
        threadID
      );
    }

    const bankData = JSON.parse(fs.readFileSync(BANK_PATH, "utf8"));
    if (!bankData[senderID]) {
      bankData[senderID] = { bank: 0, loan: 0 };
    }

    const sub = args[0];
    const amount = parseInt(args[2] || args[1]);

    /* ================= CHECK / BALANCE ================= */
    if (!sub || sub === "check" || sub === "balance") {
      return api.sendMessage(
        "╔════════════════════╗\n" +
        "🏦 MACKY BANK ACCOUNT\n" +
        "╚════════════════════╝\n\n" +
        `👛 Wallet : ${users[senderID].money || 0}\n` +
        `🏦 Bank   : ${bankData[senderID].bank}\n` +
        `💳 Loan   : ${bankData[senderID].loan}`,
        threadID
      );
    }

    /* ================= DEPOSIT ================= */
    if (sub === "deposit") {
      if (bankData[senderID].loan > 0)
        return api.sendMessage("⛔ Pay your loan first before depositing.", threadID);

      if (!amount || amount <= 0)
        return api.sendMessage("❌ Invalid amount.", threadID);

      if (users[senderID].money < amount)
        return api.sendMessage("❌ Not enough wallet balance.", threadID);

      users[senderID].money -= amount;
      bankData[senderID].bank += amount;

      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      fs.writeFileSync(BANK_PATH, JSON.stringify(bankData, null, 2));

      return api.sendMessage(
        `✅ DEPOSIT SUCCESS\n\n💰 Amount: ${amount}\n🏦 New Bank Balance: ${bankData[senderID].bank}`,
        threadID
      );
    }

    /* ================= WITHDRAW ================= */
    if (sub === "withdraw") {
      if (!amount || amount <= 0)
        return api.sendMessage("❌ Invalid amount.", threadID);

      if (bankData[senderID].bank < amount)
        return api.sendMessage("❌ Not enough bank balance.", threadID);

      bankData[senderID].bank -= amount;
      users[senderID].money += amount;

      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      fs.writeFileSync(BANK_PATH, JSON.stringify(bankData, null, 2));

      return api.sendMessage(
        `✅ WITHDRAW SUCCESS\n\n💸 Amount: ${amount}\n🏦 Remaining Bank Balance: ${bankData[senderID].bank}`,
        threadID
      );
    }

    /* ================= TRANSFER (MENTION / UID) ================= */
    if (sub === "transfer") {
      let targetID = Object.keys(mentions)[0] || args[1];

      if (!targetID)
        return api.sendMessage(
          "❌ Invalid usage\n\nExample:\nbank transfer @user 500\nbank transfer 1000123456789 500",
          threadID
        );

      if (!users[targetID])
        return api.sendMessage("❌ Target user is not registered.", threadID);

      if (!amount || amount <= 0)
        return api.sendMessage("❌ Invalid amount.", threadID);

      if (bankData[senderID].bank < amount)
        return api.sendMessage("❌ Not enough bank balance.", threadID);

      if (!bankData[targetID]) {
        bankData[targetID] = { bank: 0, loan: 0 };
      }

      bankData[senderID].bank -= amount;
      bankData[targetID].bank += amount;

      fs.writeFileSync(BANK_PATH, JSON.stringify(bankData, null, 2));

      return api.sendMessage(
        "╔════════════════════╗\n" +
        "💸 TRANSFER SUCCESS\n" +
        "╚════════════════════╝\n\n" +
        `👤 To : ${targetID}\n` +
        `💰 Amount : ${amount}\n\n` +
        `🏦 Your New Balance : ${bankData[senderID].bank}`,
        threadID
      );
    }

    /* ================= LOAN ================= */
    if (sub === "loan") {
      if (!amount || amount <= 0)
        return api.sendMessage("❌ Invalid loan amount.", threadID);

      if (bankData[senderID].loan > 0)
        return api.sendMessage("⛔ You already have an active loan.", threadID);

      bankData[senderID].loan = amount;
      users[senderID].money += amount;

      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      fs.writeFileSync(BANK_PATH, JSON.stringify(bankData, null, 2));

      return api.sendMessage(
        "╔════════════════════╗\n" +
        "💳 LOAN APPROVED\n" +
        "╚════════════════════╝\n\n" +
        `💰 Loan Amount : ${amount}\n⚠️ Pay it back using: bank payloan`,
        threadID
      );
    }

    /* ================= PAY LOAN ================= */
    if (sub === "payloan") {
      if (bankData[senderID].loan <= 0)
        return api.sendMessage("✅ You have no active loan.", threadID);

      const loan = bankData[senderID].loan;
      if (users[senderID].money < loan)
        return api.sendMessage("❌ Not enough wallet balance to pay loan.", threadID);

      users[senderID].money -= loan;
      bankData[senderID].loan = 0;

      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      fs.writeFileSync(BANK_PATH, JSON.stringify(bankData, null, 2));

      return api.sendMessage(
        "✅ LOAN PAID\n\n🎉 You are now debt-free!",
        threadID
      );
    }

    /* ================= RICHEST ================= */
    if (sub === "richest") {
      const ranking = Object.entries(bankData)
        .sort((a, b) => b[1].bank - a[1].bank)
        .slice(0, 10);

      let msg =
        "╔════════════════════╗\n" +
        "👑 RICHEST PLAYERS\n" +
        "╚════════════════════╝\n\n";

      ranking.forEach(([uid, data], i) => {
        msg += `${i + 1}. ${uid} — 💰 ${data.bank}\n`;
      });

      return api.sendMessage(msg, threadID);
    }

    /* ================= HELP ================= */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "🏦 BANK COMMANDS\n" +
      "╚════════════════════╝\n\n" +
      "• bank balance\n" +
      "• bank deposit <amount>\n" +
      "• bank withdraw <amount>\n" +
      "• bank transfer <@user|uid> <amount>\n" +
      "• bank loan <amount>\n" +
      "• bank payloan\n" +
      "• bank richest",
      threadID
    );
  }
};