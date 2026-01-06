const { sleep } = require("../../utils/animate");
const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");

module.exports = {
  config: {
    name: "mine",
    cooldown: 8,
    hasPrefix: false
  },

  async run({ api, event }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const inv = JSON.parse(fs.readFileSync(INV_PATH));

    if (!users[senderID]) {
      return api.sendMessage("📝 You must register first.", threadID);
    }

    if (!inv[senderID]?.pickaxe) {
      return api.sendMessage("⛏️ You need a pickaxe to mine.", threadID);
    }

    const msgID = await api.sendMessage("⛏️ Mining.", threadID);

    await sleep(700);
    api.editMessage("⛏️ Mining..", msgID);

    await sleep(700);
    api.editMessage("⛏️ Mining...", msgID);

    await sleep(700);

    const reward = Math.floor(Math.random() * 200) + 100;
    balance[senderID] = (balance[senderID] || 0) + reward;

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

    api.editMessage(
      `⛏️ MINING COMPLETE\n💎 You earned ₱${reward}`,
      msgID
    );
  }
};