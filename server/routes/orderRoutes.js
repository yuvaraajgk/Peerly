const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/', authMiddleware, orderController.createOrder)
router.get('/my', authMiddleware, orderController.getMyOrders)
router.delete('/:id', authMiddleware, orderController.deleteOrder)
router.patch('/:id/status', authMiddleware, orderController.updateTransactionStatus)

module.exports = router
