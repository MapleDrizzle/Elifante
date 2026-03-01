const GEMINI_MODEL = 'gemini-2.5-flash'

function getGeminiUrl(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
}

export type BabyStats = {
  name: string
  ageMonths: number
  ageDays: number
  weightLbs: number | null
  heightIn: number | null
  milestones: string[]
}

export async function fetchDevelopmentTips(
  apiKey: string,
  stats: BabyStats,
  goal: string
): Promise<string> {
  const ageStr =
    stats.ageMonths >= 12
      ? `${Math.floor(stats.ageMonths / 12)} year(s) ${stats.ageMonths % 12} month(s)`
      : `${stats.ageMonths} month(s) ${stats.ageDays} day(s)`

  const statsSummary = [
    `Baby: ${stats.name}`,
    `Age: ${ageStr}`,
    stats.weightLbs != null ? `Current weight: ${stats.weightLbs} lbs` : 'Weight: not logged',
    stats.heightIn != null ? `Current height: ${stats.heightIn} inches` : 'Height: not logged',
    stats.milestones.length > 0
      ? `Recent milestones: ${stats.milestones.slice(0, 5).join(', ')}`
      : 'Milestones: none logged yet',
  ].join('\n')

  const prompt = `You are a supportive parenting companion sharing general tips and ideas. You do not provide medical advice, diagnoses, or professional recommendations.

Baby's current stats:
${statsSummary}

Parent's goal: ${goal}

Give exactly 3 short, numbered steps. Start directly with "1." — no intro, preamble, or filler. Each step is one or two sentences max. Keep the whole response brief and scannable—not article length. Adapt to the baby's age. Warm tone. No medical advice or diagnosis; suggest seeing a pediatrician for concerns.

Format: "1." then "2." then "3." One line per step. No headers, no long paragraphs.`

  const res = await fetch(getGeminiUrl(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2500,
        temperature: 0.9,
        topP: 0.95,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      err.error?.message ?? `Tips API error: ${res.status} ${res.statusText}`
    )
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const parts = data.candidates?.[0]?.content?.parts ?? []
  const text = parts.map((p) => p.text ?? '').join('').trim()
  if (!text) throw new Error('No tips returned from API')
  return text
}
