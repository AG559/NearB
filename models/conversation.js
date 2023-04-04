const mongoose = require('mongoose');

const ConversationSchema = mongoose.Schema({
    displayName: {
        type: String,
        required: [true, "Please set displayName"]
    },
    text: {
        type: String,
        default: "Welcome...",
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
        throw new Error(error);
    }
}

ConversationSchema.statics.getAllConversationByConList = async (conversationIdList, userId) => {
    const conversations = await this.Conversation.aggregate([
        {
            '$match': {
                '_id': {
                    '$in': [...conversationIdList]
                }
            }
        }, {
            '$addFields': {
                'members': {
                    '$map': {
                        'input': '$members',
                        'in': {
                            'userId': {
                                '$toObjectId': '$$this'
                            }
                        }
                    }
                }
            }
        }, {
            '$lookup': {
                'from': 'users',
                'localField': 'members.userId',
                'foreignField': '_id',
                'as': 'userInfo'
            }
        }, {
            '$project': {
                '_id': 1,
                'displayName': 1,
                'creatorId': 1,
                'text': 1,
                'time': 1,
                'image': 1,
                'members': {
                    '$map': {
                        'input': '$members',
                        'as': 'member',
                        'in': {
                            '$mergeObjects': [
                                '$$member', {
                                    '$first': {
                                        '$filter': {
                                            'input': '$userInfo',
                                            'cond': {
                                                '$eq': [
                                                    '$$this._id', '$$member.userId'
                                                ]
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }, {
            '$lookup': {
                'from': 'messages',
                'localField': '_id',
                'foreignField': 'conversationId',
                'as': 'messages'
            }
        }, {
            '$addFields': {
                'unreadCount': {
                    '$size': {
                        '$filter': {
                            'input': '$messages',
                            'as': 'message',
                            'cond': {
                                '$cond': [
                                    {
                                        '$gt': [
                                            {
                                                '$size': {
                                                    '$setIntersection': [
                                                        [mongoose.Types.ObjectId(userId)], '$$message.readBy'
                                                    ]
                                                }
                                            }, 0
                                        ]
                                    }, false, true
                                ]
                            }
                        }
                    }
                },
                "messages": "$$REMOVE"
            }
        }
    ]);
    // console.log("conversations : " + conversations)
    return conversations;
}

module.exports.Conversation = mongoose.model('conversation', ConversationSchema);