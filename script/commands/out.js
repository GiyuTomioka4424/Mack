const ADMIN_UID = "61562953390569";

module.exports = {
  config: {
    name: "out",
    aliases: ["leave"],
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event }) {
    const { threadID, senderID } = event;

    /* 🔒 ADMIN ONLY */
    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ Only the bot admin can use this command.",
        threadID
      );
    }

    /* ✅ CONFIRM + LEAVE */
    api.sendMessage(
      "👋 Bot is leaving this group.\nRequested by admin.",
      threadID,
      () => {
        api.removeUserFromGroup(api.getCurrentUserID(), threadID);
      }
    );
  }
};