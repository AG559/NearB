const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
const userScheme = mongoose.Schema({
    socketId: {
        type: String,
    },
    name: {
        type: String,
        required: [true, "Please Enter username"]
    },
    imageUrl: {
        type: String,
        default: "https://images.unsplash.com/photo-1525550557089-27c1bfedd06c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"
    },
    email: {
        type: String,
        required: [true, 'Please Enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Email is invalid']
    },
    password: {
        type: String,
        required: [true, 'Please Enter an password'],
        minLength: [6, 'minimum password is 6']
    },
    conversations: {
        type: [],
        default: []
    },
    lastActive: {
        type: String
    },
    status: {
        type: String,
        default: "Online"
    }
})

userScheme.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

userScheme.statics.login = async function (email, password) {
    const user = await this.findOne({ email });
    if (user) {
        const isValid = await bcrypt.compare(password, user.password);
        if (isValid) {
            return user;
        } else {
            throw Error('Incorrect Password')
        }
    } else {
        throw Error('Incorrect Email')
    }
}

module.exports.User = mongoose.model('user', userScheme);