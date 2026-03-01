/**
 * Estimate calories for a meal description using the Gemini API.
 * Requires VITE_GEMINI_API_KEY in .env
 */

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ?? import.meta.env.VITE_GOOGLE_GEMINI_API_KEY
/** Use a model that supports generateContent (e.g. gemini-2.5-flash for new users). */
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const PROMPT = `You are a nutrition expert. Estimate the TOTAL calories for ONE typical adult portion/plate of this meal (the whole meal as eaten, not per 100g).
Reply with ONLY one number: the total calories. No words, no units, no ranges. Just digits.
Examples of one portion total calories:
- "butter chicken" (with sauce, typical serving) -> 500
- "butter chicken with rice" -> 650
- "two eggs and toast" -> 350
- "large salad with chicken" -> 450
- "pizza slice" -> 280
- "burger and fries" -> 800
Give one number only (total calories for one serving/plate): `

export async function estimateCalories(mealDescription: string): Promise<number> {
  const key = GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error('Gemini API key is not configured. Add VITE_GEMINI_API_KEY or VITE_GOOGLE_GEMINI_API_KEY to .env')
  }

  const text = PROMPT + (mealDescription.trim() || 'nothing specified')
  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        maxOutputTokens: 30,
        temperature: 0.1,
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
  const allNumbers = output.replace(/,/g, '').match(/\d+/g)
  let calories = 0
  if (allNumbers && allNumbers.length > 0) {
    const parsed = allNumbers.map((n) => parseInt(n, 10))
    // Prefer numbers in realistic meal range (100–2000) to avoid picking "50" from "50g protein" or similar
    const inRange = parsed.filter((n) => n >= 100 && n <= 2000)
    const candidate = inRange.length > 0 ? Math.round(inRange.reduce((a, b) => a + b, 0) / inRange.length) : parsed[0]
    calories = Math.max(0, Math.min(5000, candidate))
  }
  // Sanity: very low numbers (< 100) for a real meal are likely wrong (e.g. model said "50" for something else)
  const trimmed = mealDescription.trim()
  if (calories < 100 && trimmed.length > 2 && !/^(water|nothing|zero|black coffee)$/i.test(trimmed)) {
    calories = 400
  }
  if (calories === 0 && trimmed.length > 0) {
    calories = 400
  }
  return calories
}

/** Call Gemini with a custom prompt and return the full text response. */
export async function askGemini(prompt: string): Promise<string> {
  const key = GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error('Gemini API key is not configured. Add VITE_GEMINI_API_KEY or VITE_GOOGLE_GEMINI_API_KEY to .env')
  }

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt.trim() }] }],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
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
  const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
  return output
}
