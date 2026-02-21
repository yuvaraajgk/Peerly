const express = require('express')
const router = express.Router()
const itemController = require('../controllers/itemController')
const authMiddleware = require('../middleware/authMiddleware')
const { validateItem } = require('../middleware/validation')

router.get('/categories', itemController.getCategories)
router.get('/', itemController.getItems)
router.get('/:id', itemController.getItem)
router.get('/my/listings', authMiddleware, itemController.getMyListings)

router.post(
  '/',
  authMiddleware,
  itemController.uploadImages,
  validateItem,
  itemController.createItem
)

router.patch('/:id/status', authMiddleware, itemController.updateItemStatus)
router.patch(
  '/:id',
  authMiddleware,
  itemController.uploadImages,
  validateItem,
  itemController.updateItem
)

module.exports = router
