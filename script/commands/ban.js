const fs = require("fs");
const path = require("path");

const BAN_PATH = path.join(__dirname, "../../data/ban.json");
const ADMIN_UID = "61562953390569";

if (!fs.existsSync(BAN_PATH)) {
  fs.writeFileSync(BAN_PATH, JSON.stringify({}, null, 2));
}

module.exports = {
  config: {
    name: "ban",
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
    let reason;

    if (Object.keys(mentions || {}).length > 0) {
      targetID = Object.keys(mentions)[0];
      reason = args.slice(1).join(" ") || "No reason provided";
    } else {
      targetID = args[0];
      reason = args.slice(1).join(" ") || "No reason provided";
    }

    if (!targetID) {
      return api.sendMessage(
        "❌ Usage:\n" +
        "ban @user [reason]\n" +
        "ban uid [reason]",
        threadID
      );
    }

    /* 🚫 PREVENT SELF-BAN */
    if (targetID === senderID) {
      return api.sendMessage("❌ You cannot ban yourself.", threadID);
    }

    /* ⚠️ ALREADY BANNED */
    if (bans[targetID]) {
      return api.sendMessage("⚠️ User is already banned.", threadID);
    }

    /* 🚫 BAN USER */
    bans[targetID] = {
      bannedBy: senderID,
      reason,
      time: Date.now()
    };

    fs.writeFileSync(BAN_PATH, JSON.stringify(bans, null, 2));

    /* ✅ CONFIRM TO ADMIN */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "🚫 USER BANNED\n" +
      "╚════════════════════╝\n\n" +
      `👤 UID: ${targetID}\n` +
      `📝 Reason: ${reason}\n`,
      threadID
    );

    /* 📩 NOTIFY USER (SAFE) */
    api.sendMessage(
      "╔════════════════════╗\n" +
      "🚫 YOU HAVE BEEN BANNED\n" +
      "╚════════════════════╝\n\n" +
      `📝 Reason: ${reason}\n` +
      "⛔ You can no longer use this bot.",
      targetID
    ).catch(() => {});
  }
};