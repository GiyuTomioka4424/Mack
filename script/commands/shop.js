const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

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
  },
  change_name: {
    name: "📝 Change Name Pass",
    price: 10000,
    description: "Allows you to change your registered name"
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
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));

    /* 🔒 REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    inventory[senderID] ??= {};
    balance[senderID] ??= 0;

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
          `📄 ${item.description}\n\n`;
      }

      msg +=
        "━━━━━━━━━━━━━━━━━━\n" +
        "Buy using:\n" +
        "shop buy <item> <amount>\n\n" +
        "Example:\n" +
        "shop buy lucky_charm 1";

      return api.sendMessage(msg, threadID);
    }

    /* ================= BUY ITEM ================= */
    if (args[0] === "buy") {
      const itemId = args[1]?.toLowerCase();
      const amount = parseInt(args[2]) || 1;

      if (!SHOP_ITEMS[itemId] || amount < 1) {
        return api.sendMessage(
          "❌ Invalid item or amount.\nUse: shop",
          threadID
        );
      }

      const totalCost = SHOP_ITEMS[itemId].price * amount;

      if (balance[senderID] < totalCost) {
        return api.sendMessage(
          "❌ Not enough balance.\n" +
          `Required: ₱${totalCost.toLocaleString()}`,
          threadID
        );
      }

      balance[senderID] -= totalCost;
      inventory[senderID][itemId] =
        (inventory[senderID][itemId] || 0) + amount;

      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
      fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

      return api.sendMessage(
        "✅ PURCHASE SUCCESSFUL\n\n" +
        `Item: ${SHOP_ITEMS[itemId].name}\n` +
        `Amount: ${amount}\n` +
        `Total Cost: ₱${totalCost.toLocaleString()}\n\n` +
        "🎒 Item added to your inventory.",
        threadID
      );
    }

    /* ================= FALLBACK ================= */
    api.sendMessage(
      "❌ Invalid shop command.\nUse:\nshop\nshop buy <item> <amount>",
      threadID
    );
  }
};