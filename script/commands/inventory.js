const fs = require("fs");
const path = require("path");

const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const TEMP_PATH = path.join(__dirname, "../../data/temp.json");

if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");
if (!fs.existsSync(TEMP_PATH)) fs.writeFileSync(TEMP_PATH, "{}");

const ITEM_INFO = {
  lucky_charm: {
    name: "🍀 Lucky Charm",
    usable: true,
    onUse: (senderID, temp) => {
      temp[senderID] ??= {};
      temp[senderID].luckyCharm = true;
    }
  },
  pickaxe: {
    name: "⛏️ Pickaxe",
    usable: false
  }
};

function normalize(str) {
  return str.toLowerCase().replace(/[\s_-]/g, "");
}

module.exports = {
  config: {
    name: "inv",
    aliases: ["inventory"],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID } = event;

    const inventory = JSON.parse(fs.readFileSync(INV_PATH));
    const temp = JSON.parse(fs.readFileSync(TEMP_PATH));

    inventory[senderID] ??= {};

    /* ================= SHOW INVENTORY ================= */
    if (!args[0]) {
      const items = Object.entries(inventory[senderID]);

      if (items.length === 0) {
        return api.sendMessage("🎒 Your inventory is empty.", threadID);
      }

      let msg =
        "╔════════════════════╗\n" +
        "🎒 YOUR INVENTORY\n" +
        "╚════════════════════╝\n\n";

      items.forEach(([id, qty], i) => {
        const item = ITEM_INFO[id];
        if (!item || qty <= 0) return;
        msg += `${i + 1}. ${item.name}\n   ID: ${id}\n   📦 x${qty}\n\n`;
      });

      msg += "Use item with:\ninv use <item name | id | number>";

      return api.sendMessage(msg, threadID);
    }

    /* ================= USE ITEM ================= */
    if (args[0] === "use") {
      if (!args[1]) {
        return api.sendMessage(
          "❌ Usage:\ninv use <item name | id | number>",
          threadID
        );
      }

      const items = Object.entries(inventory[senderID])
        .filter(([_, qty]) => qty > 0);

      if (items.length === 0) {
        return api.sendMessage("🎒 Your inventory is empty.", threadID);
      }

      let itemID = null;

      // 🔢 USE BY NUMBER
      if (!isNaN(args[1])) {
        const index = Number(args[1]) - 1;
        if (!items[index]) {
          return api.sendMessage("❌ Invalid item number.", threadID);
        }
        itemID = items[index][0];
      }
      // 🔤 USE BY NAME / ID
      else {
        const input = normalize(args.slice(1).join(" "));
        for (const [id] of items) {
          if (
            normalize(id) === input ||
            normalize(ITEM_INFO[id]?.name || "") === input
          ) {
            itemID = id;
            break;
          }
        }
      }

      if (!itemID || !ITEM_INFO[itemID]) {
        return api.sendMessage("❌ Item not found.", threadID);
      }

      const item = ITEM_INFO[itemID];

      if (!item.usable) {
        return api.sendMessage(
          `❌ ${item.name} cannot be used.`,
          threadID
        );
      }

      // APPLY EFFECT
      item.onUse?.(senderID, temp);

      // CONSUME ITEM
      inventory[senderID][itemID]--;
      if (inventory[senderID][itemID] <= 0) {
        delete inventory[senderID][itemID];
      }

      fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
      fs.writeFileSync(TEMP_PATH, JSON.stringify(temp, null, 2));

      return api.sendMessage(
        `✅ ${item.name} used successfully!\n🍀 Effect will apply on your next action.`,
        threadID
      );
    }

    api.sendMessage("❌ Invalid inventory command.", threadID);
  }
};