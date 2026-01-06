module.exports = {
  name: "leave",

  handleEvent({ api, event }) {
    if (event.logMessageType !== "log:unsubscribe") return;

    const leftUserID = event.logMessageData.leftParticipantFbId;
    const threadID = event.threadID;

    api.getUserInfo(leftUserID, (err, data) => {
      const name = data?.[leftUserID]?.name || "Someone";

      api.sendMessage(
        "╔════════════════════╗\n" +
        "👋 GOODBYE\n" +
        "╚════════════════════╝\n\n" +
        `${name} has left the group.\n\n` +
        "We wish you well 🌙",
        threadID
      );
    });
  }
};