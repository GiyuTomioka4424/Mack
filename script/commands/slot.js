const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const BANK_PATH = path.join(__dirname, "../../data/bank.json");

[USERS_PATH, INV_PATH, BAL_PATH, BANK_PATH].forEach(p => {
  if (!fs.existsSync(p)) fs.writeFileSync(p, "{}");
});

const delay = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
  config: {
    name: "slot",
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const inv = JSON.parse(fs.readFileSync(INV_PATH));
    const bal = JSON.parse(fs.readFileSync(BAL_PATH));
    const bank = JSON.parse(fs.readFileSync(BANK_PATH));

    /* ================= REGISTER CHECK ================= */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register",
        threadID
      );
    }

    inv[senderID] ??= {};
    bal[senderID] ??= 0;
    bank[senderID] ??= { loan: 0 };

    /* ================= LOAN BLOCK ================= */
    if (bank[senderID].loan > 0) {
      return api.sendMessage(
        "🚫 SLOT BLOCKED\n\n" +
        "You currently have an unpaid loan.\n" +
        "💳 Pay your loan first before playing slot.",
        threadID
      );
    }

    /* ================= BET CHECK ================= */
    const bet = parseInt(args[0]);
    if (!bet || bet <= 0) {
      return api.sendMessage(
        "🎰 SLOT MACHINE\n\nUsage:\nslot <bet>",
        threadID
      );
    }

    if (bal[senderID] < bet) {
      return api.sendMessage("❌ Not enough balance.", threadID);
    }

    /* ================= LUCKY CHARM ================= */
    const hasCharm = inv[senderID].lucky_charm > 0;
    if (hasCharm) {
      inv[senderID].lucky_charm--;
      if (inv[senderID].lucky_charm <= 0)
        delete inv[senderID].lucky_charm;
    }

    bal[senderID] -= bet;
    fs.writeFileSync(INV_PATH, JSON.stringify(inv, null, 2));
    fs.writeFileSync(BAL_PATH, JSON.stringify(bal, null, 2));

    /* ================= ANIMATION ================= */
    await api.sendMessage("🎰 Spinning...", threadID);
    await delay(900);

    const reels = ["🍒", "🍋", "🍉", "⭐", "💎"];
    const spin = () => reels[Math.floor(Math.random() * reels.length)];
    const result = [spin(), spin(), spin()];

    const winChance = hasCharm ? 0.45 : 0.25;
    const isWin =
      Math.random() < winChance &&
      result[0] === result[1] &&
      result[1] === result[2];

    let msg =
      "╔════════════════════╗\n" +
      "🎰 SLOT RESULT 🎰\n" +
      "╚════════════════════╝\n\n" +
      `${result.join(" | ")}\n\n`;

    if (isWin) {
      const prize = bet * 3;
      bal[senderID] += prize;
      msg +=
        "🎉 YOU WON!\n" +
        `💰 Prize: ₱${prize.toLocaleString()}\n`;
    } else {
      msg += "💀 You lost this round.\n";
    }

    if (hasCharm) {
      msg += "\n🍀 Lucky Charm was used!";
    }

    fs.writeFileSync(BAL_PATH, JSON.stringify(bal, null, 2));
    api.sendMessage(msg, threadID);
  }
};