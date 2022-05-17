const { mongoose } = require("mongoose");
const { Conversation } = require("../models/conversation");
const { User } = require('../models/user');

const createConversation = async (creatorId, friendId, displayName, image, time) => {
    try {
        // check size 2 is to filter private chat
        var conversation = await Conversation.findOneAndUpdate({ members: { $size: 2, $all: [friendId, creatorId] } }, { $addToSet: { "readBy": creatorId } }, { new: true });
        if (conversation == null) {
            conversation = await Conversation.create({ displayName, image, members: [creatorId, friendId], time, creatorId, readBy: [creatorId] });
            await User.updateMany({ "_id": { $in: [mongoose.Types.ObjectId(creatorId), mongoose.Types.ObjectId(friendId)] } }, { $addToSet: { "conversations": conversation._id } }, { new: true });
        }
        return conversation;
    } catch (error) {
        console.log("Error is" + error);
        return { "error": "Conversation Creation Error" }
    }
}


const getConversation = async (creatorId, members, displayName, image, time) => {
    try {
        // check size 2 is to filter private chat
        console.log("members are in cov " + members)
        // members.push(creatorId);
        var conversation = await Conversation.findOneAndUpdate({ members: { $size: members.length, $all: members } }, { $addToSet: { "readBy": creatorId } }, { new: true });
        if (conversation == null) {
            console.log(members)
            conversation = await Conversation.create({ displayName, image, members: members, time, creatorId, readBy: [creatorId] });
            await User.updateMany({ "_id": { $in: [...members] } }, { $addToSet: { "conversations": conversation._id } }, { new: true });
        }
        return conversation;
    } catch (error) {
        console.log("Error is" + error);
        return { "error": "Conversation Creation Error" }
    }
}

Conversation.watch([{ $match: { operationType: ['update'] } }]).on('change', (data) => {
    io.emit('conversationUpdate', data.fullDocument);
})

module.exports = {
    createConversation,
    getConversation
}