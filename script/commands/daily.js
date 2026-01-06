const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
const DAILY_REWARD = 5000;

/* ================= ENSURE FILES ================= */
if (!fs.existsSync(USERS_PATH)) {
  fs.writeFileSync(USERS_PATH, JSON.stringify({}, null, 2));
}
if (!fs.existsSync(BAL_PATH)) {
  fs.writeFileSync(BAL_PATH, JSON.stringify({}, null, 2));
}

module.exports = {
  config: {
    name: "daily",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH, "utf8"));

    /* ================= REGISTER CHECK ================= */
    if (!users[senderID]) {
      return api.sendMessage(
        "╔════════════════════╗\n" +
        "📝 REGISTRATION REQUIRED\n" +
        "╚════════════════════╝\n\n" +
        "You must register first.\n\n" +
        "➤ Use: register",
        threadID
      );
    }

    balance[senderID] ??= 0;

    const now = Date.now();
    const lastClaim = users[senderID].lastDaily || 0;

    /* ================= COOLDOWN CHECK ================= */
    if (now - lastClaim < COOLDOWN) {
      const remaining = COOLDOWN - (now - lastClaim);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining / (1000 * 60)) % 60);

      return api.sendMessage(
        "╔════════════════════╗\n" +
        "⏳ DAILY COOLDOWN\n" +
        "╚════════════════════╝\n\n" +
        "You already claimed your daily reward.\n\n" +
        `⏰ Come back in: ${hours}h ${minutes}m`,
        threadID
      );
    }

    /* ================= GIVE REWARD ================= */
    balance[senderID] += DAILY_REWARD;
    users[senderID].lastDaily = now;

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    api.sendMessage(
      "╔════════════════════╗\n" +
      "🎁 DAILY REWARD CLAIMED\n" +
      "╚════════════════════╝\n\n" +
      `💰 You received: ₱${DAILY_REWARD.toLocaleString()}\n\n` +
      "🔥 Come back tomorrow for more!",
      threadID
    );
  }
};