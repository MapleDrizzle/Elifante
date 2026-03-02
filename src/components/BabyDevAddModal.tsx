import { useState, useEffect } from 'react'
import { useInsertDevelopment } from '../hooks/useDashboardData'

/** lbs to kg */
function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 1000) / 1000
}

/** inches to cm */
function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10
}

type Props = {
  babyId: string | null
  babyName: string
  onClose: () => void
  onSuccess?: () => void
}

export default function BabyDevAddModal({
  babyId,
  babyName,
  onClose,
  onSuccess,
}: Props): JSX.Element | null {
  const { insert, inserting, error } = useInsertDevelopment(babyId)
  const [logWeightLbs, setLogWeightLbs] = useState('')
  const [logHeightIn, setLogHeightIn] = useState('')
  const [logMilestone, setLogMilestone] = useState('')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const canSubmit =
    logWeightLbs.trim() !== '' || logHeightIn.trim() !== '' || logMilestone.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const weightKg = logWeightLbs.trim() !== '' ? lbsToKg(parseFloat(logWeightLbs)) : null
    const heightCm = logHeightIn.trim() !== '' ? inchesToCm(parseFloat(logHeightIn)) : null
    const milestone = logMilestone.trim() !== '' ? logMilestone.trim() : null
    if (weightKg == null && heightCm == null && milestone == null) return
    try {
      await insert({ weightKg, heightCm, milestone })
      onSuccess?.()
      onClose()
    } catch {
      // error shown in UI
    }
  }

  if (!babyId) return null

  return (
    <div
      className="baby-dev-modal-backdrop"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      <div
        className="baby-dev-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="baby-dev-modal-title"
      >
        <h2 id="baby-dev-modal-title" className="baby-dev-modal-title">
          Add baby development for {babyName}
        </h2>
        <form onSubmit={handleSubmit} className="baby-dev-modal-form">
          <label className="baby-dev-modal-label">
            Weight (lbs)
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 12.5"
              value={logWeightLbs}
              onChange={(e) => setLogWeightLbs(e.target.value)}
              className="baby-dev-modal-input"
            />
          </label>
          <label className="baby-dev-modal-label">
            Height (inches)
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 24"
              value={logHeightIn}
              onChange={(e) => setLogHeightIn(e.target.value)}
              className="baby-dev-modal-input"
            />
          </label>
          <label className="baby-dev-modal-label">
            Milestone
            <input
              type="text"
              placeholder="e.g. First smile"
              value={logMilestone}
              onChange={(e) => setLogMilestone(e.target.value)}
              className="baby-dev-modal-input"
            />
          </label>
          {error && (
            <p className="baby-dev-modal-error" role="alert">
              {error}
            </p>
          )}
          <div className="baby-dev-modal-actions">
            <button type="button" className="baby-dev-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="baby-dev-modal-submit"
              disabled={inserting || !canSubmit}
            >
              {inserting ? 'Saving…' : 'Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
