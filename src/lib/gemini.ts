/**
 * Estimate calories for a meal description using the Gemini API.
 * Requires VITE_GEMINI_API_KEY in .env
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const PROMPT = `You are a nutrition assistant. Given a short description of what someone ate, estimate the total calories.
Reply with ONLY a number (no units, no explanation). If the description is vague or unclear, give your best estimate.
Examples: "two eggs and toast" -> 350, "large salad with chicken" -> 450

What they ate: `

export async function estimateCalories(mealDescription: string): Promise<number> {
  const key = GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error('Gemini API key is not configured. Add VITE_GEMINI_API_KEY to .env')
  }

  const text = PROMPT + (mealDescription.trim() || 'nothing specified')
  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        maxOutputTokens: 20,
        temperature: 0.2,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`)
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const output =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
  const match = output.replace(/,/g, '').match(/\d+/)
  const calories = match ? Math.max(0, Math.min(5000, parseInt(match[0], 10))) : 0
  return calories
}
