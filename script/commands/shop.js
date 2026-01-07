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
    price: 500,
    type: "stack"
  },
  pickaxe: {
    name: "⛏️ Pickaxe",
    price: 3000,
    type: "durability",
    hp: 300
  },
  lotto_ticket: {
    name: "🎟️ Lotto Ticket",
    price: 2000,
    type: "stack"
  }
};

module.exports = {
  config: {
    name: "shop",
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));

    if (!users[senderID]) {
      return api.sendMessage("📝 Register first using: register", threadID);
    }

    inventory[senderID] ??= {};
    balance[senderID] = Number(balance[senderID]) || 0;

    /* VIEW SHOP */
    if (!args[0]) {
      let msg = "🛒 MACKY SHOP\n\n";
      for (const id in SHOP_ITEMS) {
        msg += `${SHOP_ITEMS[id].name}\n💰 ₱${SHOP_ITEMS[id].price}\n\n`;
      }
      msg += "Use:\nshop buy <item> <amount>";
      return api.sendMessage(msg, threadID);
    }

    /* BUY */
    if (args[0] === "buy") {
      const itemId = args[1];
      const amount = Math.max(1, parseInt(args[2]) || 1);
      const item = SHOP_ITEMS[itemId];

      if (!item) return api.sendMessage("❌ Invalid item.", threadID);

      const cost = item.price * amount;
      if (balance[senderID] < cost) {
        return api.sendMessage("❌ Not enough balance.", threadID);
      }

      balance[senderID] -= cost;

      if (item.type === "stack") {
        inventory[senderID][itemId] =
          Number(inventory[senderID][itemId]) + amount || amount;
      }

      if (item.type === "durability") {
        inventory[senderID][itemId] ??= { hp: item.hp };
      }

      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
      fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

      return api.sendMessage(
        `✅ Bought ${item.name}\n💰 Cost: ₱${cost}`,
        threadID
      );
    }
  }
};