const fs = require("fs");
const path = require("path");

const USERS = path.join(__dirname, "../../data/users.json");
const BAL = path.join(__dirname, "../../data/balance.json");
const INV = path.join(__dirname, "../../data/inventory.json");

if (!fs.existsSync(USERS)) fs.writeFileSync(USERS, "{}");
if (!fs.existsSync(BAL)) fs.writeFileSync(BAL, "{}");
if (!fs.existsSync(INV)) fs.writeFileSync(INV, "{}");

module.exports = {
  config: {
    name: "mine",
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS));
    const balance = JSON.parse(fs.readFileSync(BAL));
    const inventory = JSON.parse(fs.readFileSync(INV));

    /* REGISTER */
    if (!users[senderID]) {
      return api.sendMessage("📝 Register first.", threadID);
    }

    /* PICKAXE CHECK */
    const pickaxe = inventory[senderID]?.pickaxe;
    if (!pickaxe || pickaxe.hp <= 0) {
      return api.sendMessage(
        "⛏️ NO PICKAXE\n\nBuy one from the shop first.",
        threadID
      );
    }

    /* MINING LOGIC */
    const durabilityUsed = Math.floor(Math.random() * 5) + 1; // 1–5
    const reward = Math.floor(Math.random() * 500) + 300; // ₱300–800

    pickaxe.hp -= durabilityUsed;
    balance[senderID] = (balance[senderID] || 0) + reward;

    let msg =
      "╔════════════════════╗\n" +
      "⛏️ MINING RESULT\n" +
      "╚════════════════════╝\n\n" +
      `💰 You earned: ₱${reward}\n` +
      `🪓 Pickaxe durability used: ${durabilityUsed}\n` +
      `🔧 Remaining HP: ${Math.max(pickaxe.hp, 0)}\n`;

    if (pickaxe.hp <= 0) {
      delete inventory[senderID].pickaxe;
      msg += "\n💥 Your pickaxe BROKE!";
    }

    fs.writeFileSync(BAL, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV, JSON.stringify(inventory, null, 2));

    api.sendMessage(msg, threadID);
  }
};