module.exports = {
  config: {
    name: "accept",
    aliases: ["friend"],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event, args }) {
    const ADMIN_UID = "61562953390569";
    const { senderID, threadID } = event;

    if (senderID !== ADMIN_UID) {
      return api.sendMessage(
        "⛔ ACCESS DENIED\n\nOnly the bot admin can manage friend requests.",
        threadID
      );
    }

    api.getFriendRequests(async (err, requests) => {
      if (err) {
        return api.sendMessage(
          "❌ Failed to fetch friend requests.",
          threadID
        );
      }

      if (!requests || requests.length === 0) {
        return api.sendMessage(
          "📭 No pending friend requests.",
          threadID
        );
      }

      /* ================= ACCEPT ALL ================= */
      if (args[0] === "all") {
        for (const user of requests) {
          await api.handleFriendRequest(user.userID, true);
        }

        return api.sendMessage(
          "✅ FRIEND REQUESTS ACCEPTED\n\n" +
          `Total accepted: ${requests.length}`,
          threadID
        );
      }

      /* ================= DECLINE ALL ================= */
      if (args[0] === "decline") {
        for (const user of requests) {
          await api.handleFriendRequest(user.userID, false);
        }

        return api.sendMessage(
          "🚫 FRIEND REQUESTS DECLINED\n\n" +
          `Total declined: ${requests.length}`,
          threadID
        );
      }

      /* ================= LIST REQUESTS ================= */
      let msg =
        "╔════════════════════╗\n" +
        "👥 FRIEND REQUESTS\n" +
        "╚════════════════════╝\n\n";

      requests.forEach((u, i) => {
        msg += `${i + 1}. ${u.name}\n🆔 ${u.userID}\n\n`;
      });

      msg +=
        "━━━━━━━━━━━━━━━━━━\n" +
        "Commands:\n" +
        "✔ accept all\n" +
        "❌ accept decline";

      api.sendMessage(msg, threadID);
    });
  }
};