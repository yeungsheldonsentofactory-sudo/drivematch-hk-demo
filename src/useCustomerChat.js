import { useCallback, useEffect, useState } from 'react'
import { ensureVisitorSession, supabase } from './lib/supabase'

const storageKey = (visitorId) => `apex-chat-conversation:${visitorId}`

const toDisplayMessage = (message, visitorId) => ({
  id: message.id,
  from: message.sender_id === visitorId ? 'buyer' : 'agent',
  body: message.body,
  createdAt: message.created_at,
})

export function useCustomerChat({ enabled, subject }) {
  const [conversationId, setConversationId] = useState('')
  const [visitorId, setVisitorId] = useState('')
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const addMessage = useCallback((nextMessage, currentVisitorId) => {
    const displayMessage = toDisplayMessage(nextMessage, currentVisitorId)
    setMessages((current) => current.some((item) => item.id === displayMessage.id) ? current : [...current, displayMessage])
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    let channel

    const connect = async () => {
      setStatus('connecting')
      setError('')
      try {
        // Earlier preview builds stored simulated replies under this key.
        // Remove it once so only database-backed messages can be displayed.
        localStorage.removeItem('apex-chat')
        const session = await ensureVisitorSession()
        if (!active || !session?.user) return
        const id = session.user.id
        setVisitorId(id)
        const savedConversationId = localStorage.getItem(storageKey(id))
        let conversation

        if (savedConversationId) {
          const { data } = await supabase.from('chat_conversations').select('id').eq('id', savedConversationId).maybeSingle()
          conversation = data
        }

        if (!conversation) {
          const { data, error: conversationError } = await supabase.from('chat_conversations').insert({ visitor_id: id, subject }).select('id').single()
          if (conversationError) throw conversationError
          conversation = data
          localStorage.setItem(storageKey(id), conversation.id)
        }

        const { data: existingMessages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('id, sender_id, body, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })
        if (messagesError) throw messagesError
        if (!active) return

        setConversationId(conversation.id)
        setMessages((existingMessages || []).map((item) => toDisplayMessage(item, id)))
        setStatus('ready')
        channel = supabase
          .channel(`customer-chat:${conversation.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversation.id}` }, (payload) => addMessage(payload.new, id))
          .subscribe()
      } catch (connectionError) {
        if (!active) return
        setStatus('error')
        setError(connectionError.message || '未能連接客服系統，請稍後再試。')
      }
    }

    connect()
    return () => {
      active = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [addMessage, enabled, subject])

  const send = useCallback(async (event) => {
    event.preventDefault()
    const body = message.trim()
    if (!body || !conversationId || !visitorId || status !== 'ready') return
    setStatus('sending')
    setError('')
    const { data, error: sendError } = await supabase
      .from('chat_messages')
      .insert({ conversation_id: conversationId, sender_id: visitorId, body })
      .select('id, sender_id, body, created_at')
      .single()
    if (sendError) {
      setError(sendError.message || '訊息未能送出，請再試一次。')
    } else {
      addMessage(data, visitorId)
      setMessage('')
    }
    setStatus('ready')
  }, [addMessage, conversationId, message, status, visitorId])

  return { conversationId, messages, message, setMessage, send, status, error }
}
