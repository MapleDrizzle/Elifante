import { useState, useEffect } from 'react'
import { useInsertMood } from '../hooks/useDashboardData'
import '../styles/MentalPage.css'

const MOOD_IMAGES = [
  '/images/1_mood_logo.png',
  '/images/2_mood_logo.png',
  '/images/3_mood_logo.png',
  '/images/4_mood_logo.png',
  '/images/5_mood_logo.png',
]

const MOOD_OPTIONS = [
  { value: 1 as const, label: 'Mad', imageSrc: MOOD_IMAGES[0] },
  { value: 2 as const, label: 'Low', imageSrc: MOOD_IMAGES[1] },
  { value: 3 as const, label: 'Okay', imageSrc: MOOD_IMAGES[2] },
  { value: 4 as const, label: 'Good', imageSrc: MOOD_IMAGES[3] },
  { value: 5 as const, label: 'Happy', imageSrc: MOOD_IMAGES[4] },
]

const MOOD_CONTEXT_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'Sleep', label: 'Sleep' },
  { value: 'Baby', label: 'Baby' },
  { value: 'Support', label: 'Support' },
  { value: 'Alone time', label: 'Alone time' },
  { value: 'Overwhelmed', label: 'Overwhelmed' },
]

type Props = {
  momId: string | null
  onClose: () => void
  onSuccess?: () => void
}

export default function MoodModal({ momId, onClose, onSuccess }: Props): JSX.Element | null {
  const { insert, inserting, error } = useInsertMood(momId)
  const [moodRating, setMoodRating] = useState(4)
  const [emotionText, setEmotionText] = useState('')
  const [moodContextValue, setMoodContextValue] = useState('')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const savedEmotion = emotionText.trim()
    if (!savedEmotion || !momId) return
    try {
      await insert(moodRating, savedEmotion, moodContextValue.trim() || null)
      onSuccess?.()
      onClose()
    } catch {
      // error shown in UI
    }
  }

  if (!momId) return null

  return (
    <div
      className="mental-mood-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mood-modal-title"
    >
      <div className="mental-mood-modal-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="mental-mood-form mental-card">
          <h3 id="mood-modal-title" className="mental-card-title">
            How are you doing today?
          </h3>
          <p className="mental-form-subtext">Your check-in for today.</p>
          <form onSubmit={handleSubmit}>
            <p className="mental-form-label">How are you feeling? (1–5)</p>
            <div className="mental-mood-options">
              {MOOD_OPTIONS.map((opt) => (
                <label key={opt.value} className="mental-mood-option">
                  <input
                    type="radio"
                    name="mood"
                    value={opt.value}
                    checked={moodRating === opt.value}
                    onChange={() => setMoodRating(opt.value)}
                  />
                  <img src={opt.imageSrc} alt="" className="mental-option-img" aria-hidden />
                  <span className="mental-option-label">{opt.label}</span>
                </label>
              ))}
            </div>
            <label className="mental-form-label">
              What&apos;s affecting you right now?
              <select
                className="mental-context-select"
                value={moodContextValue}
                onChange={(e) => setMoodContextValue(e.target.value)}
              >
                {MOOD_CONTEXT_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mental-form-label">
              What&apos;s on your mind?
              <input
                type="text"
                className="mental-emotion-input"
                placeholder="e.g. grateful, anxious, peaceful — a word or short phrase"
                value={emotionText}
                onChange={(e) => setEmotionText(e.target.value)}
                required
                minLength={1}
              />
            </label>
            {error && (
              <p className="mental-error" role="alert">
                {error}
              </p>
            )}
            <div className="mental-form-actions">
              <button type="button" className="mental-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="mental-submit-btn" disabled={inserting}>
                {inserting ? 'Saving…' : 'Save check-in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
