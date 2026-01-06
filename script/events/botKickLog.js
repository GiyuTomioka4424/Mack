const ADMIN_UID = "61562953390569";

module.exports = {
  name: "botKickLog",

  handleEvent({ api, event }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const botID = api.getCurrentUserID();
    if (event.logMessageData?.leftParticipantFbId !== botID) return;

    const msg =
      "📤 BOT LOG — REMOVED FROM GROUP\n\n" +
      `🆔 Thread ID: ${event.threadID}\n\n` +
      "❌ Bot was KICKED or REMOVED from a group chat.";

    api.sendMessage(msg, ADMIN_UID);
  }
};