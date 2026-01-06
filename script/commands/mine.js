const fs = require("fs");
const path = require("path");

const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const USERS_PATH = path.join(__dirname, "../../data/users.json");

if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  config: {
    name: "mine",
    aliases: [],
    role: 0,
    cooldown: 10,
    hasPrefix: false
  },

  async run({ api, event }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register",
        threadID
      );
    }

    const inventory = JSON.parse(fs.readFileSync(INV_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));

    inventory[senderID] ??= {};
    balance[senderID] ??= 0;

    if (!inventory[senderID].pickaxe || inventory[senderID].pickaxe <= 0) {
      return api.sendMessage(
        "⛏️ NO PICKAXE\n\n" +
        "You need a Pickaxe to mine.\n" +
        "Buy one from the shop!",
        threadID
      );
    }

    const msg = await api.sendMessage(
      "⛏️ Mining...\n\n⬜⬜⬜⬜⬜",
      threadID
    );

    const frames = [
      "🟩⬜⬜⬜⬜",
      "🟩🟩⬜⬜⬜",
      "🟩🟩🟩⬜⬜",
      "🟩🟩🟩🟩⬜",
      "🟩🟩🟩🟩🟩"
    ];

    for (const bar of frames) {
      await sleep(600);
      api.editMessage(
        `⛏️ Mining...\n\n${bar}`,
        msg.messageID
      );
    }

    const earned = Math.floor(Math.random() * 500) + 300;
    const broke = Math.random() < 0.25;

    balance[senderID] += earned;

    let result =
      "⛏️ MINING COMPLETE\n\n" +
      `💰 Earned: ₱${earned.toLocaleString()}\n`;

    if (broke) {
      inventory[senderID].pickaxe -= 1;
      result += "\n💥 Your pickaxe broke!";
    } else {
      result += "\n🛠️ Pickaxe still usable";
    }

    result +=
      "\n\n━━━━━━━━━━━━━━\n" +
      "⏳ Cooldown: 10s\n" +
      "— Macky Bot V3";

    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

    api.editMessage(result, msg.messageID);
  }
};