const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const BANK_PATH = path.join(__dirname, "../../data/bank.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(BANK_PATH)) fs.writeFileSync(BANK_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");

const symbols = ["🍒", "🍋", "🍉", "🍇", "⭐", "💎"];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function rand() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

module.exports = {
  config: {
    name: "slot",
    aliases: ["slots"],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { senderID, threadID } = event;

    /* ✅ REGISTER CHECK */
    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register",
        threadID
      );
    }

    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const bank = JSON.parse(fs.readFileSync(BANK_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));

    balance[senderID] ??= 0;
    bank[senderID] ??= { balance: 0, loan: 0 };
    inventory[senderID] ??= {};

    /* ❌ BLOCK IF HAS LOAN */
    if (bank[senderID].loan > 0) {
      return api.sendMessage(
        "⛔ SLOT LOCKED\n\n" +
        "You have an active loan.\n" +
        "📌 Pay your loan first.",
        threadID
      );
    }

    /* 💰 BET */
    const bet = parseInt(args[0]);
    if (!bet || bet <= 0) {
      return api.sendMessage(
        "🎰 SLOT MACHINE\n\nUsage:\nslot <amount>\n\nExample:\nslot 1000",
        threadID
      );
    }

    if (bet < 100) {
      return api.sendMessage(
        "❌ MINIMUM BET\n\nMinimum bet is ₱100",
        threadID
      );
    }

    if (balance[senderID] < bet) {
      return api.sendMessage(
        "❌ NOT ENOUGH MONEY\n\n" +
        `💰 Balance: ₱${balance[senderID].toLocaleString()}\n` +
        `🎰 Bet: ₱${bet.toLocaleString()}`,
        threadID
      );
    }

    /* 🎀 LUCKY CHARM CHECK */
    let hasCharm = inventory[senderID].lucky_charm > 0;
    let charmUsed = false;

    if (hasCharm) {
      inventory[senderID].lucky_charm -= 1;
      charmUsed = true;
    }

    /* Deduct bet */
    balance[senderID] -= bet;
    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

    /* 🎬 Animation */
    const msg = await api.sendMessage(
      "🎰 SLOT MACHINE 🎰\n\n⬛ ⬛ ⬛\n\nSpinning...",
      threadID
    );

    for (let i = 0; i < 3; i++) {
      await sleep(700);
      api.editMessage(
        "🎰 SLOT MACHINE 🎰\n\n" +
        `${rand()} ${rand()} ${rand()}\n\nSpinning...`,
        msg.messageID
      );
    }

    /* 🎯 RESULT */
    const r1 = rand();
    const r2 = rand();
    const r3 = rand();

    let win = 0;
    let result = "💀 You lost.";

    // 🎀 Lucky Charm boosts chances
    if (r1 === r2 && r2 === r3) {
      win = charmUsed ? bet * 7 : bet * 5;
      result = charmUsed ? "🍀 LUCKY JACKPOT!" : "🎉 JACKPOT!";
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      win = charmUsed ? bet * 3 : bet * 2;
      result = charmUsed ? "🍀 LUCKY WIN!" : "✨ Nice Win!";
    }

    if (win > 0) {
      balance[senderID] += win;
      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    }

    api.editMessage(
      "🎰 SLOT RESULT 🎰\n\n" +
      `${r1} ${r2} ${r3}\n\n` +
      `${result}\n` +
      (charmUsed ? "🍀 Lucky Charm used!\n" : "") +
      (win
        ? `💰 Won: ₱${win.toLocaleString()}`
        : `💸 Lost: ₱${bet.toLocaleString()}`) +
      "\n\n━━━━━━━━━━━━━━\n— Macky Bot V3",
      msg.messageID
    );
  }
};