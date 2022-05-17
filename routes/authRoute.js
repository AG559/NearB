const express = require('express');
const {login_get,login_post,signup_get,signup_post} = require('../controllers/authController');
const router = express.Router();
router.get('/signup',signup_get)
router.get('/login',login_get)
router.post('/signup',signup_post)
router.post('/login',login_post)

module.exports =router;