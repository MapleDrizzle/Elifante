/**
 * Personalized advice for mom's behavior trends (diet, mood, sleep).
 * Uses Gemini API - requires VITE_GEMINI_API_KEY or VITE_GOOGLE_GEMINI_API_KEY.
 */

const GEMINI_MODEL = 'gemini-2.5-flash'

function getGeminiUrl(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
}

export type MomBehaviorStats = {
  diet: {
    totalCalories: number
    goal: number
    recentFoods: string[]
  }
  mood: {
    daysLoggedThisWeek: number
    totalDays: number
  }
  sleep: {
    avgMotherHoursPerDay: number
    daysWithLowSleep: number
  }
}

export type TrendCategory = 'diet' | 'mood' | 'sleep'

export type AdviceResult = {
  suggestion: string
  resourceLink?: string
  resourceLabel?: string
}

/** Suggest a resource URL based on trend category and context. */
function getResourceForTrend(
  category: TrendCategory,
  context: string,
  recentFoods: string[]
): { url: string; label: string } | null {
  if (category === 'diet' && (context.includes('not') || context.includes('enough') || context.includes('low') || context.includes('below'))) {
    return {
      url: 'https://www.healthline.com/nutrition/quick-healthy-meals',
      label: 'Quick & easy healthy meals',
    }
  }
  if (category === 'mood' && (context.includes('inconsistent') || context.includes('few'))) {
    return {
      url: 'https://www.postpartum.net/',
      label: 'Postpartum Support International',
    }
  }
  if (category === 'sleep') {
    return {
      url: 'https://www.sleepfoundation.org/sleep-hygiene',
      label: 'Sleep hygiene tips',
    }
  }
  return null
}

export async function fetchMomBehaviorAdvice(
  apiKey: string,
  stats: MomBehaviorStats,
  category: TrendCategory
): Promise<AdviceResult> {
  const { diet, mood, sleep } = stats

  const dietSummary =
    diet.totalCalories >= diet.goal * 0.8
      ? `Meeting calorie goal (${diet.totalCalories}/${diet.goal} cal today)`
      : `Below calorie goal (${diet.totalCalories}/${diet.goal} cal today)`
  const moodSummary =
    mood.daysLoggedThisWeek >= 4
      ? `Consistent mood logging (${mood.daysLoggedThisWeek}/7 days this week)`
      : `Inconsistent mood logging (${mood.daysLoggedThisWeek}/7 days this week)`
  const sleepSummary =
    sleep.avgMotherHoursPerDay >= 6
      ? `Getting adequate sleep (avg ${sleep.avgMotherHoursPerDay.toFixed(1)} hrs/night)`
      : `Sleep deprived (avg ${sleep.avgMotherHoursPerDay.toFixed(1)} hrs/night)`

  const recentFoodsStr =
    diet.recentFoods.length > 0 ? diet.recentFoods.slice(0, 5).join(', ') : 'none logged'

  const categoryPrompt = {
    diet: `Diet: ${dietSummary}. Recent foods logged: ${recentFoodsStr}.`,
    mood: `Mood: ${moodSummary}.`,
    sleep: `Sleep: ${sleepSummary}.`,
  }

  const prompt = `You are a supportive postpartum companion. Give ONE short, personalized suggestion (2-3 sentences max) for a new mom based on this data:

${categoryPrompt[category]}

If she's doing well, encourage her to keep it up. If she needs improvement, give one practical tip. Warm, non-judgmental tone. No medical advice. Be specific and actionable.`

  const res = await fetch(getGeminiUrl(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Advice API error: ${res.status}`)
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const parts = data.candidates?.[0]?.content?.parts ?? []
  const suggestion = parts.map((p) => p.text ?? '').join('').trim()
  if (!suggestion) throw new Error('No advice returned')

  const context = categoryPrompt[category]
  const resource = getResourceForTrend(category, context.toLowerCase(), diet.recentFoods)

  return {
    suggestion,
    resourceLink: resource?.url,
    resourceLabel: resource?.label,
  }
}
