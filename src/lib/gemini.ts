/**
 * Estimate calories for a meal description using the Gemini API.
 * Requires VITE_GEMINI_API_KEY in .env
 */

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ?? import.meta.env.VITE_GOOGLE_GEMINI_API_KEY
/** Use a model that supports generateContent (e.g. gemini-2.5-flash for new users). */
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const PROMPT = `Estimate total calories for one normal serving. Reply with ONLY a number (digits only), nothing else.

apple=95
black coffee=2
banana=105
two eggs and toast=350
butter chicken with rice=650
pizza slice=280
burger and fries=850

Food/meal: `

function parseCaloriesFromResponse(output: string): number {
  if (!output || typeof output !== 'string') return 0
  const normalized = output.replace(/,/g, '').trim()
  const allNumbers = normalized.match(/\d+/g)
  if (!allNumbers || allNumbers.length === 0) return 0
  const parsed = allNumbers.map((n) => parseInt(n, 10))
  // Accept any number that could be calories (1-5000). Use first number in range; if none in range use first number.
  const inRange = parsed.filter((n) => n >= 1 && n <= 5000)
  const candidate = inRange.length > 0 ? inRange[0] : parsed[0]
  return Math.max(0, Math.min(5000, candidate))
}

export async function estimateCalories(mealDescription: string): Promise<number> {
  const key = GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error('Gemini API key is not configured. Add VITE_GEMINI_API_KEY or VITE_GOOGLE_GEMINI_API_KEY to .env')
  }

  const trimmed = mealDescription.trim() || 'nothing specified'
  const text = PROMPT + trimmed

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        maxOutputTokens: 20,
        temperature: 0,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error: ${res.status}`)
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
      finishReason?: string
    }>
  }

  let output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
  let calories = parseCaloriesFromResponse(output)

  // If we got no number, try one more time with a minimal prompt (handles empty/safety blocks)
  if (calories === 0 && trimmed.length > 0 && !/^(water|nothing|zero)$/i.test(trimmed)) {
    const retryRes = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Calories for one serving of "${trimmed}". Reply with only the number:` }] }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0,
        },
      }),
    })
    if (retryRes.ok) {
      const retryData = (await retryRes.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const retryOutput = retryData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
      calories = parseCaloriesFromResponse(retryOutput)
    }
  }

  if (calories === 0 && trimmed.length > 2 && !/^(water|nothing|zero)$/i.test(trimmed)) {
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
