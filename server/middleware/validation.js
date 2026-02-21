const { body, validationResult } = require('express-validator')

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

const validateSignup = [
  body('email')
    .isEmail()
    .withMessage('Valid email required')
    .custom((value) => {
      const collegeDomain = process.env.COLLEGE_EMAIL_DOMAIN || '@college.edu'
      if (!value.endsWith(collegeDomain)) {
        throw new Error(`Email must be from ${collegeDomain}`)
      }
      return true
    }),
  body('displayName').trim().isLength({ min: 2, max: 100 }).withMessage('Display name must be 2-100 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors,
]

const validateLogin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors,
]

const validateItem = [
  body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('categoryId').isInt().withMessage('Valid category ID required'),
  body('condition').optional().isIn(['New', 'Like New', 'Good', 'Acceptable']).withMessage('Invalid condition'),
  body('itemAge').optional().trim(),
  body('priceSale').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('priceRentDaily').optional().isFloat({ min: 0 }).withMessage('Rental price must be positive'),
  body('isForSale').isBoolean().withMessage('isForSale must be boolean'),
  body('isForRent').isBoolean().withMessage('isForRent must be boolean'),
  handleValidationErrors,
]

module.exports = {
  validateSignup,
  validateLogin,
  validateItem,
  handleValidationErrors,
}
