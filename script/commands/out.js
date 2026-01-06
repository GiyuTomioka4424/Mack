module.exports = {
  config: {
    name: "out",
    aliases: ["leave"],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event }) {
    const { threadID, senderID, isGroup } = event;

    if (!isGroup) {
      return api.sendMessage(
        "❌ This command can only be used in group chats.",
        threadID
      );
    }

    /* ================= CHECK GROUP ADMIN ================= */
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const adminIDs = threadInfo.adminIDs.map(a => a.id);

      if (!adminIDs.includes(senderID)) {
        return api.sendMessage(
          "⛔ Only group admins can use this command.",
          threadID
        );
      }

      api.sendMessage(
        "👋 Admin requested bot removal.\nLeaving the group now...",
        threadID,
        () => api.removeUserFromGroup(api.getCurrentUserID(), threadID)
      );

    } catch (err) {
      api.sendMessage(
        "❌ Unable to verify admin permissions.",
        threadID
      );
    }
  }
};