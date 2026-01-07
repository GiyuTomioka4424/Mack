const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const COOLDOWN = 5000; // 5 seconds anti-spam

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

module.exports = {
  config: {
    name: "mine",
    aliases: [],
    cooldown: 0, // handled manually
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH, "utf8"));

    /* ================= REGISTER CHECK ================= */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    /* ================= ANTI SPAM ================= */
    const now = Date.now();
    users[senderID].lastMine ??= 0;

    if (now - users[senderID].lastMine < COOLDOWN) {
      const wait = ((COOLDOWN - (now - users[senderID].lastMine)) / 1000).toFixed(1);
      return api.sendMessage(
        `⏳ Slow down!\nYou can mine again in ${wait}s.`,
        threadID
      );
    }

    users[senderID].lastMine = now;

    /* ================= INIT DATA ================= */
    inventory[senderID] ??= {};
    balance[senderID] = Number(balance[senderID]) || 0;
    users[senderID].mined = Number(users[senderID].mined) || 0;

    /* ================= PICKAXE CHECK ================= */
    if (
      !inventory[senderID].pickaxe ||
      typeof inventory[senderID].pickaxe.hp !== "number"
    ) {
      return api.sendMessage(
        "⛏️ NO PICKAXE\n\n" +
        "You need a pickaxe to mine.\n\n" +
        "Buy one from the shop:\n" +
        "shop buy pickaxe 1",
        threadID
      );
    }

    /* ================= USE PICKAXE ================= */
    inventory[senderID].pickaxe.hp -= 1;

    /* ================= PICKAXE BROKE ================= */
    if (inventory[senderID].pickaxe.hp <= 0) {
      delete inventory[senderID].pickaxe;

      fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

      return api.sendMessage(
        "💥 PICKAXE BROKE!\n\n" +
        "Your pickaxe has reached 0 durability.\n\n" +
        "🛒 Buy a new one from the shop:\n" +
        "shop buy pickaxe 1",
        threadID
      );
    }

    /* ================= MINING REWARD ================= */
    const reward = Math.floor(Math.random() * 300) + 150;

    balance[senderID] += reward;
    users[senderID].mined += reward;

    /* ================= SAVE ================= */
    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

    /* ================= RESULT ================= */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "⛏️ MINING RESULT\n" +
      "╚════════════════════╝\n\n" +
      `💰 You earned: ₱${reward.toLocaleString()}\n` +
      "🪓 Pickaxe used: 1\n" +
      `🔧 Remaining Uses: ${inventory[senderID].pickaxe.hp}/300`,
      threadID
    );
  }
};