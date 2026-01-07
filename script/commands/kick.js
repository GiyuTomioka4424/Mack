module.exports = {
  config: {
    name: "kick",
    aliases: [],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const { threadID, senderID, messageReply, mentions } = event;

    /* ================= BOT ADMIN CHECK ================= */
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      if (!threadInfo.adminIDs.includes(api.getCurrentUserID())) {
        return api.sendMessage(
          "❌ Please make the bot an admin to use this command.",
          threadID
        );
      }
    } catch {
      return api.sendMessage(
        "❌ Failed to check admin permissions.",
        threadID
      );
    }

    /* ================= KICK BY REPLY ================= */
    if (!args[0]) {
      if (!messageReply) {
        return api.sendMessage(
          "❌ Please reply to a user or mention users to kick.",
          threadID
        );
      }

      try {
        await api.removeUserFromGroup(messageReply.senderID, threadID);
        return api.sendMessage(
          "✅ User has been kicked from the group.",
          threadID
        );
      } catch {
        return api.sendMessage(
          "❌ Failed to kick user. Make sure the bot is admin.",
          threadID
        );
      }
    }

    /* ================= KICK BY MENTION ================= */
    const uids = Object.keys(mentions || {});
    if (!uids.length) {
      return api.sendMessage(
        "❌ Please mention at least one user to kick.",
        threadID
      );
    }

    for (const uid of uids) {
      try {
        await api.removeUserFromGroup(uid, threadID);
      } catch {
        api.sendMessage(
          `⚠️ Failed to kick user: ${uid}`,
          threadID
        );
      }
    }

    api.sendMessage(
      "✅ Selected users have been kicked.",
      threadID
    );
  }
};