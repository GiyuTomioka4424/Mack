const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BANK_PATH = path.join(__dirname, "../../data/bank.json");
const SLOT_CD = path.join(__dirname, "../../data/slotCooldown.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");
if (!fs.existsSync(BANK_PATH)) fs.writeFileSync(BANK_PATH, "{}");
if (!fs.existsSync(SLOT_CD)) fs.writeFileSync(SLOT_CD, "{}");

const SYMBOLS = ["🍒", "🍋", "🍉", "⭐", "💎"];
const COOLDOWN = 5000; // 5 seconds anti-spam

function spin() {
  return [
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  ];
}

module.exports = {
  config: {
    name: "slot",
    cooldown: 0,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));
    const bank = JSON.parse(fs.readFileSync(BANK_PATH));
    const cd = JSON.parse(fs.readFileSync(SLOT_CD));

    /* REGISTER */
    if (!users[senderID]) {
      return api.sendMessage("📝 Register first using:\nregister <name>", threadID);
    }

    /* LOAN BLOCK */
    if ((bank[senderID]?.loan || 0) > 0) {
      return api.sendMessage(
        "🚫 SLOT LOCKED\nPay your loan first.",
        threadID
      );
    }

    /* ANTI SPAM */
    const now = Date.now();
    if (cd[senderID] && now - cd[senderID] < COOLDOWN) {
      return api.sendMessage("⏳ Slow down! Wait a few seconds.", threadID);
    }
    cd[senderID] = now;

    const bet = parseInt(args[0]);
    if (!bet || bet <= 0) {
      return api.sendMessage("🎰 Usage:\nslot <bet>", threadID);
    }

    balance[senderID] ??= 0;
    inventory[senderID] ??= {};

    if (balance[senderID] < bet) {
      return api.sendMessage("❌ Not enough balance.", threadID);
    }

    let winChance = 0.25;
    let usedCharm = false;

    if (inventory[senderID].lucky_charm > 0) {
      winChance = 0.45;
      inventory[senderID].lucky_charm -= 1;
      usedCharm = true;
    }

    balance[senderID] -= bet;
    const reels = spin();
    const win = Math.random() < winChance;

    let msg =
      "╔════════════════════╗\n" +
      "🎰 SLOT RESULT 🎰\n" +
      "╚════════════════════╝\n\n" +
      `${reels.join(" | ")}\n\n`;

    if (win) {
      const reward = bet * 3;
      balance[senderID] += reward;
      msg += `🎉 YOU WON!\n💰 Prize: ₱${reward.toLocaleString()}`;
    } else {
      msg += "💀 You lost this round.";
    }

    if (usedCharm) msg += "\n🍀 Lucky Charm used";

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
    fs.writeFileSync(SLOT_CD, JSON.stringify(cd, null, 2));

    api.sendMessage(msg, threadID);
  }
};