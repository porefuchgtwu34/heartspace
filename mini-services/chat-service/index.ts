import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path — Caddy uses it to route to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Online users keyed by userId
const onlineUsers = new Map<string, { socketId: string; username: string }>()

interface OutgoingMessage {
  id: string
  conversationId: string
  senderId: string
  senderUsername: string
  content: string
  createdAt: string
}

io.on('connection', (socket) => {
  console.log(`[chat] connected: ${socket.id}`)

  socket.on('identify', (payload: { userId: string; username: string }) => {
    if (!payload?.userId) return
    onlineUsers.set(payload.userId, { socketId: socket.id, username: payload.username })
    socket.data.userId = payload.userId
    socket.data.username = payload.username
    // broadcast presence
    io.emit('presence', {
      userId: payload.userId,
      username: payload.username,
      online: true,
    })
  })

  // Join a conversation room (room = conversationId)
  socket.on('join-conversation', (conversationId: string) => {
    if (conversationId) socket.join(`conv:${conversationId}`)
  })

  socket.on('leave-conversation', (conversationId: string) => {
    if (conversationId) socket.leave(`conv:${conversationId}`)
  })

  // Real-time message broadcast (the sender already persisted via REST)
  socket.on('send-message', (payload: OutgoingMessage) => {
    io.to(`conv:${payload.conversationId}`).emit('receive-message', payload)
  })

  // Typing indicator
  socket.on('typing', (payload: { conversationId: string; userId: string; username: string; isTyping: boolean }) => {
    socket.to(`conv:${payload.conversationId}`).emit('typing', payload)
  })

  // Notify a specific user (e.g. new conversation, match)
  socket.on('notify-user', (payload: { userId: string; type: string; title: string; body: string }) => {
    const target = onlineUsers.get(payload.userId)
    if (target) {
      io.to(target.socketId).emit('notification', payload)
    }
  })

  // Presence request — client asks who's online
  socket.on('request-presence', (userIds: string[]) => {
    const result: Record<string, boolean> = {}
    userIds.forEach((id) => {
      result[id] = onlineUsers.has(id)
    })
    socket.emit('presence-batch', result)
  })

  socket.on('disconnect', () => {
    const userId = socket.data.userId as string | undefined
    if (userId) {
      onlineUsers.delete(userId)
      io.emit('presence', { userId, username: socket.data.username, online: false })
    }
    console.log(`[chat] disconnected: ${socket.id}`)
  })

  socket.on('error', (err) => {
    console.error(`[chat] socket error (${socket.id}):`, err)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`♥ HeartSpace chat service running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('[chat] SIGTERM, shutting down...')
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  console.log('[chat] SIGINT, shutting down...')
  httpServer.close(() => process.exit(0))
})
