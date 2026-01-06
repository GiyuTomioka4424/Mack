const { sleep } = require("../../utils/animate");
const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

module.exports = {
  config: {
    name: "slot",
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));

    if (!users[senderID]) {
      return api.sendMessage("📝 You must register first.", threadID);
    }

    const bet = parseInt(args[0]);
    if (!bet || bet <= 0) {
      return api.sendMessage("🎰 Usage: slot <bet>", threadID);
    }

    if ((balance[senderID] || 0) < bet) {
      return api.sendMessage("❌ Not enough balance.", threadID);
    }

    balance[senderID] -= bet;
    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

    const msgID = await api.sendMessage("🎰 Spinning.", threadID);

    await sleep(800);
    api.editMessage("🎰 Spinning..", msgID);

    await sleep(800);
    api.editMessage("🎰 Spinning...", msgID);

    await sleep(800);

    const win = Math.random() < 0.45;
    let result;

    if (win) {
      const prize = bet * 2;
      balance[senderID] += prize;
      result = `🎉 YOU WIN!\n💰 +₱${prize}`;
    } else {
      result = `💀 YOU LOSE!\n💸 -₱${bet}`;
    }

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

    api.editMessage(
      `🎰 SLOT RESULT\n━━━━━━━━━━━━\n${result}\n━━━━━━━━━━━━`,
      msgID
    );
  }
};