type Props = {
  mood: number | null
  loading: boolean
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
}

export default function MoodSlide({ mood, loading }: Props): JSX.Element {
  if (loading) {
    return (
      <div className="dashboard-slide dashboard-slide--loading">
        Loading mood…
      </div>
    )
  }

  if (mood == null) {
    return (
      <div className="dashboard-slide dashboard-slide--empty">
        <p>No mood logged yet. Log how you feel in the Mental section.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-slide dashboard-slide--mood">
      <h3 className="dashboard-slide-title">Current mood</h3>
      <div className="mood-display">
        <div className="mood-dots" aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`mood-dot ${n <= mood ? 'mood-dot--filled' : ''}`}
            />
          ))}
        </div>
        <p className="mood-label">{MOOD_LABELS[mood as keyof typeof MOOD_LABELS]}</p>
      </div>
    </div>
  )
}
