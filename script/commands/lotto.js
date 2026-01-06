const fs = require("fs");
const path = require("path");

const LOTTO_PATH = path.join(__dirname, "../../data/lotto.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const USERS_PATH = path.join(__dirname, "../../data/users.json");
const ADMIN_UID = "61562953390569";

/* ===== ensure files exist ===== */
if (!fs.existsSync(LOTTO_PATH)) {
  fs.writeFileSync(
    LOTTO_PATH,
    JSON.stringify({ players: {}, isOpen: true }, null, 2)
  );
}

if (!fs.existsSync(INV_PATH)) {
  fs.writeFileSync(INV_PATH, JSON.stringify({}, null, 2));
}

if (!fs.existsSync(USERS_PATH)) {
  fs.writeFileSync(USERS_PATH, JSON.stringify({}, null, 2));
}

/* ===== helpers ===== */
function randomNumbers() {
  const set = new Set();
  while (set.size < 4) {
    set.add(Math.floor(Math.random() * 70) + 1);
  }
  return [...set].sort((a, b) => a - b);
}

module.exports = {
  config: {
    name: "lotto",
    aliases: [],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    /* ================= REGISTER CHECK ================= */
    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register",
        threadID
      );
    }
    /* ================================================== */

    const lotto = JSON.parse(fs.readFileSync(LOTTO_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));

    /* ================= ADMIN SPIN ================= */
    if (args[0] === "spin") {
      if (senderID !== ADMIN_UID)
        return api.sendMessage(
          "⛔ Only the Game Master can spin lotto.",
          threadID
        );

      const winNums = randomNumbers();
      const winners = [];

      for (const uid in lotto.players) {
        if (lotto.players[uid].every(n => winNums.includes(n)))
          winners.push(uid);
      }

      let msg =
        "╔════════════════════╗\n" +
        "🎰 LOTTO RESULTS 🎰\n" +
        "╚════════════════════╝\n\n" +
        "🎯 Winning Numbers:\n" +
        `➤ ${winNums.join(" • ")}\n\n`;

      if (winners.length) {
        msg += "🏆 WINNERS 🏆\n";
        winners.forEach(u => (msg += `• ${u}\n`));
      } else {
        msg += "💀 No winners this round\n🍀 Try again next time!";
      }

      msg += "\n━━━━━━━━━━━━━━━━━━\n🎟️ Lotto is OPEN again";

      api.getThreadList(100, null, ["INBOX"], (err, list) => {
        if (!err) list.forEach(t => api.sendMessage(msg, t.threadID));
      });

      lotto.players = {};
      fs.writeFileSync(LOTTO_PATH, JSON.stringify(lotto, null, 2));
      return;
    }

    /* ================= USER ENTRY ================= */
    if (args.length < 4) {
      return api.sendMessage(
        "🎟️ LOTTO ENTRY\n\n" +
          "Requires: 🎫 1 Lotto Ticket\n\n" +
          "Pick 4 numbers (1–70)\n" +
          "Example:\nlotto 17 42 52 66",
        threadID
      );
    }

    if (!inventory[senderID] || inventory[senderID].lotto_ticket < 1) {
      return api.sendMessage(
        "❌ NO LOTTO TICKET\n\n" +
          "Buy 🎫 Lotto Ticket from the shop first.",
        threadID
      );
    }

    const picks = args
      .map(n => parseInt(n))
      .filter(n => n >= 1 && n <= 70);

    if (picks.length !== 4 || new Set(picks).size !== 4) {
      return api.sendMessage(
        "❌ Invalid numbers\n\nChoose 4 UNIQUE numbers (1–70)",
        threadID
      );
    }

    // deduct ticket
    inventory[senderID].lotto_ticket -= 1;
    lotto.players[senderID] = picks.sort((a, b) => a - b);

    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
    fs.writeFileSync(LOTTO_PATH, JSON.stringify(lotto, null, 2));

    api.sendMessage(
      "✅ LOTTO ENTRY CONFIRMED\n\n" +
        "🎯 Numbers:\n" +
        `➤ ${picks.join(" • ")}\n\n` +
        "🎫 Ticket used: 1\n🍀 Good luck!",
      threadID
    );
  }
};