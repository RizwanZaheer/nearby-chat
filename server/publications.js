Meteor.publish('myChats', function () {
    return Chats.find({ userId: this.userId });
});

Meteor.publish('chat', function (id) {
    return Chats.find(id);
});

Meteor.publish('guests', function () {
    return Meteor.users.find({ _id: { $ne: this.userId } });
});

Meteor.publish('messages', function (chatId) {
    return Messages.find({ chatId: chatId });
});