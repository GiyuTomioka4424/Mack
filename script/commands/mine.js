const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");

const cooldown = new Map();
const COOLDOWN = 10 * 1000;

module.exports = {
  config: {
    name: "mine",
    aliases: [],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    /* ⏱️ ANTI SPAM */
    const now = Date.now();
    if (cooldown.has(senderID) && now - cooldown.get(senderID) < COOLDOWN) {
      return api.sendMessage("⏳ Please wait before mining again.", threadID);
    }
    cooldown.set(senderID, now);

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));

    if (!users[senderID]) {
      return api.sendMessage("📝 Register first using: register <name>", threadID);
    }

    balance[senderID] ??= 0;
    inventory[senderID] ??= {};

    /* 🔁 AUTO FIX OLD PICKAXE FORMAT */
    if (
      inventory[senderID].pickaxe &&
      typeof inventory[senderID].pickaxe === "number"
    ) {
      inventory[senderID].pickaxe = { hp: 300 };
    }

    const pickaxe = inventory[senderID].pickaxe;

    if (!pickaxe || typeof pickaxe.hp !== "number") {
      return api.sendMessage(
        "⛏️ NO PICKAXE\n\nBuy one from shop:\nshop buy pickaxe 1",
        threadID
      );
    }

    /* 🍀 LUCKY CHARM */
    let min = 200, max = 500;
    let usedCharm = false;

    if (inventory[senderID].lucky_charm > 0) {
      min = 400;
      max = 900;
      inventory[senderID].lucky_charm--;
      usedCharm = true;
    }

    const earned = Math.floor(Math.random() * (max - min + 1)) + min;
    const hpUsed = Math.floor(Math.random() * 4) + 1;

    balance[senderID] += earned;
    pickaxe.hp -= hpUsed;

    let msg =
      "╔════════════════════╗\n" +
      "⛏️ MINING RESULT\n" +
      "╚════════════════════╝\n\n" +
      `💰 You earned: ₱${earned}\n` +
      `🪓 Pickaxe HP used: ${hpUsed}\n` +
      `🔧 Remaining HP: ${Math.max(pickaxe.hp, 0)}\n`;

    if (usedCharm) msg += "\n🍀 Lucky Charm activated!";

    if (pickaxe.hp <= 0) {
      delete inventory[senderID].pickaxe;
      msg += "\n\n💥 Your pickaxe broke!";
    }

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

    api.sendMessage(msg, threadID);
  }
};