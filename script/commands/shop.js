const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");

/* ================= ENSURE FILES ================= */
if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");

/* ================= SHOP ITEMS ================= */
const SHOP_ITEMS = {
  pickaxe: {
    name: "⛏️ Pickaxe",
    price: 3000,
    description: "Required for mining (300 durability)",
    stack: false,
    durability: 300
  },
  lucky_charm: {
    name: "🍀 Lucky Charm",
    price: 500, // ✅ LOWERED PRICE
    description: "Increases slot win chance (consumed on use)",
    stack: true
  },
  lotto_ticket: {
    name: "🎟️ Lotto Ticket",
    price: 2000,
    description: "Used to join lotto",
    stack: true
  },
  change_name: {
    name: "📝 Change Name Pass",
    price: 10000,
    description: "Allows changing registered name",
    stack: true
  }
};

module.exports = {
  config: {
    name: "shop",
    aliases: [],
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));

    /* ================= REGISTER CHECK ================= */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    balance[senderID] = Number(balance[senderID]) || 0;
    inventory[senderID] ??= {};

    /* ================= SHOW SHOP ================= */
    if (!args[0]) {
      let msg =
        "╔════════════════════╗\n" +
        "🛒 MACKY SHOP\n" +
        "╚════════════════════╝\n\n";

      for (const id in SHOP_ITEMS) {
        const it = SHOP_ITEMS[id];
        msg +=
          `${it.name}\n` +
          `💰 Price: ₱${it.price.toLocaleString()}\n` +
          `📄 ${it.description}\n\n`;
      }

      msg +=
        "━━━━━━━━━━━━━━━━━━\n" +
        "📌 Buy items using:\n" +
        "shop buy <item> <amount>\n\n" +
        "Example:\n" +
        "shop buy lucky_charm 5";

      return api.sendMessage(msg, threadID);
    }

    /* ================= BUY ITEM ================= */
    if (args[0] === "buy") {
      const itemId = args[1]?.toLowerCase();
      const amount = Math.max(parseInt(args[2]) || 1, 1);

      if (!SHOP_ITEMS[itemId]) {
        return api.sendMessage("❌ Item not found.", threadID);
      }

      const item = SHOP_ITEMS[itemId];
      const totalCost = item.price * amount;

      if (balance[senderID] < totalCost) {
        return api.sendMessage(
          "❌ Not enough balance.\n\n" +
          `💰 Balance: ₱${balance[senderID].toLocaleString()}\n` +
          `💸 Needed: ₱${totalCost.toLocaleString()}`,
          threadID
        );
      }

      /* ================= HANDLE PICKAXE ================= */
      if (!item.stack) {
        if (inventory[senderID][itemId]) {
          return api.sendMessage(
            "⚠️ You already own a pickaxe.\nUse it before buying another.",
            threadID
          );
        }

        inventory[senderID][itemId] = {
          durability: item.durability
        };
      } else {
        inventory[senderID][itemId] =
          (inventory[senderID][itemId] || 0) + amount;
      }

      balance[senderID] -= totalCost;

      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
      fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

      return api.sendMessage(
        "✅ PURCHASE SUCCESSFUL\n\n" +
        `🛍️ Item: ${item.name}\n` +
        `📦 Amount: ${amount}\n` +
        `💰 Cost: ₱${totalCost.toLocaleString()}\n\n` +
        "🎒 Added to your inventory!",
        threadID
      );
    }

    api.sendMessage(
      "❌ Invalid command.\nUse:\nshop\nshop buy <item> <amount>",
      threadID
    );
  }
};