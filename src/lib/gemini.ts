/**
 * Estimate calories for a meal description using the Gemini API.
 * Requires VITE_GEMINI_API_KEY in .env
 */

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ?? import.meta.env.VITE_GOOGLE_GEMINI_API_KEY
/** Use a model that supports generateContent (e.g. gemini-2.5-flash for new users). */
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

/** Fallback calories for common foods when API returns a suspiciously low number. */
const COMMON_FOOD_CALORIES: Record<string, number> = {
  apple: 95,
  apples: 95,
  banana: 105,
  bananas: 105,
  orange: 62,
  pizza: 285,
  'pizza slice': 280,
  'slice of pizza': 280,
  eggs: 140,
  'two eggs': 140,
  toast: 80,
  'two eggs and toast': 350,
  coffee: 2,
  'black coffee': 2,
  salad: 100,
  'chicken salad': 350,
  'butter chicken': 500,
  'butter chicken with rice': 650,
  burger: 350,
  'burger and fries': 850,
  fries: 365,
  sandwich: 350,
  rice: 200,
  pasta: 220,
  bread: 80,
  milk: 150,
  yogurt: 150,
  cheese: 110,
  almonds: 160,
  'handful of almonds': 160,
}

function getFallbackCalories(food: string): number | null {
  const normalized = food.trim().toLowerCase()
  if (!normalized) return null
  if (COMMON_FOOD_CALORIES[normalized] != null) return COMMON_FOOD_CALORIES[normalized]
  // Prefer longer matches (e.g. "pizza slice" before "pizza")
  const sortedKeys = Object.keys(COMMON_FOOD_CALORIES).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    if (normalized.includes(key)) return COMMON_FOOD_CALORIES[key]
  }
  return null
}

const PROMPT = `Estimate total calories for one normal serving. Reply with ONLY a number (digits only), nothing else.

Examples: apple=95, banana=105, black coffee=2, pizza slice=280, butter chicken with rice=650

Food/meal: `

function parseCaloriesFromResponse(output: string): number {
  if (!output || typeof output !== 'string') return 0
  const normalized = output.replace(/,/g, '').trim()
  // Match full numbers (including decimals) to avoid splitting "95" into "9" and "5"
  const numberMatches = normalized.match(/\d+\.?\d*/g)
  if (!numberMatches || numberMatches.length === 0) return 0
  const parsed = numberMatches.map((n) => Math.round(parseFloat(n)))
  // If we got multiple single digits (e.g. "9" "5"), try combining: 9+5 -> 95
  if (parsed.length >= 2 && parsed.every((n) => n >= 0 && n <= 9)) {
    const combined = parseInt(parsed.join(''), 10)
    if (combined >= 10 && combined <= 5000) return combined
  }
  // Prefer the largest number in typical calorie range (20-5000)
  const inRange = parsed.filter((n) => n >= 20 && n <= 5000)
  const candidate = inRange.length > 0 ? Math.max(...inRange) : parsed[0]
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
        maxOutputTokens: 30,
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

  const isLowCalBeverage = /^(water|nothing|zero|black coffee|coffee|tea)$/i.test(trimmed)
  const fallback = getFallbackCalories(trimmed)

  // If API returned a suspiciously low number (< 100) for a real food, use fallback or retry
  if (calories < 100 && !isLowCalBeverage && trimmed.length > 1) {
    if (fallback != null) return fallback
    // Retry with a more explicit prompt
    const retryRes = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `How many calories in one serving of "${trimmed}"? Reply with ONLY the number. Example: apple=95, pizza slice=280. Your answer:`,
          }],
        }],
        generationConfig: {
          maxOutputTokens: 30,
          temperature: 0,
        },
      }),
    })
    if (retryRes.ok) {
      const retryData = (await retryRes.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const retryOutput = retryData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
      const retryCalories = parseCaloriesFromResponse(retryOutput)
      if (retryCalories >= 100) return retryCalories
    }
    // Still low after retry - single digits are almost certainly wrong for real foods
    return fallback ?? 400
  }

  // If we got no number, try one more time with a minimal prompt (handles empty/safety blocks)
  if (calories === 0 && trimmed.length > 0 && !isLowCalBeverage) {
    if (fallback != null) return fallback
    const retryRes = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Calories for one serving of "${trimmed}". Reply with only the number:` }] }],
        generationConfig: {
          maxOutputTokens: 30,
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
    if (calories === 0 && fallback != null) return fallback
  }

  if (calories === 0 && trimmed.length > 2 && !isLowCalBeverage) {
    calories = fallback ?? 400
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
