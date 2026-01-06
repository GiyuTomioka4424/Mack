const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BANK_PATH = path.join(__dirname, "../../data/bank.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");
if (!fs.existsSync(BANK_PATH)) fs.writeFileSync(BANK_PATH, "{}");

const SYMBOLS = ["🍒", "🍋", "🍉", "⭐", "💎"];

function spin() {
  return [
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  ];
}

function isWin(reels) {
  return reels[0] === reels[1] && reels[1] === reels[2];
}

module.exports = {
  config: {
    name: "slot",
    aliases: [],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));
    const bank = JSON.parse(fs.readFileSync(BANK_PATH));

    /* 📝 REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    balance[senderID] = Number(balance[senderID]) || 0;
    inventory[senderID] = inventory[senderID] || {};
    bank[senderID] = bank[senderID] || { loan: 0 };

    /* 🚫 LOAN CHECK */
    if (bank[senderID].loan > 0) {
      return api.sendMessage(
        "🚫 SLOT LOCKED\n\n" +
        "You have an active loan.\n" +
        "Please pay your loan first before playing slot.",
        threadID
      );
    }

    const bet = parseInt(args[0]);

    if (!bet || bet <= 0) {
      return api.sendMessage(
        "🎰 SLOT MACHINE 🎰\n\n" +
        "Usage:\nslot <bet>\n\n" +
        "Example:\nslot 1000",
        threadID
      );
    }

    if (balance[senderID] < bet) {
      return api.sendMessage(
        "❌ Not enough balance.\n\n" +
        `💰 Your balance: ₱${balance[senderID].toLocaleString()}`,
        threadID
      );
    }

    /* 🍀 LUCKY CHARM BONUS */
    let winChance = 0.25; // 25% base chance
    let usedCharm = false;

    if (inventory[senderID].lucky_charm > 0) {
      winChance = 0.45; // boosted chance
      inventory[senderID].lucky_charm -= 1;
      usedCharm = true;
    }

    balance[senderID] -= bet;

    const reels = spin();
    const win = Math.random() < winChance || isWin(reels);

    let msg =
      "╔════════════════════╗\n" +
      "🎰 SLOT RESULT 🎰\n" +
      "╚════════════════════╝\n\n" +
      `${reels.join(" | ")}\n\n`;

    if (win) {
      const reward = bet * 2;
      balance[senderID] += reward;

      msg +=
        "🎉 YOU WON!\n\n" +
        `💰 Prize: ₱${reward.toLocaleString()}`;
    } else {
      msg +=
        "💀 You lost this round.\n" +
        "Try again!";
    }

    if (usedCharm) {
      msg += "\n\n🍀 Lucky Charm was used!";
    }

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

    api.sendMessage(msg, threadID);
  }
};