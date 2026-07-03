const { supabase } = require('../config/db')

// Postgres TIMESTAMP columns (no time zone) come back from Supabase without a
// 'Z'/offset suffix (e.g. "2026-07-03T19:06:27.038874"), even though the value
// is UTC. Without an explicit marker, JS `new Date(...)` parses it as local
// time on the client, shifting every displayed time by the viewer's UTC offset.
const toUtcIso = (ts) => {
  if (!ts) return ts
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(ts) ? ts : `${ts}Z`
}

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.user_id

    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        *,
        items:item_id (
          title
        ),
        user1:user1_id (
          display_name
        ),
        user2:user2_id (
          display_name
        )
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (conversationsError) {
      console.error('Supabase get conversations error:', conversationsError)
      return res.status(500).json({ message: 'Failed to fetch conversations' })
    }

    const conversationsWithDetails = await Promise.all(
      (conversationsData || []).map(async (conv) => {
        const item = Array.isArray(conv.items) ? conv.items[0] : conv.items
        const user1 = Array.isArray(conv.user1) ? conv.user1[0] : conv.user1
        const user2 = Array.isArray(conv.user2) ? conv.user2[0] : conv.user2

        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('message_content, sent_at')
          .eq('conversation_id', conv.conversation_id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single()

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.conversation_id)
          .neq('sender_id', userId)
          .eq('read_status', false)

        const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
        const otherUserName = conv.user1_id === userId ? user2?.display_name : user1?.display_name

        return {
          conversationId: conv.conversation_id,
          itemId: conv.item_id,
          itemTitle: item?.title || null,
          thumbnail: null,
          otherUserId,
          otherUserName: otherUserName || null,
          lastMessage: lastMessageData?.message_content || null,
          lastMessageTime: toUtcIso(lastMessageData?.sent_at) || null,
          unreadCount: unreadCount || 0,
          createdAt: toUtcIso(conv.created_at),
        }
      })
    )

    conversationsWithDetails.sort((a, b) => {
      if (!a.lastMessageTime) return 1
      if (!b.lastMessageTime) return -1
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    })

    res.json({ conversations: conversationsWithDetails })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ message: 'Failed to fetch conversations' })
  }
}

exports.getOrCreateConversation = async (req, res) => {
  try {
    const { itemId, otherUserId } = req.body
    const userId = req.user.user_id

    if (userId === otherUserId) {
      return res.status(400).json({ message: 'You cannot message yourself' })
    }

    // lower id = user1 for dedup
    const user1Id = Math.min(userId, otherUserId)
    const user2Id = Math.max(userId, otherUserId)

    const { data: existingConv, error: checkError } = await supabase
      .from('conversations')
      .select('conversation_id')
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .eq('item_id', itemId)
      .single()

    let conversationId

    if (existingConv && !checkError) {
      conversationId = existingConv.conversation_id
    } else {
      const { data: newConv, error: insertError } = await supabase
        .from('conversations')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          item_id: itemId,
        })
        .select('conversation_id')
        .single()

      if (insertError) {
        console.error('Supabase conversation insert error:', insertError)
        return res.status(500).json({ message: 'Failed to create conversation' })
      }

      conversationId = newConv.conversation_id
    }

    res.json({ conversationId })
  } catch (error) {
    console.error('Get or create conversation error:', error)
    res.status(500).json({ message: 'Failed to create conversation' })
  }
}

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.user_id

    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_id', conversationId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    if (convError || !convData) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        users:sender_id (
          display_name
        )
      `)
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true })

    if (messagesError) {
      console.error('Supabase get messages error:', messagesError)
      return res.status(500).json({ message: 'Failed to fetch messages' })
    }

    await supabase
      .from('messages')
      .update({ read_status: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read_status', false)

    const messages = (messagesData || []).map((msg) => {
      const sender = Array.isArray(msg.users) ? msg.users[0] : msg.users
      return {
        messageId: msg.message_id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderName: sender?.display_name || null,
        messageContent: msg.message_content,
        sentAt: toUtcIso(msg.sent_at),
        readStatus: msg.read_status,
      }
    })

    res.json({ messages })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ message: 'Failed to fetch messages' })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, messageContent } = req.body
    const senderId = req.user.user_id

    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_id', conversationId)
      .or(`user1_id.eq.${senderId},user2_id.eq.${senderId}`)
      .single()

    if (convError || !convData) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const { data: messageData, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message_content: messageContent,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Supabase message insert error:', insertError)
      return res.status(500).json({ message: 'Failed to send message' })
    }

    const io = req.app.get('io')
    if (io) {
      io.to(`conversation-${conversationId}`).emit('new-message', {
        messageId: messageData.message_id,
        conversationId: messageData.conversation_id,
        senderId: messageData.sender_id,
        messageContent: messageData.message_content,
        sentAt: toUtcIso(messageData.sent_at),
      })
    }

    res.status(201).json({
      message: {
        messageId: messageData.message_id,
        conversationId: messageData.conversation_id,
        senderId: messageData.sender_id,
        messageContent: messageData.message_content,
        sentAt: toUtcIso(messageData.sent_at),
        readStatus: messageData.read_status,
      },
    })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ message: 'Failed to send message' })
  }
}

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.user_id

    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('conversation_id', conversationId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    if (convError || !convData) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('conversation_id', conversationId)

    if (deleteError) {
      console.error('Supabase delete conversation error:', deleteError)
      return res.status(500).json({ message: 'Failed to delete conversation' })
    }

    res.json({ message: 'Conversation deleted successfully' })
  } catch (error) {
    console.error('Delete conversation error:', error)
    res.status(500).json({ message: 'Failed to delete conversation' })
  }
}
