const fs = require("fs");
const path = require("path");

const BAN_PATH = path.join(__dirname, "../../data/ban.json");
const ADMIN_UID = "61562953390569";

if (!fs.existsSync(BAN_PATH)) {
  fs.writeFileSync(BAN_PATH, JSON.stringify({}, null, 2));
}

module.exports = {
  config: {
    name: "unban",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  run({ api, event, args }) {
    const { senderID, threadID, mentions } = event;

    /* 🔒 ADMIN ONLY */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage("⛔ Admin only command.", threadID);
    }

    const bans = JSON.parse(fs.readFileSync(BAN_PATH, "utf8"));

    /* 🎯 GET TARGET */
    let targetID;

    if (Object.keys(mentions || {}).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      targetID = args[0];
    }

    if (!targetID) {
      return api.sendMessage(
        "❌ Usage:\n" +
        "unban @user\n" +
        "unban uid",
        threadID
      );
    }

    /* ⚠️ NOT BANNED */
    if (!bans[targetID]) {
      return api.sendMessage("⚠️ User is not banned.", threadID);
    }

    /* ✅ UNBAN */
    delete bans[targetID];
    fs.writeFileSync(BAN_PATH, JSON.stringify(bans, null, 2));

    /* ✅ CONFIRM ADMIN */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "✅ USER UNBANNED\n" +
      "╚════════════════════╝\n\n" +
      `👤 UID: ${targetID}\n` +
      "🎉 They can now use the bot again.",
      threadID
    );

    /* 📩 NOTIFY USER (SAFE) */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "🎉 YOU HAVE BEEN UNBANNED\n" +
      "╚════════════════════╝\n\n" +
      "✅ You can now use the bot again.",
      targetID
    ).catch(() => {});
  }
};