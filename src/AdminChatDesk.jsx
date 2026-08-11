import { useEffect, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { supabase } from './lib/supabase'

const formatTime = (value) => new Intl.DateTimeFormat('zh-HK', { hour: '2-digit', minute: '2-digit', month: 'numeric', day: 'numeric' }).format(new Date(value))

export default function AdminChatDesk() {
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [messages, setMessages] = useState([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [reply, setReply] = useState('')
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)

  const loadConversations = async () => {
    const { data, error } = await supabase.from('chat_conversations').select('id, subject, status, created_at, updated_at').order('updated_at', { ascending: false })
    if (error) { setNotice(`未能讀取客服對話：${error.message}`); return }
    setConversations(data || [])
    setSelectedId((current) => current || data?.[0]?.id || '')
  }

  const loadMessages = async (conversationId) => {
    if (!conversationId) { setMessages([]); return }
    const { data, error } = await supabase.from('chat_messages').select('id, sender_id, body, created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true })
    if (error) setNotice(`未能讀取訊息：${error.message}`)
    else setMessages(data || [])
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || ''))
    loadConversations()
  }, [])

  useEffect(() => { loadMessages(selectedId) }, [selectedId])

  useEffect(() => {
    const channel = supabase
      .channel(`admin-support-inbox:${selectedId || 'none'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, loadConversations)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        loadConversations()
        if (payload.new.conversation_id === selectedId) setMessages((current) => current.some((item) => item.id === payload.new.id) ? current : [...current, payload.new])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedId])

  const sendReply = async (event) => {
    event.preventDefault()
    const body = reply.trim()
    if (!body || !selectedId || !currentUserId) return
    setSending(true)
    setNotice('')
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ conversation_id: selectedId, sender_id: currentUserId, body })
      .select('id, sender_id, body, created_at')
      .single()
    if (error) setNotice(`回覆失敗：${error.message}`)
    else {
      setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, data])
      setReply('')
      await loadConversations()
    }
    setSending(false)
  }

  const selectedConversation = conversations.find((item) => item.id === selectedId)
  return <section className="admin-chat-desk" aria-labelledby="support-inbox-title">
    <header><div><span className="eyeline">真實客服</span><h2 id="support-inbox-title">客戶對話</h2></div><b>{conversations.length}</b></header>
    <div className="admin-chat-layout">
      <div className="admin-conversation-list" aria-label="客服對話列表">
        {conversations.length === 0 ? <p>暫未收到客戶訊息。</p> : conversations.map((conversation) => <button key={conversation.id} className={conversation.id === selectedId ? 'selected' : ''} onClick={() => setSelectedId(conversation.id)}><MessageCircle size={15}/><span><strong>{conversation.subject || '網站查詢'}</strong><small>{formatTime(conversation.updated_at)}</small></span></button>)}
      </div>
      <div className="admin-chat-thread">
        {selectedConversation ? <><div className="admin-chat-thread-head"><strong>{selectedConversation.subject || '網站查詢'}</strong><small>{selectedConversation.status === 'closed' ? '已結束' : '進行中'}</small></div><div className="admin-chat-log" aria-live="polite">{messages.map((item) => <p className={item.sender_id === currentUserId ? 'staff' : 'visitor'} key={item.id}><span>{item.body}</span><small>{formatTime(item.created_at)}</small></p>)}</div><form onSubmit={sendReply}><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="以客服身份回覆…" aria-label="客服回覆訊息"/><button disabled={sending || !reply.trim()} aria-label="發送客服回覆">{sending ? '…' : <Send size={17}/>}</button></form></> : <p className="admin-chat-empty">選擇一個客戶對話以開始回覆。</p>}
      </div>
    </div>
    {notice && <p className="admin-chat-notice" role="alert">{notice}</p>}
  </section>
}
