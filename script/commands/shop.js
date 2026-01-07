const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");

/* ================= SHOP ITEMS ================= */
const SHOP_ITEMS = {
  lucky_charm: {
    name: "🍀 Lucky Charm",
    price: 5000,
    description: "Boosts your next slot win chance"
  },
  pickaxe: {
    name: "⛏️ Pickaxe",
    price: 3000,
    description: "Required to use the mine command"
  },
  lotto_ticket: {
    name: "🎟️ Lotto Ticket",
    price: 2000,
    description: "Used to enter the lotto game"
  }
};

module.exports = {
  config: {
    name: "shop",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));

    /* 📝 REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    balance[senderID] = Number(balance[senderID]) || 0;
    inventory[senderID] = inventory[senderID] || {};

    /* ================= VIEW SHOP ================= */
    if (!args[0]) {
      let msg =
        "╔════════════════════╗\n" +
        "🛒 MACKY SHOP 🛒\n" +
        "╚════════════════════╝\n\n";

      for (const id in SHOP_ITEMS) {
        const item = SHOP_ITEMS[id];
        msg +=
          `${item.name}\n` +
          `💰 Price: ₱${item.price.toLocaleString()}\n` +
          `📦 ID: ${id}\n` +
          `📄 ${item.description}\n\n`;
      }

      msg +=
        "━━━━━━━━━━━━━━━━━━\n" +
        "🛍️ Buy using:\n" +
        "shop buy <item_id> <amount>\n\n" +
        "Example:\n" +
        "shop buy pickaxe 1";

      return api.sendMessage(msg, threadID);
    }

    /* ================= BUY ITEM ================= */
    if (args[0].toLowerCase() === "buy") {
      const itemId = args[1]?.toLowerCase();
      const amount = Math.max(parseInt(args[2]) || 1, 1);

      if (!itemId || !SHOP_ITEMS[itemId]) {
        return api.sendMessage(
          "❌ Invalid item.\nUse: shop",
          threadID
        );
      }

      const totalCost = SHOP_ITEMS[itemId].price * amount;

      if (balance[senderID] < totalCost) {
        return api.sendMessage(
          "❌ Not enough balance.\n\n" +
          `💰 Your balance: ₱${balance[senderID].toLocaleString()}\n` +
          `🧾 Required: ₱${totalCost.toLocaleString()}`,
          threadID
        );
      }

      /* 💰 PAY */
      balance[senderID] -= totalCost;
      inventory[senderID][itemId] =
        (inventory[senderID][itemId] || 0) + amount;

      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
      fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

      return api.sendMessage(
        "╔════════════════════╗\n" +
        "✅ PURCHASE SUCCESSFUL\n" +
        "╚════════════════════╝\n\n" +
        `🛍️ Item: ${SHOP_ITEMS[itemId].name}\n` +
        `📦 Amount: ${amount}\n` +
        `💰 Cost: ₱${totalCost.toLocaleString()}\n\n` +
        "🎒 Added to your inventory.",
        threadID
      );
    }

    /* ================= FALLBACK ================= */
    api.sendMessage(
      "❌ Invalid shop command.\n\nUse:\nshop\nshop buy <item_id> <amount>",
      threadID
    );
  }
};