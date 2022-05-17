const mongoose = require('mongoose');
const { User } = require('./user');

const ConversationSchema = mongoose.Schema({
    displayName: {
        type: String,
        required: [true, "Please set displayName"]
    },
    text: {
        type: String,
        default: "Welcome...",
    },
    readBy: {
        type: Array,
        default: []
    },
    image: {
        type: String,
        required: [true, "Please set Image"]
    },
    members: {
        type: [String],
        validate: v => Array.isArray(v) && v.length > 0
    },
    time: {
        type: String,
        default: ""
    },
    creatorId: {
        type: String,
        required: [true, "Please set CreatorID"]
    }
});

ConversationSchema.statics.getAllConversationByUser = async (userId) => {
    try {
        const conversation = await this.Conversation.aggregate([
            {
                $match: { "members": { $elemMatch: { $eq: userId } } }
            },
            { $unwind: "$members" },
            {
                $project: {
                    displayName: 1,
                    text: 1,
                    readBy: 1,
                    image: 1,
                    members: 1,
                    time: 1,
                    creatorId: 1,
                }
            },
            { $set: { members: { $toObjectId: "$members" } } },
            {
                $lookup: {
                    from: "users",
                    localField: "members",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $group: {
                    _id: {
                        _id: "$_id",
                        displayName: "$displayName",
                        text: "$text",
                        readBy: "$readBy",
                        image: "$image",
                        time: "$time",
                        creatorId: "$creatorId",

                    },
                    members: { "$push": "$user" }
                }
            },
            {
                $project: {
                    _id: "$_id._id",
                    displayName: "$_id.displayName",
                    text: "$_id.text",
                    readBy: "$_id.readBy",
                    image: "$_id.image",
                    time: "$_id.time",
                    creatorId: "$_id.creatorId",
                    members: 1,
                }
            },
            {
                $sort: {
                    _id: -1
                }
            }

        ])
        return conversation;
    } catch (error) {
        console.log(error)
        throw Error(error);
    }
}

ConversationSchema.statics.getConversation = async (myId, friendId) => {
    try {
        const conversation = await User.aggregate([
            {
                $match: {
                    "_id": { $in: [mongoose.Types.ObjectId(myId), mongoose.Types.ObjectId(friendId)] }
                }
            },
            {
                $group: {
                    "_id": "gp-id",
                    "user1": { "$first": "$$ROOT" },
                    "user2": { "$last": "$$ROOT" },
                    "chat1": { "$first": "$conversations" },
                    "chat2": { "$last": "$conversations" }
                }
            },
            {
                $project: {
                    "_id": 0,
                    "members": ["$user1", "$user2"],
                    "chatId": {
                        "$setIntersection": ["$chat1", "$chat2"]
                    }
                }
            },
            { $unwind: "$chatId" },
            { $set: { chatId: { $toObjectId: "$chatId" } } },
            {
                $lookup: {
                    from: 'conversations',
                    localField: 'chatId',
                    foreignField: '_id',
                    as: 'conversation'
                }
            },
            { $unwind: "$conversation" },
            {
                $project: {
                    "_id": "$conversation._id",
                    "members": 1,
                    "displayName": "$conversation.displayName",
                    "text": "$conversation.text",
                    "readBy": "$conversation.readBy",
                    "image": "$conversation.image",
                    "time": "$conversation.time",
                    "creatorId": "$conversation.creatorId",
                }
            }
        ]);
        if (conversation == null || conversation.length == 0) {
            console.log("conversation is empty " + conversation)
            return [];
        }
        return conversation[0];
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports.Conversation = mongoose.model('conversation', ConversationSchema);