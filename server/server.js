require('dotenv').config({ path: '.env.local' })
const express = require('express')
const cors = require('cors')
const http = require('http')
const socketIo = require('socket.io')
const path = require('path')
const fs = require('fs')

const authRoutes = require('./routes/authRoutes')
const itemRoutes = require('./routes/itemRoutes')
const orderRoutes = require('./routes/orderRoutes')
const messageRoutes = require('./routes/messageRoutes')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json({ limit: '10mb' })) // base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`)
  })

  socket.on('send-message', async (data) => {
    io.to(`conversation-${data.conversationId}`).emit('new-message', data)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

app.set('io', io)

app.use('/api/auth', authRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/messages', messageRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
