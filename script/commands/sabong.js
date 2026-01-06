const fs = require("fs");
const path = require("path");

const SABONG_PATH = path.join(__dirname, "../../data/sabong.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const USERS_PATH = path.join(__dirname, "../../data/users.json");

const ADMIN_UID = "61562953390569";
const BET_TIME = 2 * 60 * 1000; // 2 minutes

/* ================= ENSURE FILES ================= */
if (!fs.existsSync(SABONG_PATH)) {
  fs.writeFileSync(SABONG_PATH, JSON.stringify({
    open: false,
    bets: {}
  }, null, 2));
}
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");

/* ⏱️ IN-MEMORY TIMER (DO NOT SAVE TO JSON) */
let sabongTimer = null;

module.exports = {
  config: {
    name: "sabong",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const sabong = JSON.parse(fs.readFileSync(SABONG_PATH));

    balance[senderID] ??= 0;

    /* ================= ADMIN START ================= */
    if (args[0] === "start") {
      if (senderID !== ADMIN_UID)
        return api.sendMessage("⛔ Admin only command.", threadID);

      if (sabong.open)
        return api.sendMessage("🐓 Sabong is already OPEN.", threadID);

      sabong.open = true;
      sabong.bets = {};
      fs.writeFileSync(SABONG_PATH, JSON.stringify(sabong, null, 2));

      const openMsg =
        "╔════════════════════╗\n" +
        "🐓 SABONG IS OPEN 🐓\n" +
        "╚════════════════════╝\n\n" +
        "🔴 PULA  vs  ⚪ PUTI\n\n" +
        "💰 Place your bets now!\n\n" +
        "Usage:\n" +
        "sabong <amount> pula\n" +
        "sabong <amount> puti\n\n" +
        "⏱️ Betting closes in 2 minutes\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "— Macky Bot V3";

      api.getThreadList(100, null, ["INBOX"], (err, list) => {
        if (!err && Array.isArray(list)) {
          list.forEach(t => api.sendMessage(openMsg, t.threadID));
        }
      });

      /* ⏱️ START TIMER */
      sabongTimer = setTimeout(() => {
        const winningSide = Math.random() < 0.5 ? "pula" : "puti";
        const winners = [];

        for (const uid in sabong.bets) {
          const bet = sabong.bets[uid];
          if (bet.side === winningSide) {
            balance[uid] = (balance[uid] || 0) + bet.amount * 2;
            winners.push(users[uid]?.name || uid);
          }
        }

        let resultMsg =
          "╔════════════════════╗\n" +
          "🐓 SABONG RESULT 🐓\n" +
          "╚════════════════════╝\n\n" +
          `🏆 WINNING SIDE:\n${winningSide === "pula" ? "🔴 PULA 🔴" : "⚪ PUTI ⚪"}\n\n`;

        if (winners.length) {
          resultMsg += "🎉 WINNERS 🎉\n";
          winners.forEach(name => resultMsg += `• ${name}\n`);
        } else {
          resultMsg += "💀 No winners this round.";
        }

        resultMsg += "\n━━━━━━━━━━━━━━━━━━\n🐓 Sabong CLOSED";

        api.getThreadList(100, null, ["INBOX"], (err, list) => {
          if (!err && Array.isArray(list)) {
            list.forEach(t => api.sendMessage(resultMsg, t.threadID));
          }
        });

        sabong.open = false;
        sabong.bets = {};
        sabongTimer = null;

        fs.writeFileSync(SABONG_PATH, JSON.stringify(sabong, null, 2));
        fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
      }, BET_TIME);

      return;
    }

    /* ================= ADMIN RESET ================= */
    if (args[0] === "reset") {
      if (senderID !== ADMIN_UID)
        return api.sendMessage("⛔ Admin only command.", threadID);

      for (const uid in sabong.bets) {
        balance[uid] = (balance[uid] || 0) + sabong.bets[uid].amount;
      }

      if (sabongTimer) clearTimeout(sabongTimer);
      sabongTimer = null;

      sabong.open = false;
      sabong.bets = {};

      fs.writeFileSync(SABONG_PATH, JSON.stringify(sabong, null, 2));
      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

      return api.sendMessage("♻️ Sabong reset. Bets refunded.", threadID);
    }

    /* ================= STATUS ================= */
    if (args[0] === "status") {
      return api.sendMessage(
        sabong.open ? "🐓 Sabong is OPEN." : "❌ Sabong is CLOSED.",
        threadID
      );
    }

    /* ================= PLAYER BET ================= */
    if (!sabong.open)
      return api.sendMessage("❌ Sabong is not open.", threadID);

    if (!users[senderID]) {
      return api.sendMessage("📝 You must register first.", threadID);
    }

    if (sabong.bets[senderID]) {
      return api.sendMessage("⚠️ You already placed a bet.", threadID);
    }

    const amount = parseInt(args[0]);
    const side = args[1]?.toLowerCase();

    if (!amount || amount <= 0 || !["pula", "puti"].includes(side)) {
      return api.sendMessage(
        "Usage:\nsabong <amount> pula\nsabong <amount> puti",
        threadID
      );
    }

    if (balance[senderID] < amount)
      return api.sendMessage("❌ Not enough balance.", threadID);

    balance[senderID] -= amount;
    sabong.bets[senderID] = { amount, side };

    fs.writeFileSync(SABONG_PATH, JSON.stringify(sabong, null, 2));
    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

    api.sendMessage(
      `✅ Bet placed!\n🐓 Side: ${side}\n💰 Amount: ₱${amount}`,
      threadID
    );
  }
};