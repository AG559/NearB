const express = require('express');
const { signInGet, signInPost, signUpGet, signUpPost, signOutGet } = require('../controllers/authController');
const router = express.Router();
router.get('/sign-up', signUpGet)
router.get('/sign-in', signInGet)
router.post('/sign-up', signUpPost)
router.post('/sign-in', signInPost)
router.get('/sign-out', signOutGet)

module.exports = router;