module.exports = {
  name: "join",

  handleEvent({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const addedUsers = event.logMessageData.addedParticipants || [];
    const threadID = event.threadID;

    addedUsers.forEach(user => {
      const name = user.fullName || "New Member";

      api.sendMessage(
        "╔════════════════════╗\n" +
        "👋 WELCOME!\n" +
        "╚════════════════════╝\n\n" +
        `Hello ${name} 🎉\n\n` +
        "📝 Please register first:\n" +
        "register <your name>\n\n" +
        "Enjoy your stay 💙",
        threadID
      );
    });
  }
};