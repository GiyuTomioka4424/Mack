const fs = require("fs");
const path = require("path");

const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const USERS_PATH = path.join(__dirname, "../../data/users.json");

if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");

module.exports = {
  config: {
    name: "richest",
    aliases: ["toprich", "top10"],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    // ✅ register check
    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register",
        threadID
      );
    }

    const balance = JSON.parse(fs.readFileSync(BAL_PATH));

    const top10 = Object.entries(balance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (top10.length === 0) {
      return api.sendMessage(
        "🏆 TOP 10 RICHEST\n\nNo players yet.",
        threadID
      );
    }

    let msg =
      "╔════════════════════╗\n" +
      "🏆 TOP 10 RICHEST\n" +
      "╚════════════════════╝\n\n";

    top10.forEach((item, index) => {
      const [uid, money] = item;
      msg +=
        `${index + 1}. 👤 ${uid}\n` +
        `   💰 ₱${money.toLocaleString()}\n\n`;
    });

    msg += "━━━━━━━━━━━━━━━━━━\n— Macky Bot V3";

    api.sendMessage(msg, threadID);
  }
};