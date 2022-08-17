const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" }, pingTimeout: 1000, pingInterval: 1000 });

app.use(express.static('public'))
app.use(express.json())

app.set('view engine', 'ejs');

const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const conversationRoute = require('./routes/conversationRoute');
const messageRoute = require('./routes/messageRoute');
const { Conversation } = require('./models/conversation');
const { Message } = require('./models/message');
const { User } = require('./models/user');
const { getConversation } = require('./controllers/conversationController');


// Middleware
const { checkUser } = require('./middleware/authWare');
const { errorHandler } = require('./middleware/errorHandler');
const { isValidJwt, getLocalTime } = require('./utils/global');



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

    socket.on('join', async (chat) => {
        console.log("call join..........");
        var { _id, joinedBy, members, displayName } = chat;
        var isNew = false;
        var messages = [];
        var memberIds = [];
        var memberSockets = [];
        for (const [key, value] of Object.entries(members)) {
            memberIds.push(key)
            memberSockets.push(value)
        }

        //check Conversation
        if (_id == null) {
            var { conversation, isNew } = await getConversation({ "creatorId": joinedBy, "members": memberIds, "displayName": displayName })
            _id = conversation._id
            isNew = isNew
        }

        //Join with all sockets 
        var allSockets = io.of("/").sockets;
        for (const [_, socket] of allSockets) {
            if (memberSockets.includes(socket.id)) {
                console.log("Same socket is " + socket.id)
                socket.join(_id.toString())
            }
        }
        socket.join(_id.toString())

        //check isNew Conversation
        if (isNew) {
            var result = await Conversation.getAllConversationByConList([conversation._id])
            console.log(result)
            io.to(_id.toString()).emit("newConversation", result)
        } else {
            await Message.updateMany({ "conversationId": mongoose.Types.ObjectId(_id) }, { "$addToSet": { "readBy": mongoose.Types.ObjectId(joinedBy) } });
            messages = await Message.find({ "conversationId": mongoose.Types.ObjectId(_id) }).sort({ _id: -1 });
        }

        //Finish Joined emit
        socket.emit('joined', { "messages": messages, "conversationId": _id });
        if (messages.length > 0) {
            if (messages[0]['sender'] != joinedBy) {
                io.to(_id.toString()).emit('read', { "message": messages[0] })
            }
        }
    })

    socket.on("disconnect", async (reason) => {
        var currentTime = getLocalTime()
        User.findOneAndUpdate({ "socketId": socket.id }, { "lastActive": currentTime, "status": "Offline" }, { new: true }, (err, user) => {
            if (err) {
                console.log(err);
                return;
            } else {
                try {
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