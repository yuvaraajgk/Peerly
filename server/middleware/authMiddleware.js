const jwt = require('jsonwebtoken')
const { supabase } = require('../config/db')

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, college_email, display_name, username, is_verified')
      .eq('user_id', decoded.userId)
      .limit(1)
      .single()

    if (error || !users) {
      return res.status(401).json({ message: 'User not found' })
    }

    req.user = users
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    res.status(500).json({ message: 'Authentication error' })
  }
}

module.exports = authMiddleware
