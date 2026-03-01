import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const GEMINI_MODEL = 'gemini-2.5-flash'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const geminiKey = env.VITE_GOOGLE_GEMINI_API_KEY || process.env.VITE_GOOGLE_GEMINI_API_KEY

  return {
  plugins: [
    react(),
    {
      name: 'gemini-api-proxy',
      configureServer(server) {
        const key = geminiKey
        const geminiUrl = (path) =>
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key || '')}`

        server.middlewares.use(async (req, res, next) => {
          const isMood = req.url === '/api/mood-suggestion' && req.method === 'POST'
          const isChat = req.url === '/api/chat' && req.method === 'POST'
          if (!isMood && !isChat) return next()
          if (!key?.trim()) {
            res.statusCode = 503
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Gemini API key not configured' }))
            return
          }
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', async () => {
            try {
              if (isMood) {
                const { mood, moodLabel, context, whatOnMind } = JSON.parse(body || '{}')
                const prompt = `You are a warm, supportive assistant for new mothers. Based on this mood check-in, give one short, kind suggestion (2–3 sentences only). Do not give medical advice. If they seem in distress, gently suggest reaching out to a support line or professional. Keep the tone gentle and validating. Reply with only the suggestion, no quotes or preamble.

Mood (1–5): ${mood} (${moodLabel ?? 'Okay'})
What's affecting them: ${context || 'Not specified'}
What they wrote on their mind: ${whatOnMind || '(nothing)'}`

                const geminiRes = await fetch(geminiUrl(), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
                  }),
                })
                if (!geminiRes.ok) {
                  res.statusCode = 502
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: 'Gemini request failed', details: await geminiRes.text() }))
                  return
                }
                const data = await geminiRes.json()
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
                const suggestion = typeof text === 'string' ? text.trim() : null
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ suggestion }))
                return
              }

              if (isChat) {
                const { messages } = JSON.parse(body || '{}')
                const history = (Array.isArray(messages) ? messages : [])
                  .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
                  .map((m) => ({ role: m.role, content: m.content.trim() }))
                const sys = 'You are a professional, supportive assistant for new mothers. Answer questions about postpartum recovery, baby care, sleep, feeding, and self-care in a clear, informative way. Use a formal tone—avoid terms of endearment (e.g. sweetie, sweet mama, honey) and casual phrasing. Be kind and respectful without being overly familiar. Do not give medical advice; suggest talking to a doctor or provider when needed. Keep replies helpful and concise (a short paragraph unless they ask for more). If they seem in distress, suggest Postpartum Support International (postpartum.net) or their healthcare provider.'
                const convo = history.length
                  ? history.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
                  : 'User: Hello'
                const prompt = `${sys}\n\n---\n\n${convo}\n\nAssistant:`
                const geminiRes = await fetch(geminiUrl(), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
                  }),
                })
                const errText = await geminiRes.text()
                if (!geminiRes.ok) {
                  res.statusCode = 502
                  res.setHeader('Content-Type', 'application/json')
                  let errMsg = 'Chat request failed'
                  try {
                    const errJson = JSON.parse(errText)
                    errMsg = errJson?.error?.message || errJson?.error || errMsg
                  } catch {
                    if (errText && errText.length < 200) errMsg = errText
                  }
                  res.end(JSON.stringify({ error: errMsg }))
                  return
                }
                const data = JSON.parse(errText)
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
                const reply = typeof text === 'string' ? text.trim() : ''
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ reply }))
              }
            } catch (e) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(e?.message || e) }))
            }
          })
        })
      },
    },
  ],
  server: {
    port: 3000,
    open: true,
  },
  }
})
