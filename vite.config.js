import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GEMINI_MODEL = 'gemini-1.5-flash'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mood-suggestion-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== '/api/mood-suggestion' || req.method !== 'POST') {
            return next()
          }
          const key = process.env.VITE_GOOGLE_GEMINI_API_KEY
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
              const { mood, moodLabel, context, whatOnMind } = JSON.parse(body || '{}')
              const prompt = `You are a warm, supportive assistant for new mothers. Based on this mood check-in, give one short, kind suggestion (2–3 sentences only). Do not give medical advice. If they seem in distress, gently suggest reaching out to a support line or professional. Keep the tone gentle and validating. Reply with only the suggestion, no quotes or preamble.

Mood (1–5): ${mood} (${moodLabel ?? 'Okay'})
What's affecting them: ${context || 'Not specified'}
What they wrote on their mind: ${whatOnMind || '(nothing)'}`

              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
                  }),
                }
              )
              if (!geminiRes.ok) {
                const errText = await geminiRes.text()
                res.statusCode = 502
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Gemini request failed', details: errText }))
                return
              }
              const data = await geminiRes.json()
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
              const suggestion = typeof text === 'string' ? text.trim() : null
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ suggestion }))
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
})
