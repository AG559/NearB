const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

app.use(express.static('public'))
app.use(express.json())

app.set('view engine', 'ejs');

const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const conversationRoute = require('./routes/conversationRoute');
const messageRoute = require('./routes/messageRoute');
const { Conversation } = require('./models/conversation');
const { Message } = require('./models/message');
const { createConversation, getConversation } = require('./controllers/conversationController')


// Middleware
const { checkUser } = require('./middleware/authWare');
const { errorHandler } = require('./middleware/errorHandler');
const { isValidJwt, getLocalTime } = require('./utils/global');
const { User } = require('./models/user');



// Testing Route
app.get('/test', async (req, res) => {
    const { userId } = req.body;
    var currentTime = getLocalTime();
    try {
        //use testingSocketId
        const user = await User.findOneAndUpdate({ "_id": mongoose.Types.ObjectId(userId) }, { "lastActive": currentTime, "socketId": 'testingSocketId', "status": "Online" }, { new: true });
        console.log("conversation size :" + user["conversations"].length);
        var result = await Conversation.getAllConversationByConList(user["conversations"], userId);
        console.log("result size : " + result.length)
        res.send(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error);
    }
});


// Routes
app.use(authRoute);
app.use("/users", checkUser, userRoute);
app.use("/conversations", checkUser, conversationRoute);
app.use(checkUser, messageRoute);

app.use(errorHandler);

io.use(async (socket, next) => {
    console.log(socket.handshake.auth);
    var token = socket.handshake.auth.token;
    if (isValidJwt(token)) {
        next();
    } else {
        next(new Error("Handshake auth Underfined"))
    }
})

io.on('connection', async (socket) => {
    socket.on('start', async (userId) => {
        var currentTime = getLocalTime();
        const user = await User.findOneAndUpdate({ "_id": mongoose.Types.ObjectId(userId) }, { "lastActive": currentTime, "socketId": socket.id, "status": "Online" }, { new: true })
        io.emit("statusChange", { "userId": user._id, "status": user.status, "lastActive": user.lastActive })
        try {
            const conversations = await Conversation.getAllConversationByConList(user['conversations'], userId);
            conversations.forEach(chat => {
                socket.join(chat._id.toString())
            })
            socket.emit('init', conversations)
        } catch (error) {
            console.log(error);
        }
    })

    socket.on('refreshConversation', async (userId) => {
        try {
            const conversations = await Conversation.getAllConversationByUser(userId);
            socket.emit('init', conversations)
        } catch (error) {
            console.log(error);
        }
    })

    socket.on('join', async (chat) => {
        console.log(chat);
        await Message.updateMany({ "conversationId": mongoose.Types.ObjectId(chat._id) }, { "$addToSet": { "readBy": mongoose.Types.ObjectId(chat.joinedBy) } });
        const messages = await Message.find({ "conversationId": mongoose.Types.ObjectId(chat._id) }).sort({ _id: -1 });
        socket.join(chat._id.toString());
        //group read may be not work cause readByFriend while refractor
        socket.emit('joined', { "messages": messages, "conversationId": chat._id });
        if (messages.length > 0) {
            io.to(chat._id).emit('read', { "message": messages[0] })
        }
        // var allSockets = io.of("/").sockets;
        // for (const [_, socket] of allSockets) {
        //     if (membersSockets.includes(socket.id)) {
        //         console.log("Same socket is " + socket.id)
        //         socket.join(chat._id.toString())
        //     }
        // }
    })

    socket.on("disconnect", async (reason) => {
        var currentTime = getLocalTime()
        User.findOneAndUpdate({ "socketId": socket.id }, { "lastActive": currentTime, "status": "Offline" }, { new: true }, (err, user) => {
            if (err) {
                console.log(err);
                return;
            } else {
                try {
                    console.log(user);
                    io.emit("statusChange", { "userId": user._id, "status": user.status, "lastActive": user.lastActive })
                    console.log("Disconnect " + socket.id + reason)
                } catch (error) {
                    console.log(error.message)
                }
            }

        })


    })

    socket.on("read", async (data) => {
        const { _id, readBy } = data;
        const message = await Message.findOneAndUpdate({ "_id": _id }, { $addToSet: { "readBy": mongoose.Types.ObjectId(readBy) } }, { new: true });
        io.to(message.conversationId.toString()).emit("read", { message })
    })

    // Message Uplod to database
    socket.on('message', async (msg) => {
        const { conversationId, sender, senderName, text, time } = msg;
        console.log("conversationId...." + conversationId);
        var result = await Message.create({ conversationId, sender, text, "readBy": [mongoose.Types.ObjectId(sender)], time });
        const conversation = await Conversation.findOneAndUpdate({ "_id": conversationId }, { "text": text, "time": time });
        if (conversation) {
            result._doc.senderName = senderName;
            io.to(conversationId).emit("message", result);
            // socket.broadcast.in(conversationId).emit("notifyMessage", result);
        }
    })

})

const start = (url) => {
    mongoose.connect(url).then(result => {
        server.listen(3000, () => {
            console.log('Server is listening at 3000...')
        })
    }).catch(err => {
        console.log(err)
    })
}


const localStart = () => {
    mongoose.connect("mongodb://localhost:27017/testingdb", { useNewUrlParser: true }).then(client => {
        server.listen(3000, () => {
            console.log('Server is listening at 3000...')
        })
    })
}
localStart()