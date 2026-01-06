const ADMIN_UID = "61562953390569";

module.exports = {
  name: "botJoinLog",

  handleEvent({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const added = event.logMessageData?.addedParticipants || [];
    const botID = api.getCurrentUserID();

    if (!added.some(p => p.userFbId === botID)) return;

    api.getThreadInfo(event.threadID, (err, info) => {
      if (err) return;

      const msg =
        "📥 BOT LOG — JOINED GROUP\n\n" +
        `📌 Group: ${info.threadName || "Unnamed Group"}\n` +
        `🆔 Thread ID: ${event.threadID}\n` +
        `👥 Members: ${info.participantIDs.length}\n\n` +
        "✅ Bot was ADDED to a group chat.";

      api.sendMessage(msg, ADMIN_UID);
    });
  }
};