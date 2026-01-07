const fs = require("fs");
const path = require("path");

const INV_PATH = path.join(__dirname, "../../data/inventory.json");

if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");

module.exports = {
  config: {
    name: "inv",
    aliases: ["inventory"],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));

    const inv = inventory[senderID];
    if (!inv || Object.keys(inv).length === 0) {
      return api.sendMessage("🎒 Inventory is empty.", threadID);
    }

    let msg =
      "╔════════════════════╗\n" +
      "🎒 YOUR INVENTORY\n" +
      "╚════════════════════╝\n\n";

    if (inv.pickaxe) {
      const hp = typeof inv.pickaxe.hp === "number" ? inv.pickaxe.hp : 300;
      msg += `⛏️ Pickaxe\n🔧 HP: ${hp}/300\n\n`;
    }

    if (inv.lucky_charm) {
      msg += `🍀 Lucky Charm\n🆔 lucky_charm\n📦 ${inv.lucky_charm}\n\n`;
    }

    if (inv.lotto_ticket) {
      msg += `🎟️ Lotto Ticket\n🆔 lotto_ticket\n📦 ${inv.lotto_ticket}\n\n`;
    }

    api.sendMessage(msg.trim(), threadID);
  }
};