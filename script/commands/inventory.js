const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

const ITEM_INFO = {
  lucky_charm: { name: "🍀 Lucky Charm", sell: 2500 },
  pickaxe: { name: "⛏️ Pickaxe", sell: 1500 },
  lotto_ticket: { name: "🎟️ Lotto Ticket", sell: 1000 },
  change_name: { name: "📝 Change Name Pass", sell: 5000 }
};

module.exports = {
  config: {
    name: "inventory",
    aliases: ["inv"],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, mentions } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const inv = JSON.parse(fs.readFileSync(INV_PATH));
    const bal = JSON.parse(fs.readFileSync(BAL_PATH));

    /* 🔒 REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    inv[senderID] ??= {};
    bal[senderID] ??= 0;

    /* ================= VIEW INVENTORY ================= */
    if (!args[0]) {
      const items = Object.entries(inv[senderID]).filter(([_, q]) => q > 0);

      if (!items.length)
        return api.sendMessage("🎒 INVENTORY\n\n(empty)", threadID);

      let msg = "╔════════════════╗\n🎒 YOUR INVENTORY\n╚════════════════╝\n\n";
      items.forEach(([id, qty]) => {
        const itemName = ITEM_INFO[id]?.name || id;
        msg += `${itemName} ×${qty}\n`;
      });

      msg += "\n━━━━━━━━━━━━━━━━\nUse:\ninv use / inv sell / inv give";
      return api.sendMessage(msg, threadID);
    }

    /* ================= USE ITEM ================= */
    if (args[0] === "use") {
      const item = args[1]?.toLowerCase();

      if (!ITEM_INFO[item])
        return api.sendMessage("❌ Unknown item.", threadID);

      if (!inv[senderID][item] || inv[senderID][item] < 1)
        return api.sendMessage("❌ You don't own this item.", threadID);

      /* 📝 CHANGE NAME */
      if (item === "change_name") {
        const newName = args.slice(2).join(" ").trim();
        if (!newName)
          return api.sendMessage(
            "Usage:\ninv use changename <new name>",
            threadID
          );

        const oldName = users[senderID].name;
        users[senderID].name = newName;
        inv[senderID][item]--;

        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
        fs.writeFileSync(INV_PATH, JSON.stringify(inv, null, 2));

        return api.sendMessage(
          "✅ NAME UPDATED\n\n" +
          `Old: ${oldName}\nNew: ${newName}`,
          threadID
        );
      }

      /* 🍀 LUCKY CHARM */
      if (item === "lucky_charm") {
        users[senderID].luckyCharmActive = true;
        inv[senderID][item]--;

        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
        fs.writeFileSync(INV_PATH, JSON.stringify(inv, null, 2));

        return api.sendMessage(
          "🍀 Lucky Charm activated!\nYour next slot spin has bonus luck.",
          threadID
        );
      }

      return api.sendMessage("❌ This item cannot be used directly.", threadID);
    }

    /* ================= SELL ITEM ================= */
    if (args[0] === "sell") {
      const item = args[1]?.toLowerCase();
      const amount = parseInt(args[2]);

      if (!ITEM_INFO[item] || !amount || amount < 1)
        return api.sendMessage(
          "Usage:\ninv sell <item> <amount>",
          threadID
        );

      if ((inv[senderID][item] || 0) < amount)
        return api.sendMessage("❌ Not enough items.", threadID);

      const earn = ITEM_INFO[item].sell * amount;

      inv[senderID][item] -= amount;
      bal[senderID] += earn;

      fs.writeFileSync(INV_PATH, JSON.stringify(inv, null, 2));
      fs.writeFileSync(BAL_PATH, JSON.stringify(bal, null, 2));

      return api.sendMessage(
        `💰 SOLD ${ITEM_INFO[item].name}\n` +
        `Amount: ${amount}\n` +
        `Earned: ₱${earn.toLocaleString()}`,
        threadID
      );
    }

    /* ================= GIVE ITEM ================= */
    if (args[0] === "give") {
      const item = args[1]?.toLowerCase();
      const amount = parseInt(args[2]);
      const targetID =
        Object.keys(mentions || {})[0] || args[3];

      if (!ITEM_INFO[item] || !amount || amount < 1 || !targetID)
        return api.sendMessage(
          "Usage:\ninv give <item> <amount> @user / uid",
          threadID
        );

      if (!users[targetID])
        return api.sendMessage("❌ Target is not registered.", threadID);

      if ((inv[senderID][item] || 0) < amount)
        return api.sendMessage("❌ Not enough items.", threadID);

      inv[targetID] ??= {};
      inv[targetID][item] = (inv[targetID][item] || 0) + amount;
      inv[senderID][item] -= amount;

      fs.writeFileSync(INV_PATH, JSON.stringify(inv, null, 2));

      return api.sendMessage(
        "🎁 ITEM SENT\n\n" +
        `Item: ${ITEM_INFO[item].name}\n` +
        `Amount: ${amount}\n` +
        `To: ${users[targetID].name}`,
        threadID
      );
    }

    /* ================= FALLBACK ================= */
    api.sendMessage(
      "❌ Invalid inventory command.\nUse:\ninv / inv use / inv sell / inv give",
      threadID
    );
  }
};