const express = require('express');
const mongoose = require('mongoose');
const MessageScheme = mongoose.Schema(
    {
        conversationId: {
            required: [true, "Conversation Id is required"],
            type: mongoose.Types.ObjectId
        },
        sender: {
            type: String,
            required: [true, 'Sender Id is required'],
        },
        text: {
            type: String,
            required: [true, 'Message text is required'],
        },
        isLiked: {
            type: Boolean,
            default: false,
        },
        time: {
            type: String,
            required: [true, 'Please Enter an time'],
            default: new Date()
        }
    }
)
module.exports.Message = mongoose.model('message', MessageScheme);