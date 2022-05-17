
const { Message } = require("../models/message");
const { Conversation } = require("../models/conversation");

const createMessage = async (req, res) => {
    const { conversationId, sender, time, text } = req.body;
    const message = await Message.create({ conversationId, sender, time, text });
    res.status(200).json(message);
}

const getMessage = async (req, res) => {
    const { conversationId, mesageLoaderId } = req.params.id;
    Conversation.findOneAndUpdate({ "_id": conversationId }, { $push: { "readBy": "aa" } })
    const messages = await Message.find({ "conversationId": conversationId }).sort({ _id: -1 });
    res.status(200).json({ messages });
}

module.exports = {
    createMessage,
    getMessage
}