const fs = require("fs");
const path = require("path");

const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const USERS_PATH = path.join(__dirname, "../../data/users.json");

if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");

module.exports = {
  config: {
    name: "richest",
    aliases: ["topmoney", "top"],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event }) {
    const { threadID } = event;

    const balances = JSON.parse(fs.readFileSync(BAL_PATH));
    const users = JSON.parse(fs.readFileSync(USERS_PATH));

    const sorted = Object.entries(balances)
      .filter(([_, money]) => typeof money === "number")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (sorted.length === 0) {
      return api.sendMessage("❌ No data found.", threadID);
    }

    let msg =
      "╔════════════════════╗\n" +
      "💰 RICHEST PLAYERS 💰\n" +
      "╚════════════════════╝\n\n";

    for (let i = 0; i < sorted.length; i++) {
      const [uid, money] = sorted[i];

      let name = users[uid]?.name || "Unknown User";

      msg +=
        `${i + 1}. 👑 ${name}\n` +
        `   🆔 ${uid}\n` +
        `   💵 ₱${money.toLocaleString()}\n\n`;
    }

    api.sendMessage(msg.trim(), threadID);
  }
};