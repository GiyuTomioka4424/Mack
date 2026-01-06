const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

[USERS_PATH, INV_PATH, BAL_PATH].forEach(p => {
  if (!fs.existsSync(p)) fs.writeFileSync(p, "{}");
});

const delay = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
  config: {
    name: "mine",
    cooldown: 10,
    hasPrefix: false
  },

  async run({ api, event }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const inv = JSON.parse(fs.readFileSync(INV_PATH));
    const bal = JSON.parse(fs.readFileSync(BAL_PATH));

    /* REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register",
        threadID
      );
    }

    inv[senderID] ??= {};
    bal[senderID] ??= 0;

    /* PICKAXE CHECK */
    if (!inv[senderID].pickaxe || inv[senderID].pickaxe < 1) {
      return api.sendMessage(
        "⛏️ You need a Pickaxe.\nBuy one from the shop.",
        threadID
      );
    }

    await api.sendMessage("⛏️ Mining...", threadID);
    await delay(900);

    const reward = Math.floor(Math.random() * 400) + 200;

    inv[senderID].pickaxe--;
    if (inv[senderID].pickaxe <= 0)
      delete inv[senderID].pickaxe;

    bal[senderID] += reward;

    fs.writeFileSync(INV_PATH, JSON.stringify(inv, null, 2));
    fs.writeFileSync(BAL_PATH, JSON.stringify(bal, null, 2));

    api.sendMessage(
      "╔════════════════════╗\n" +
      "⛏️ MINING RESULT ⛏️\n" +
      "╚════════════════════╝\n\n" +
      `💰 You earned: ₱${reward.toLocaleString()}\n` +
      `⛏️ Pickaxe used: 1`,
      threadID
    );
  }
};