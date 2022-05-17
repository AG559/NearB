const { User } = require("../models/user");
const jwt = require('jsonwebtoken');
const handleError = (err) => {
    console.log(err.message);

    const error = { 'email': '', 'password': '' };

    if (err.message == "Incorrect Email") {
        error['email'] = 'Email is not register';
        return error;
    }

    if (err.message == "Incorrect Password") {
        error['password'] = 'Password is Incorrect'
        return error;
    }

    // Duplicate error
    if (err.code === 11000) {
        error['email'] = 'Email is already Register'
        return error;
    }

    // Validator error
    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            error[properties.path] = properties.message;
        })
        return error;
    }
}
const maxAge = 1000 * 60 * 60 * 24;
const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: maxAge });

const login_get = (req, res) => res.render('login');
const signup_get = (req, res) => res.render('signup');

const signup_post = async (req, res) => {

    const { name, email, password } = req.body;
    try {
        const user = await User.create({ name, email, password, lastActive: new Date().toLocaleString('en-US', { hour12: false, hour: '2-digit', minute: 'numeric', second: '2-digit', year: 'numeric', month: '2-digit', 'day': 'numeric' }) });
        const token = createToken(user._id);
        user.password = undefined;
        res.status(201).json({ token, user: user });
    } catch (err) {
        const error = handleError(err);
        res.status(400).json({ error });
    }
}

const login_post = async (req, res) => {
    const { email, password } = req.body;
    try {
        const authUser = await User.login(email, password);
        authUser.password = undefined;
        const token = createToken(authUser._id);
        res.status(200).json({ token, user: authUser });
    } catch (err) {
        const error = handleError(err);
        res.status('400').json({ error });
    }
}
module.exports = {
    login_get,
    login_post,
    signup_get,
    signup_post
}