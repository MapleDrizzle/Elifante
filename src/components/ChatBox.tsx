import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './ChatBox.css'

type Message = { role: 'user' | 'assistant'; content: string }

const CHAT_API = import.meta.env.VITE_CHAT_API_URL?.trim() || '/api/chat'

export default function ChatBox(): JSX.Element {
  const { t, i18n } = useTranslation()
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
          language: i18n.language || 'en',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages((prev) => prev.slice(0, -1))
        setError(data?.error || t('chatbox.somethingWrong'))
        setInput(text)
        return
      }
      const reply = typeof data?.reply === 'string' ? data.reply : t('chatbox.noReply')
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => prev.slice(0, -1))
      setError(t('chatbox.connectionError'))
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
        aria-label={open ? t('chatbox.closeChat') : t('chatbox.openChat')}
        aria-expanded={open}
      >
        <span className="chatbox-toggle-icon" aria-hidden>
          {open ? '✕' : '💬'}
        </span>
      </button>

      {open && (
        <div className="chatbox-backdrop" onClick={() => setOpen(false)} role="dialog" aria-label={t('chatbox.title')}>
          <div className="chatbox-panel chatbox-panel--float" onClick={(e) => e.stopPropagation()}>
          <div className="chatbox-header">
            <h3 className="chatbox-title">{t('chatbox.title')}</h3>
            <p className="chatbox-subtitle">{t('chatbox.subtitle')}</p>
          </div>

          <div className="chatbox-messages">
            {messages.length === 0 && (
              <p className="chatbox-placeholder">{t('chatbox.placeholder')}</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`chatbox-message chatbox-message--${m.role}`}>
                <span className="chatbox-message-role">{m.role === 'user' ? t('chatbox.you') : t('chatbox.assistant')}</span>
                <p className="chatbox-message-content">{m.content}</p>
              </div>
            ))}
            {loading && (
              <div className="chatbox-message chatbox-message--assistant">
                <span className="chatbox-message-role">{t('chatbox.assistant')}</span>
                <p className="chatbox-message-content chatbox-typing">{t('chatbox.thinking')}</p>
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
              placeholder={t('chatbox.inputPlaceholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              aria-label={t('chatbox.inputLabel')}
            />
            <button
              type="button"
              className="chatbox-send"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label={t('chatbox.sendLabel')}
            >
              {t('chatbox.sendLabel')}
            </button>
          </div>
          </div>
        </div>
      )}
    </>
  )
}
