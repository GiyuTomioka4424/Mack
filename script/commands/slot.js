const fs = require("fs");
const path = require("path");

const USERS = path.join(__dirname, "../../data/users.json");
const BAL = path.join(__dirname, "../../data/balance.json");
const INV = path.join(__dirname, "../../data/inventory.json");
const LOAN = path.join(__dirname, "../../data/loan.json");
const SLOT = path.join(__dirname, "../../data/slot.json");

[USERS, BAL, INV, LOAN, SLOT].forEach(p => {
  if (!fs.existsSync(p)) fs.writeFileSync(p, "{}");
});

const SYMBOLS = ["🍒", "🍋", "🍉", "⭐", "💎"];

module.exports = {
  config: {
    name: "slot",
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS));
    const bal = JSON.parse(fs.readFileSync(BAL));
    const inv = JSON.parse(fs.readFileSync(INV));
    const loan = JSON.parse(fs.readFileSync(LOAN));
    const slotData = JSON.parse(fs.readFileSync(SLOT));

    if (!users[senderID])
      return api.sendMessage("📝 You must register first.", threadID);

    if ((loan[senderID] || 0) > 0)
      return api.sendMessage("❌ You cannot use slot while you have a loan.", threadID);

    const bet = parseInt(args[0]) || 100;
    if (bet <= 0) return api.sendMessage("❌ Invalid bet.", threadID);

    bal[senderID] ??= 0;
    inv[senderID] ??= {};
    slotData[senderID] ??= { loseStreak: 0 };

    if (bal[senderID] < bet)
      return api.sendMessage("❌ Not enough balance.", threadID);

    // 🎯 BASE WIN RATE
    let winChance = 0.25;

    // 🔁 LOSE STREAK PROTECTION
    if (slotData[senderID].loseStreak >= 3) {
      winChance += 0.3; // guaranteed comeback
    }

    // 🍀 Lucky Charm
    if (inv[senderID].lucky_charm > 0) {
      winChance += 0.25;
      inv[senderID].lucky_charm--;
      if (inv[senderID].lucky_charm <= 0)
        delete inv[senderID].lucky_charm;
    }

    // 🎰 SPIN
    const spin = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ];

    const isWin =
      spin[0] === spin[1] && spin[1] === spin[2] ||
      Math.random() < winChance;

    bal[senderID] -= bet;

    let resultMsg =
      "╔════════════════════╗\n" +
      "🎰 SLOT RESULT 🎰\n" +
      "╚════════════════════╝\n\n" +
      `${spin[0]} | ${spin[1]} | ${spin[2]}\n\n`;

    if (isWin) {
      const reward = bet * 2;
      bal[senderID] += reward;
      slotData[senderID].loseStreak = 0;

      resultMsg +=
        `🎉 YOU WIN!\n` +
        `💰 +₱${reward.toLocaleString()}`;
    } else {
      slotData[senderID].loseStreak++;
      resultMsg +=
        `💀 You lost ₱${bet.toLocaleString()}\n` +
        `🔥 Lose streak: ${slotData[senderID].loseStreak}`;
    }

    fs.writeFileSync(BAL, JSON.stringify(bal, null, 2));
    fs.writeFileSync(INV, JSON.stringify(inv, null, 2));
    fs.writeFileSync(SLOT, JSON.stringify(slotData, null, 2));

    api.sendMessage(resultMsg, threadID);
  }
};