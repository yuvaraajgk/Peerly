const express = require('express')
const router = express.Router()
const messagingController = require('../controllers/messagingController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/conversations', authMiddleware, messagingController.getConversations)
router.post('/conversations', authMiddleware, messagingController.getOrCreateConversation)
router.delete('/conversations/:conversationId', authMiddleware, messagingController.deleteConversation)
router.get('/conversations/:conversationId/messages', authMiddleware, messagingController.getMessages)
router.post('/messages', authMiddleware, messagingController.sendMessage)

module.exports = router
