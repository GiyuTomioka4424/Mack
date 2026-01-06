const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");

const SYMBOLS = ["🍒", "🍋", "🍉", "⭐", "💎"];

module.exports = {
  config: {
    name: "slot",
    aliases: [],
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const uid = event.senderID;
    const threadID = event.threadID;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));

    /* 🔒 REGISTER CHECK */
    if (!users[uid]) {
      return api.sendMessage("📝 You must register first.", threadID);
    }

    balance[uid] ??= 0;
    inventory[uid] ??= {};

    const bet = parseInt(args[0]);

    if (!bet || bet <= 0) {
      return api.sendMessage("🎰 Usage: slot <amount>", threadID);
    }

    if (balance[uid] < bet) {
      return api.sendMessage("❌ Not enough balance.", threadID);
    }

    /* 🍀 LUCKY CHARM LOGIC */
    let winChance = 0.35; // base 35%
    let usedCharm = false;

    if (inventory[uid].lucky_charm > 0) {
      winChance = 0.55; // boosted to 55%
      inventory[uid].lucky_charm -= 1;
      usedCharm = true;
    }

    /* 🎰 ROLL */
    const roll = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const slots = [roll(), roll(), roll()];

    const isWin =
      slots[0] === slots[1] && slots[1] === slots[2]
        ? true
        : Math.random() < winChance;

    let msg =
      "╔════════════════════╗\n" +
      "🎰 SLOT RESULT 🎰\n" +
      "╚════════════════════╝\n\n" +
      `${slots.join(" | ")}\n\n`;

    if (isWin) {
      const winAmount = bet * 2;
      balance[uid] += winAmount;

      msg +=
        `🎉 YOU WON ₱${winAmount.toLocaleString()}!\n` +
        (usedCharm ? "🍀 Lucky Charm activated!\n" : "");
    } else {
      balance[uid] -= bet;
      msg += `💀 You lost ₱${bet.toLocaleString()}\n`;
    }

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

    api.sendMessage(msg, threadID);
  }
};