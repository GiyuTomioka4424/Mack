const fs = require("fs");
const path = require("path");

const USERS = path.join(__dirname, "../../data/users.json");
const BAL = path.join(__dirname, "../../data/balance.json");
const INV = path.join(__dirname, "../../data/inventory.json");

[USERS, BAL, INV].forEach(p => {
  if (!fs.existsSync(p)) fs.writeFileSync(p, "{}");
});

module.exports = {
  config: {
    name: "mine",
    aliases: [],
    cooldown: 10,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS));
    const bal = JSON.parse(fs.readFileSync(BAL));
    const inv = JSON.parse(fs.readFileSync(INV));

    if (!users[senderID])
      return api.sendMessage("📝 Register first.", threadID);

    inv[senderID] ??= {};
    bal[senderID] ??= 0;

    if (!inv[senderID].pickaxe)
      return api.sendMessage("⛏️ You need a Pickaxe to mine.", threadID);

    const reward = Math.floor(Math.random() * 500) + 300;
    bal[senderID] += reward;

    // consume pickaxe durability
    inv[senderID].pickaxe--;
    if (inv[senderID].pickaxe <= 0)
      delete inv[senderID].pickaxe;

    fs.writeFileSync(BAL, JSON.stringify(bal, null, 2));
    fs.writeFileSync(INV, JSON.stringify(inv, null, 2));

    api.sendMessage(
      `⛏️ MINING SUCCESS\n💰 +₱${reward}\n🧰 Pickaxe left: ${inv[senderID].pickaxe || 0}`,
      threadID
    );
  }
};