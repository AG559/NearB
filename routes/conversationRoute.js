const express = require('express');
const { createConversation } = require('../controllers/conversationController');
const router = express.Router();
router.post('/', createConversation);

module.exports = router;