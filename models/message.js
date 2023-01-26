const express = require('express');
const mongoose = require('mongoose');
const MessageScheme = mongoose.Schema(
    {
        _id: {
            type: String,
            required: [true, "Id is required"]
        },
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
        },
        isLiked: {
            type: Boolean,
            default: false,
        },
        time: {
            type: String,
            required: [true, 'Please Enter an time'],
            default: new Date()
        },
        readBy: {
            type: Array,
            required: [true, 'Must be provided one item']
        },
        type: {
            type: String,
            required: [true, 'Must be provided one type'],
            default: "text"
        },
        files: {
            type: Array,
            default: []
        }
    }
)
module.exports.Message = mongoose.model('message', MessageScheme);