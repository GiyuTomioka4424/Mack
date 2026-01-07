const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

/* ITEM META */
const ITEMS = {
  lucky_charm: { name: "🍀 Lucky Charm", sell: 250 },
  pickaxe: { name: "⛏️ Pickaxe", sell: 1500 },
  lotto_ticket: { name: "🎟️ Lotto Ticket", sell: 1000 },
  change_name: { name: "📝 Change Name Pass", sell: 5000 }
};

module.exports = {
  config: {
    name: "inventory",
    aliases: ["inv"],
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, mentions } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const inventory = JSON.parse(fs.readFileSync(INV_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));

    /* REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    inventory[senderID] ??= {};
    balance[senderID] = Number(balance[senderID]) || 0;

    /* ================= VIEW INVENTORY ================= */
    if (!args[0]) {
      let msg =
        "╔════════════════════╗\n" +
        "🎒 YOUR INVENTORY 🎒\n" +
        "╚════════════════════╝\n\n";

      const items = inventory[senderID];
      if (!Object.keys(items).length) {
        msg += "📦 Inventory is empty.";
      } else {
        for (const id in items) {
          if (typeof items[id] === "object") {
            msg += `${ITEMS[id]?.name || id}\n🔧 HP: ${items[id].hp}\n\n`;
          } else {
            msg += `${ITEMS[id]?.name || id} × ${items[id]}\n\n`;
          }
        }
      }

      return api.sendMessage(msg, threadID);
    }

    /* ================= USE ITEM ================= */
    if (args[0] === "use") {
      const item = args[1];

      if (!inventory[senderID][item]) {
        return api.sendMessage("❌ You don't have that item.", threadID);
      }

      if (item === "change_name") {
        delete inventory[senderID][item];
        fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
        return api.sendMessage(
          "📝 Name change pass used.\nUse: register <new name>",
          threadID
        );
      }

      return api.sendMessage(
        "⚠️ This item is used automatically in other commands.",
        threadID
      );
    }

    /* ================= SELL ITEM ================= */
    if (args[0] === "sell") {
      const item = args[1];
      const amount = Math.max(1, parseInt(args[2]) || 1);

      if (!ITEMS[item] || !inventory[senderID][item]) {
        return api.sendMessage("❌ Invalid item.", threadID);
      }

      if (typeof inventory[senderID][item] === "object") {
        delete inventory[senderID][item];
        balance[senderID] += ITEMS[item].sell;
      } else {
        if (inventory[senderID][item] < amount)
          return api.sendMessage("❌ Not enough items.", threadID);

        inventory[senderID][item] -= amount;
        balance[senderID] += ITEMS[item].sell * amount;

        if (inventory[senderID][item] <= 0)
          delete inventory[senderID][item];
      }

      fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
      fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

      return api.sendMessage(
        `💰 Sold ${ITEMS[item].name}\nNew Balance: ₱${balance[senderID].toLocaleString()}`,
        threadID
      );
    }

    /* ================= GIVE ITEM ================= */
    if (args[0] === "give") {
      const targetID = mentions && Object.keys(mentions)[0];
      const item = args[1];
      const amount = Math.max(1, parseInt(args[2]) || 1);

      if (!targetID || !users[targetID]) {
        return api.sendMessage("❌ Invalid user.", threadID);
      }

      if (!inventory[senderID][item]) {
        return api.sendMessage("❌ You don't have that item.", threadID);
      }

      inventory[targetID] ??= {};

      if (typeof inventory[senderID][item] === "object") {
        inventory[targetID][item] = inventory[senderID][item];
        delete inventory[senderID][item];
      } else {
        if (inventory[senderID][item] < amount)
          return api.sendMessage("❌ Not enough items.", threadID);

        inventory[senderID][item] -= amount;
        inventory[targetID][item] =
          (inventory[targetID][item] || 0) + amount;

        if (inventory[senderID][item] <= 0)
          delete inventory[senderID][item];
      }

      fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));

      return api.sendMessage(
        `🎁 Item sent to ${users[targetID].name}`,
        threadID
      );
    }

    api.sendMessage(
      "Usage:\n" +
      "inventory\n" +
      "inventory use <item>\n" +
      "inventory sell <item> <amount>\n" +
      "inventory give @user <item> <amount>",
      threadID
    );
  }
};