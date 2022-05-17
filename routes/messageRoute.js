const express = require('express');
const router = express.Router();
const { createMessage, getMessage } = require('../controllers/messageController');
router.post('/message', createMessage);
router.get('./message/:id', getMessage);

module.exports = router;