'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/common/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { io, Socket } from 'socket.io-client'

interface Conversation {
  conversationId: number
  itemId: number | null
  itemTitle: string | null
  otherUserId: number
  otherUserName: string
  lastMessage: string | null
  lastMessageTime: string | null
  unreadCount: number
}

interface Message {
  messageId: number
  senderId: number
  senderName: string
  messageContent: string
  sentAt: string
  readStatus: boolean
}

// Helper function to format date like WhatsApp
const formatDateSeparator = (date: Date): string => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Reset time to compare only dates
  const messageDate = new Date(date)
  messageDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)
  
  if (messageDate.getTime() === today.getTime()) {
    return 'Today'
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  } else {
    // Format as "Day, Month Date, Year" (e.g., "Monday, January 15, 2024")
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

// Helper function to check if two dates are on different days
const isDifferentDay = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  return d1.getTime() !== d2.getTime()
}

export default function MessagesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContactRecommendation, setShowContactRecommendation] = useState(false)
  const [isNewConversation, setIsNewConversation] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Initialize Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000')
    setSocket(newSocket)

    fetchConversations()

    // Check if we need to create a conversation
    const itemId = searchParams.get('itemId')
    const sellerId = searchParams.get('sellerId')
    if (itemId && sellerId) {
      createOrGetConversation(parseInt(itemId), parseInt(sellerId))
    }

    return () => {
      newSocket.close()
    }
  }, [user, router, searchParams])

  useEffect(() => {
    if (socket && selectedConversation) {
      socket.emit('join-conversation', selectedConversation)
      
      socket.on('new-message', (data: Message) => {
        if (data.conversationId === selectedConversation) {
          // Check if message already exists to prevent duplicates
          setMessages((prev) => {
            const exists = prev.some(msg => msg.messageId === data.messageId)
            if (exists) return prev
            return [...prev, data]
          })
        }
      })
    }

    return () => {
      if (socket && selectedConversation) {
        socket.off('new-message')
      }
    }
  }, [socket, selectedConversation])

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations')
      setConversations(response.data.conversations)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const createOrGetConversation = async (itemId: number, otherUserId: number) => {
    // Prevent users from messaging themselves
    if (user && user.userId === otherUserId) {
      toast.error('You cannot message yourself')
      return
    }

    try {
      const response = await api.post('/messages/conversations', { itemId, otherUserId })
      const { conversationId } = response.data
      setSelectedConversation(conversationId)
      setIsNewConversation(true)
      setShowContactRecommendation(true)
      fetchMessages(conversationId)
      fetchConversations()
      // Success - no error toast needed
    } catch (error: any) {
      // Only show error toast for actual errors (not 2xx status codes)
      const status = error.response?.status
      if (status && status >= 400) {
        toast.error(error.response?.data?.message || 'Failed to start conversation')
      }
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`)
      setMessages(response.data.messages)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversation(conversationId)
    setIsNewConversation(false)
    setShowContactRecommendation(false)
    fetchMessages(conversationId)
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessageText(value)
    
    // Show recommendation if message contains "contact" (case insensitive)
    if (value.toLowerCase().includes('contact')) {
      setShowContactRecommendation(true)
    }
  }

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return

    const messageContent = messageText.trim()
    setMessageText('') // Clear input immediately for better UX
    setIsNewConversation(false) // After first message, it's no longer new
    setShowContactRecommendation(false) // Hide recommendation after sending

    try {
      await api.post('/messages/messages', {
        conversationId: selectedConversation,
        messageContent,
      })
      // Don't add message here - let socket handle it to prevent duplicates
      fetchConversations()
    } catch (error) {
      toast.error('Failed to send message')
      setMessageText(messageContent) // Restore message on error
    }
  }

  const insertContactSuggestion = () => {
    const suggestion = "Can you please share your contact number?"
    setMessageText(suggestion)
    setShowContactRecommendation(false)
  }

  const handleDeleteConversation = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the conversation when clicking delete
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/messages/conversations/${conversationId}`)
      toast.success('Conversation deleted')
      
      // Remove conversation from list
      setConversations(prev => prev.filter(conv => conv.conversationId !== conversationId))
      
      // If deleted conversation was selected, clear selection
      if (selectedConversation === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete conversation')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Messages</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
          <div className="grid grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r border-surface overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.conversationId}
                    className={`group relative border-b border-surface hover:bg-surface transition-colors ${
                      selectedConversation === conv.conversationId ? 'bg-secondary/20' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleSelectConversation(conv.conversationId)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-text-primary pr-8">
                          {conv.otherUserName && conv.itemTitle 
                            ? `${conv.otherUserName} - ${conv.itemTitle}`
                            : conv.otherUserName || conv.itemTitle || 'Unknown'}
                        </h3>
                        <div className="flex items-center gap-2">
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-white text-xs rounded-full px-2 py-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary truncate">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.conversationId, e)}
                      className="absolute top-4 right-4 p-1 text-text-secondary hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete conversation"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Messages Area */}
            <div className="col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="border-b border-surface p-4 bg-white">
                    <h2 className="font-semibold text-text-primary">
                      {(() => {
                        const conv = conversations.find(c => c.conversationId === selectedConversation)
                        if (!conv) return 'Chat'
                        return conv.otherUserName && conv.itemTitle 
                          ? `${conv.otherUserName} - ${conv.itemTitle}`
                          : conv.otherUserName || conv.itemTitle || 'Chat'
                      })()}
                    </h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Contact Recommendation Box */}
                    {showContactRecommendation && (
                      <div className="mb-4 flex justify-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm text-blue-800 font-medium">💡 Suggestion</p>
                            <p className="text-xs text-blue-700 mt-1">Ask for contact number</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={insertContactSuggestion}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              Use
                            </button>
                            <button
                              onClick={() => setShowContactRecommendation(false)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {messages.map((msg, index) => {
                      const msgDate = new Date(msg.sentAt)
                      const prevMsgDate = index > 0 ? new Date(messages[index - 1].sentAt) : null
                      const showDateSeparator = !prevMsgDate || isDifferentDay(msgDate, prevMsgDate)
                      
                      return (
                        <div key={msg.messageId}>
                          {showDateSeparator && (
                            <div className="flex justify-center my-4">
                              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                {formatDateSeparator(msgDate)}
                              </div>
                            </div>
                          )}
                          <div
                            className={`flex ${
                              msg.senderId === user?.userId ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                msg.senderId === user?.userId
                                  ? 'bg-primary text-white'
                                  : 'bg-surface text-text-primary'
                              }`}
                            >
                              <p className="text-sm">{msg.messageContent}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.senderId === user?.userId ? 'text-white/70' : 'text-text-secondary'
                                }`}
                              >
                                {msgDate.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t border-surface p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={handleMessageChange}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        onClick={sendMessage}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-secondary">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
