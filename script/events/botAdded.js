module.exports = {
  name: "botAdded",

  handleEvent({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const botID = api.getCurrentUserID();
    const addedUsers = event.logMessageData.addedParticipants || [];

    if (!addedUsers.some(u => u.userFbId === botID)) return;

    api.sendMessage(
      "🤖 Hello everyone!\n\n" +
      "Thanks for adding me 💙\n\n" +
      "📝 Please register to start:\n" +
      "register <name>\n\n" +
      "Type `help` to see commands.",
      event.threadID
    );
  }
};