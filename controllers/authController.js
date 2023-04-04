const { User } = require("../models/user");
const { IncorrectEmailError, IncorrectPasswordError, DuplicateEmailError } = require("../utils/errors");
const jwt = require('jsonwebtoken');

const maxAge = 1000 * 60 * 60 * 24;
const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: maxAge });

const handleError = (err) => {
    switch (true) {
        case err.message === 'Incorrect Email':
            throw new IncorrectEmailError();
        case err.message === 'Incorrect Password':
            throw new IncorrectPasswordError();
        case err.code === 11000:
            throw new DuplicateEmailError();
        case err.message.includes('user validation failed'):
            const error = { statusCode: 400 };
            Object.values(err.errors).forEach(({ properties }) => {
                error[properties.path] = properties.message;
            });
            throw error;
        default:
            throw err;
    }
};

const signInGet = (req, res) => res.render('login');
const signUpGet = (req, res) => res.render('signup');

const signUpPost = async (req, res) => {

    const { name, email, password } = req.body;
    try {
        const user = await User.create({ name, email, password, lastActive: new Date().toISOString() });
        const token = createToken(user._id);
        user.password = undefined;
        res.status(200).json({ token, user: user });
    } catch (err) {
        next()
    }
}

const signInPost = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const authUser = await User.login(email, password);
        authUser.password = undefined;
        const token = createToken(authUser._id);
        res.status(200).json({ token, user: authUser });
    } catch (err) {
        next()
    }


}

const signOutGet = async (req, res) => {
    var user = await User.
        res.status(200).json({ "message": "success" });
}

module.exports = {
    signInGet, signInPost, signUpGet, signUpPost, signOutGet,
}