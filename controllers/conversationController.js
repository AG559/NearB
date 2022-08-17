const { mongoose } = require("mongoose");
const { Conversation } = require("../models/conversation");
const { User } = require('../models/user');

const getConversation = async ({ creatorId, members, displayName = "", image = "testimage", time = "testTime" }) => {
    // check size 2 is to filter private chat
    members.push(creatorId);
    if (displayName != "") {
        var conversation = await Conversation.findOne({ members: { $size: members.length, $all: members } });
    }
    if (conversation == null) {
        console.log(members)
        console.log("displayName " + displayName)
        conversation = await Conversation.create({ displayName, image, members: members, time, creatorId });
        await User.updateMany({ "_id": { $in: [...members] } }, { $addToSet: { "conversations": conversation._id } }, { new: true });
        return { conversation, "isNew": true }
    } else {
        return { conversation, "isNew": false };
    }
}

Conversation.watch([{ $match: { operationType: ['update'] } }]).on('change', (data) => {
    io.emit('conversationUpdate', data.fullDocument);
})

module.exports = {
    getConversation
}