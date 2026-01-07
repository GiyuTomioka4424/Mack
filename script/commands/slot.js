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
const COOLDOWN = 5000;
const spam = new Map();

function spin() {
  return [
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  ];
}

function getMatchCount(reels) {
  const count = {};
  reels.forEach(r => count[r] = (count[r] || 0) + 1);
  return Math.max(...Object.values(count));
}

module.exports = {
  config: {
    name: "slot",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    /* 🛑 ANTI SPAM */
    const now = Date.now();
    if (spam.has(senderID) && now - spam.get(senderID) < COOLDOWN) {
      return api.sendMessage(
        "⏳ Slow down!\nWait a few seconds before spinning again.",
        threadID
      );
    }
    spam.set(senderID, now);

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
    inventory[senderID] ||= {};
    bank[senderID] ||= { loan: 0 };

    /* 🚫 LOAN CHECK */
    if (bank[senderID].loan > 0) {
      return api.sendMessage(
        "🚫 SLOT LOCKED\n\nYou have an active loan.\nPay it first to play.",
        threadID
      );
    }

    const bet = parseInt(args[0]);
    if (!bet || bet <= 0) {
      return api.sendMessage(
        "🎰 SLOT MACHINE\n\nUsage:\nslot <bet>\nExample:\nslot 1000",
        threadID
      );
    }

    if (balance[senderID] < bet) {
      return api.sendMessage(
        `❌ Not enough balance.\n💰 Balance: ₱${balance[senderID].toLocaleString()}`,
        threadID
      );
    }

    /* 🍀 LUCKY CHARM */
    let usedCharm = false;
    let bonusChance = 0;

    if (inventory[senderID].lucky_charm > 0) {
      inventory[senderID].lucky_charm--;
      bonusChance = 0.15;
      usedCharm = true;
    }

    balance[senderID] -= bet;

    const reels = spin();
    const match = getMatchCount(reels);

    let msg =
      "╔════════════════════╗\n" +
      "🎰 SLOT MACHINE 🎰\n" +
      "╚════════════════════╝\n\n" +
      `${reels.join(" | ")}\n\n`;

    if (match === 3) {
      const win = bet * 3;
      balance[senderID] += win;

      msg +=
        "🏆 JACKPOT WIN!\n" +
        "🔥 3 MATCH SYMBOLS 🔥\n\n" +
        `💰 +₱${win.toLocaleString()}`;
    }
    else if (match === 2 && Math.random() < 0.75 + bonusChance) {
      const win = Math.floor(bet * 1.5);
      balance[senderID] += win;

      msg +=
        "✨ SMALL WIN ✨\n" +
        "🎉 2 MATCH SYMBOLS\n\n" +
        `💰 +₱${win.toLocaleString()}`;
    }
    else {
      msg +=
        "💀 YOU LOST\n\n" +
        `💸 -₱${bet.toLocaleString()}\n` +
        "Try again 🍀";
    }

    if (usedCharm) {
      msg += "\n\n🍀 Lucky Charm was used";
    }

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

    api.sendMessage(msg, threadID);
  }
};