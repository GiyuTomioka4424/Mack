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

    /* INIT */
    balance[senderID] = Number(balance[senderID]) || 0;
    inventory[senderID] = inventory[senderID] || {};
    bank[senderID] = bank[senderID] || { loan: 0 };
    users[senderID].loseStreak = users[senderID].loseStreak || 0;

    /* 🚫 LOAN CHECK */
    if (bank[senderID].loan > 0) {
      return api.sendMessage(
        "🚫 SLOT LOCKED\n\n" +
        "You have an active loan.\nPay it first before playing slot.",
        threadID
      );
    }

    const bet = parseInt(args[0]);
    if (!bet || bet <= 0) {
      return api.sendMessage(
        "🎰 SLOT MACHINE 🎰\n\nUsage:\nslot <bet>",
        threadID
      );
    }

    if (balance[senderID] < bet) {
      return api.sendMessage(
        `❌ Not enough balance.\n💰 Balance: ₱${balance[senderID].toLocaleString()}`,
        threadID
      );
    }

    /* ================= WIN LOGIC ================= */

    let baseChance = 0.25;
    let charmBonus = 0;
    let usedCharm = false;

    // 🔥 Lose streak protection
    if (users[senderID].loseStreak >= 3) {
      baseChance = 0.6;
    }

    // 🍀 Lucky Charm (only used if win)
    if (inventory[senderID].lucky_charm > 0) {
      charmBonus = 0.2;
    }

    const reels = spin();
    const win =
      Math.random() < (baseChance + charmBonus) ||
      isWin(reels);

    /* ================= APPLY RESULT ================= */

    let msg =
      "╔════════════════════╗\n" +
      "🎰 SLOT RESULT 🎰\n" +
      "╚════════════════════╝\n\n" +
      `${reels.join(" | ")}\n\n`;

    balance[senderID] -= bet;

    if (win) {
      const reward = bet * 2;
      balance[senderID] += reward;
      users[senderID].loseStreak = 0;

      if (inventory[senderID].lucky_charm > 0) {
        inventory[senderID].lucky_charm -= 1;
        usedCharm = true;
      }

      msg +=
        "🎉 YOU WON!\n\n" +
        `💰 Prize: ₱${reward.toLocaleString()}`;
    } else {
      users[senderID].loseStreak += 1;
      msg +=
        `💀 You lost ₱${bet.toLocaleString()}\n` +
        `🔥 Lose streak: ${users[senderID].loseStreak}`;
    }

    if (usedCharm) {
      msg += "\n\n🍀 Lucky Charm activated!";
    }

    /* SAVE */
    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    api.sendMessage(msg, threadID);
  }
};