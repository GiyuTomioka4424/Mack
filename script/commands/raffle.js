const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const RAFFLE_PATH = path.join(__dirname, "../../data/raffle.json");

const ADMIN_UID = "61562953390569";
const CASH_REWARD = 20000;
const MYSTERY_ITEMS = ["lucky_charm", "pickaxe", "lotto_ticket"];

/* ================= INIT FILE ================= */
if (!fs.existsSync(RAFFLE_PATH)) {
  fs.writeFileSync(
    RAFFLE_PATH,
    JSON.stringify({ open: false, players: [] }, null, 2)
  );
}

module.exports = {
  config: {
    name: "raffle",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { senderID, threadID } = event;

    const raffle = JSON.parse(fs.readFileSync(RAFFLE_PATH, "utf8"));
    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    const inventory = fs.existsSync(INV_PATH)
      ? JSON.parse(fs.readFileSync(INV_PATH, "utf8"))
      : {};

    /* ================= RAFFLE JOIN (FREE) ================= */
    if (args[0] === "join") {
      if (!users[senderID]) {
        return api.sendMessage(
          "📝 You must register first.\nUse: register",
          threadID
        );
      }

      if (!raffle.open) {
        return api.sendMessage(
          "❌ Raffle is currently CLOSED.\nWait for admin to start it.",
          threadID
        );
      }

      if (raffle.players.includes(senderID)) {
        return api.sendMessage(
          "⚠️ You already joined the raffle.",
          threadID
        );
      }

      raffle.players.push(senderID);
      fs.writeFileSync(RAFFLE_PATH, JSON.stringify(raffle, null, 2));

      return api.sendMessage(
        "╔════════════════════╗\n" +
        "🎟️ RAFFLE JOINED\n" +
        "╚════════════════════╝\n\n" +
        "✅ You are now included in the raffle!\n\n" +
        "🍀 Good luck!",
        threadID
      );
    }

    /* ================= ADMIN ONLY BELOW ================= */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ Only the admin can manage the raffle.",
        threadID
      );
    }

    /* ================= START RAFFLE ================= */
    if (args[0] === "start") {
      if (raffle.open) {
        return api.sendMessage(
          "⚠️ Raffle is already OPEN.\nUse: raffle spin",
          threadID
        );
      }

      raffle.open = true;
      raffle.players = [];

      fs.writeFileSync(RAFFLE_PATH, JSON.stringify(raffle, null, 2));

      return announceAll(
        api,
        "╔════════════════════╗\n" +
        "🎟️ RAFFLE OPENED\n" +
        "╚════════════════════╝\n\n" +
        "🔥 The raffle is now OPEN!\n\n" +
        "🎁 Prizes:\n" +
        "• 💰 20,000 coins (2 winners)\n" +
        "• 🎁 Mystery item (2 winners)\n\n" +
        "📌 Join now using:\n" +
        "raffle join"
      );
    }

    /* ================= SPIN RAFFLE ================= */
    if (args[0] === "spin") {
      if (!raffle.open) {
        return api.sendMessage(
          "❌ Raffle is CLOSED.\nUse: raffle start",
          threadID
        );
      }

      if (raffle.players.length < 4) {
        return api.sendMessage(
          "❌ Not enough players.\nMinimum: 4",
          threadID
        );
      }

      shuffle(raffle.players);
      const winners = raffle.players.slice(0, 4);

      /* ===== CASH WINNERS ===== */
      for (let i = 0; i < 2; i++) {
        const uid = winners[i];
        if (!users[uid]) continue;
        users[uid].money = (users[uid].money || 0) + CASH_REWARD;
      }

      /* ===== MYSTERY WINNERS ===== */
      for (let i = 2; i < 4; i++) {
        const uid = winners[i];
        if (!inventory[uid]) inventory[uid] = {};
        const item = random(MYSTERY_ITEMS);
        inventory[uid][item] = (inventory[uid][item] || 0) + 1;
      }

      /* ================= AUTO CLOSE ================= */
      raffle.open = false;
      raffle.players = [];

      fs.writeFileSync(RAFFLE_PATH, JSON.stringify(raffle, null, 2));
      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

      return announceAll(
        api,
        "╔════════════════════╗\n" +
        "🎉 RAFFLE RESULTS 🎉\n" +
        "╚════════════════════╝\n\n" +
        "💰 CASH WINNERS (20,000):\n" +
        `• ${winners[0]}\n• ${winners[1]}\n\n` +
        "🎁 MYSTERY GIFT WINNERS:\n" +
        `• ${winners[2]}\n• ${winners[3]}\n\n` +
        "🔒 Raffle is now CLOSED.\n" +
        "📌 Admin must use raffle start again."
      );
    }

    /* ================= HELP ================= */
    api.sendMessage(
      "Usage:\n" +
      "raffle start\n" +
      "raffle join\n" +
      "raffle spin",
      threadID
    );
  }
};

/* ================= HELPERS ================= */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function announceAll(api, message) {
  api.getThreadList(100, null, ["INBOX"], (err, list) => {
    if (err) return;
    list.forEach(t => api.sendMessage(message, t.threadID));
  });
}