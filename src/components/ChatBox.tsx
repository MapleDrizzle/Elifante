import { useState, useRef, useEffect } from 'react'
import './ChatBox.css'

type Message = { role: 'user' | 'assistant'; content: string }

const CHAT_API = import.meta.env.VITE_CHAT_API_URL?.trim() || '/api/chat'

export default function ChatBox(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [messages])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)
    const userMessage: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    try {
      const newHistory = [...messages, userMessage]
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages((prev) => prev.slice(0, -1))
        setError(data?.error || 'Something went wrong')
        setInput(text)
        return
      }
      const reply = typeof data?.reply === 'string' ? data.reply : 'I couldn’t generate a reply. Try asking again.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => prev.slice(0, -1))
      setError('Connection error. Try again.')
      setInput(text)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <button
        type="button"
        className="chatbox-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat - ask a question'}
        aria-expanded={open}
      >
        <span className="chatbox-toggle-icon" aria-hidden>
          {open ? '✕' : '💬'}
        </span>
      </button>

      {open && (
        <div className="chatbox-backdrop" onClick={() => setOpen(false)} role="dialog" aria-label="Ask a question">
          <div className="chatbox-panel chatbox-panel--float" onClick={(e) => e.stopPropagation()}>
          <div className="chatbox-header">
            <h3 className="chatbox-title">Ask anything</h3>
            <p className="chatbox-subtitle">Postpartum, baby, sleep, or self-care — we’re here to help.</p>
          </div>

          <div className="chatbox-messages">
            {messages.length === 0 && (
              <p className="chatbox-placeholder">Type a question below. You can ask about feeding, sleep, how you’re feeling, or anything else.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chatbox-message chatbox-message--${m.role}`}>
                <span className="chatbox-message-role">{m.role === 'user' ? 'You' : 'Elifante'}</span>
                <p className="chatbox-message-content">{m.content}</p>
              </div>
            ))}
            {loading && (
              <div className="chatbox-message chatbox-message--assistant">
                <span className="chatbox-message-role">Elifante</span>
                <p className="chatbox-message-content chatbox-typing">Thinking…</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <p className="chatbox-error" role="alert">
              {error}
            </p>
          )}

          <div className="chatbox-input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="chatbox-input"
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              aria-label="Your question"
            />
            <button
              type="button"
              className="chatbox-send"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              Send
            </button>
          </div>
          </div>
        </div>
      )}
    </>
  )
}
