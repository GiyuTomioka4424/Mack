const fs = require("fs");
const path = require("path");

const USERS = path.join(__dirname, "../../data/users.json");
const BAL = path.join(__dirname, "../../data/balance.json");
const SABONG = path.join(__dirname, "../../data/sabong.json");

const ADMIN_UID = "61562953390569";
const BET_TIME = 2 * 60 * 1000;

if (!fs.existsSync(USERS)) fs.writeFileSync(USERS, "{}");
if (!fs.existsSync(BAL)) fs.writeFileSync(BAL, "{}");
if (!fs.existsSync(SABONG))
  fs.writeFileSync(SABONG, JSON.stringify({ open:false, bets:{}, endsAt:0 }, null, 2));

module.exports = {
  config: {
    name: "sabong",
    cooldown: 0,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS));
    const balance = JSON.parse(fs.readFileSync(BAL));
    const game = JSON.parse(fs.readFileSync(SABONG));

    balance[senderID] ??= 0;

    /* START */
    if (args[0] === "start" && senderID === ADMIN_UID) {
      if (game.open) return api.sendMessage("🐓 Sabong already open.", threadID);

      game.open = true;
      game.bets = {};
      game.endsAt = Date.now() + BET_TIME;

      fs.writeFileSync(SABONG, JSON.stringify(game, null, 2));

      return api.sendMessage(
        "🐓 SABONG OPEN!\n\nBet using:\nsabong <amount> pula / puti\n⏱ 2 minutes",
        threadID
      );
    }

    /* STATUS */
    if (args[0] === "status") {
      return api.sendMessage(
        game.open ? "🐓 Sabong OPEN" : "❌ Sabong CLOSED",
        threadID
      );
    }

    /* ADMIN SPIN */
    if (args[0] === "spin" && senderID === ADMIN_UID) {
      if (!game.open) return api.sendMessage("❌ Sabong closed.", threadID);

      const winSide = Math.random() < 0.5 ? "pula" : "puti";
      let msg = `🐓 SABONG RESULT\n\n🏆 Winner: ${winSide.toUpperCase()}\n\n`;

      for (const uid in game.bets) {
        const bet = game.bets[uid];
        if (bet.side === winSide) {
          balance[uid] += bet.amount * 2;
          msg += `🎉 ${users[uid]?.name || uid}\n`;
        }
      }

      game.open = false;
      game.bets = {};

      fs.writeFileSync(BAL, JSON.stringify(balance, null, 2));
      fs.writeFileSync(SABONG, JSON.stringify(game, null, 2));

      return api.sendMessage(msg || "No winners.", threadID);
    }

    /* PLAYER BET */
    if (!game.open) return api.sendMessage("❌ Sabong closed.", threadID);
    if (!users[senderID]) return api.sendMessage("📝 Register first.", threadID);

    const amount = parseInt(args[0]);
    const side = args[1]?.toLowerCase();

    if (!amount || !["pula","puti"].includes(side)) {
      return api.sendMessage("Usage:\nsabong <amount> pula/puti", threadID);
    }

    if (balance[senderID] < amount) {
      return api.sendMessage("❌ Not enough balance.", threadID);
    }

    balance[senderID] -= amount;
    game.bets[senderID] = { amount, side };

    fs.writeFileSync(BAL, JSON.stringify(balance, null, 2));
    fs.writeFileSync(SABONG, JSON.stringify(game, null, 2));

    api.sendMessage(
      `✅ BET ACCEPTED\n🐓 Side: ${side}\n💰 Amount: ₱${amount}`,
      threadID
    );
  }
};