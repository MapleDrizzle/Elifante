import { useState } from 'react'
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import {
  useBabyDevelopmentHistory,
  useInsertDevelopment,
  useUpdateDevelopment,
  kgToLbs,
  cmToInches,
} from '../hooks/useDashboardData'
import { fetchDevelopmentTips } from '../lib/tips'

/** lbs to kg */
function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 1000) / 1000
}

/** inches to cm */
function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function BabyDevelopment(): JSX.Element {
  const { babies, addBaby } = useAuth()
  const [selectedBabyIndex, setSelectedBabyIndex] = useState(0)
  const selectedBaby = babies[selectedBabyIndex] ?? babies[0] ?? null
  const firstBaby = selectedBaby

  const [showAddBabyModal, setShowAddBabyModal] = useState(false)
  const [addBabyName, setAddBabyName] = useState('')
  const [addBabyBirthDate, setAddBabyBirthDate] = useState('')
  const [addBabySubmitting, setAddBabySubmitting] = useState(false)
  const [addBabyError, setAddBabyError] = useState<string | null>(null)

  type LogModalMode = 'all' | 'weight' | 'height' | 'milestone'
  const [logModalMode, setLogModalMode] = useState<LogModalMode | null>(null)
  const [logWeightLbs, setLogWeightLbs] = useState('')
  const [logHeightIn, setLogHeightIn] = useState('')
  const [logMilestone, setLogMilestone] = useState('')

  const birthDate = firstBaby?.birth_date ?? ''
  const ageMonths = birthDate
    ? (() => {
        const birth = new Date(birthDate)
        const now = new Date()
        return Math.max(
          0,
          (now.getFullYear() - birth.getFullYear()) * 12 +
            (now.getMonth() - birth.getMonth())
        )
      })()
    : 0
  const ageDays = birthDate
    ? (() => {
        const birth = new Date(birthDate)
        const now = new Date()
        const ms = now.getTime() - birth.getTime()
        return Math.floor(ms / (1000 * 60 * 60 * 24)) % 30
      })()
    : 0

  const { logs, weightChartData, heightChartData, loading, refetch } =
    useBabyDevelopmentHistory(firstBaby?.id ?? null, birthDate)
  const { insert, inserting, error } = useInsertDevelopment(firstBaby?.id ?? null)
  const { update, updating, error: updateError } = useUpdateDevelopment()

  const [editingLog, setEditingLog] = useState<{
    id: string
    weightKg: number | null
    heightCm: number | null
    milestone: string | null
    recordedAt: string
  } | null>(null)
  type EditListMode = 'weight' | 'height' | null
  const [editListMode, setEditListMode] = useState<EditListMode>(null)

  const [showTipsModal, setShowTipsModal] = useState(false)
  const [tipsGoal, setTipsGoal] = useState('')
  const [tipsContent, setTipsContent] = useState<string | null>(null)
  const [tipsLoading, setTipsLoading] = useState(false)
  const [tipsError, setTipsError] = useState<string | null>(null)

  const latestWeightKg =
    logs.length > 0 ? logs[logs.length - 1]?.weightKg ?? null : null
  const latestHeightCm =
    logs.length > 0 ? logs[logs.length - 1]?.heightCm ?? null : null

  const CHART_HEIGHT = 200

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const weightKg =
      logWeightLbs.trim() !== '' ? lbsToKg(parseFloat(logWeightLbs)) : null
    const heightCm =
      logHeightIn.trim() !== '' ? inchesToCm(parseFloat(logHeightIn)) : null
    const milestone =
      logMilestone.trim() !== '' ? logMilestone.trim() : null
    if (weightKg == null && heightCm == null && milestone == null) return
    try {
      await insert({ weightKg, heightCm, milestone })
      setLogModalMode(null)
      setLogWeightLbs('')
      setLogHeightIn('')
      setLogMilestone('')
      refetch()
    } catch {
      // error shown in UI
    }
  }

  const openLogModal = (mode: LogModalMode) => {
    setEditingLog(null)
    setLogModalMode(mode)
    setLogWeightLbs('')
    setLogHeightIn('')
    setLogMilestone('')
  }

  const openEditModal = (log: {
    id: string
    weightKg: number | null
    heightCm: number | null
    milestone: string | null
    recordedAt: string
  }) => {
    setLogModalMode(null)
    setEditingLog(log)
    setLogWeightLbs(log.weightKg != null ? String(kgToLbs(log.weightKg)) : '')
    setLogHeightIn(log.heightCm != null ? String(cmToInches(log.heightCm)) : '')
    setLogMilestone(log.milestone ?? '')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog) return
    const weightKg =
      logWeightLbs.trim() !== '' ? lbsToKg(parseFloat(logWeightLbs)) : null
    const heightCm =
      logHeightIn.trim() !== '' ? inchesToCm(parseFloat(logHeightIn)) : null
    const milestone =
      logMilestone.trim() !== '' ? logMilestone.trim() : null
    if (weightKg == null && heightCm == null && milestone == null) return
    try {
      await update(editingLog.id, { weightKg, heightCm, milestone })
      setEditingLog(null)
      setLogWeightLbs('')
      setLogHeightIn('')
      setLogMilestone('')
      refetch()
    } catch {
      // error shown in UI
    }
  }

  const showWeightInModal = !logModalMode || logModalMode === 'all' || logModalMode === 'weight'
  const showHeightInModal = !logModalMode || logModalMode === 'all' || logModalMode === 'height'
  const showMilestoneInModal = !logModalMode || logModalMode === 'all' || logModalMode === 'milestone'
  const canSubmit =
    (showWeightInModal && logWeightLbs.trim() !== '') ||
    (showHeightInModal && logHeightIn.trim() !== '') ||
    (showMilestoneInModal && logMilestone.trim() !== '')

  const logsToEdit =
    editListMode === 'weight'
      ? [...logs].filter((l) => l.weightKg != null).reverse()
      : editListMode === 'height'
        ? [...logs].filter((l) => l.heightCm != null).reverse()
        : []

  const handleGetTips = async (e: React.FormEvent) => {
    e.preventDefault()
    const goal = tipsGoal.trim()
    if (!goal || !firstBaby) return
    const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      setTipsError('Google Gemini API key not configured. Add VITE_GOOGLE_GEMINI_API_KEY to your .env file.')
      return
    }
    setTipsError(null)
    setTipsContent(null)
    setTipsLoading(true)
    try {
      const content = await fetchDevelopmentTips(
        apiKey,
        {
          name: firstBaby.name,
          ageMonths,
          ageDays,
          weightLbs: latestWeightKg != null ? kgToLbs(latestWeightKg) : null,
          heightIn: latestHeightCm != null ? cmToInches(latestHeightCm) : null,
          milestones: logs
            .filter((l) => l.milestone?.trim())
            .map((l) => l.milestone!)
            .slice(-5)
            .reverse(),
        },
        goal
      )
      setTipsContent(content)
    } catch (err) {
      setTipsError(err instanceof Error ? err.message : 'Failed to get tips')
    } finally {
      setTipsLoading(false)
    }
  }

  const handleAddBaby = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = addBabyName.trim()
    const birthDate = addBabyBirthDate.trim()
    if (!name || !birthDate) return
    setAddBabyError(null)
    setAddBabySubmitting(true)
    try {
      await addBaby(name, birthDate)
      setAddBabyName('')
      setAddBabyBirthDate('')
      setShowAddBabyModal(false)
      setSelectedBabyIndex(0)
    } catch {
      setAddBabyError('Could not add baby. Try again.')
    } finally {
      setAddBabySubmitting(false)
    }
  }

  if (!firstBaby) {
    return (
      <>
        <header className="app-header">
          <h1>Baby Development</h1>
          <p>Track your baby&apos;s milestones</p>
        </header>
        <main className="app-main">
          <div className="baby-dev-add-card">
            <h2 className="baby-dev-add-title">Add your baby</h2>
            <p className="baby-dev-add-subtitle">
              Add a baby to start tracking development, weight, height, and
              milestones.
            </p>
            <form
              onSubmit={handleAddBaby}
              className="baby-dev-add-form"
            >
              <label className="baby-dev-add-label">
                Baby&apos;s name
                <input
                  type="text"
                  placeholder="e.g. Emma"
                  value={addBabyName}
                  onChange={(e) => setAddBabyName(e.target.value)}
                  required
                  className="baby-dev-add-input"
                />
              </label>
              <label className="baby-dev-add-label">
                Birth date
                <input
                  type="date"
                  value={addBabyBirthDate}
                  onChange={(e) => setAddBabyBirthDate(e.target.value)}
                  required
                  className="baby-dev-add-input"
                />
              </label>
              {addBabyError && (
                <p className="baby-dev-add-error" role="alert">
                  {addBabyError}
                </p>
              )}
              <button
                type="submit"
                className="baby-dev-add-submit"
                disabled={addBabySubmitting}
              >
                {addBabySubmitting ? 'Adding…' : 'Add baby'}
              </button>
            </form>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <main className="app-main app-main--baby-dev">
        {/* Hero: baby name + selector + Add baby */}
        <section className="baby-dev-hero">
          <div className="baby-dev-hero-text">
            {babies.length > 1 ? (
              <select
                className="baby-dev-baby-select"
                value={selectedBabyIndex}
                onChange={(e) => setSelectedBabyIndex(Number(e.target.value))}
                aria-label="Select baby"
              >
                {babies.map((b, i) => (
                  <option key={b.id} value={i}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <h1 className="baby-dev-name">{firstBaby.name}</h1>
            )}
            <p className="baby-dev-subtitle">Track development, weight, height & milestones</p>
          </div>
          <button
            type="button"
            className="baby-dev-add-baby-btn"
            onClick={() => setShowAddBabyModal(true)}
          >
            Add baby
          </button>
        </section>

        {/* Stats row: Age | Weight | Height + Log baby info */}
        <section className="baby-dev-stats-row">
          <div className="baby-dev-stat-pill">
            <span className="baby-dev-stat-value">{ageMonths} mo{ageDays > 0 ? ` ${ageDays} d` : ''}</span>
            <span className="baby-dev-stat-label">Age</span>
          </div>
          <div className="baby-dev-stat-pill">
            <span className="baby-dev-stat-value">
              {latestWeightKg != null ? `${kgToLbs(latestWeightKg)} lbs` : '—'}
            </span>
            <span className="baby-dev-stat-label">Weight</span>
          </div>
          <div className="baby-dev-stat-pill">
            <span className="baby-dev-stat-value">
              {latestHeightCm != null ? `${cmToInches(latestHeightCm)} in` : '—'}
            </span>
            <span className="baby-dev-stat-label">Height</span>
          </div>
          <button
            type="button"
            className="baby-dev-log-btn baby-dev-log-btn--inline"
            onClick={() => openLogModal('all')}
          >
            Log baby info
          </button>
        </section>

        {/* Charts: Weight + Height side by side */}
        <section className="baby-dev-charts-row">
          <div className="baby-dev-chart-card baby-dev-chart-card--compact">
            <div className="baby-dev-chart-header">
              <h3 className="baby-dev-chart-title">Weight over time (lbs)</h3>
              <div className="baby-dev-chart-actions">
                <button
                  type="button"
                  className="baby-dev-add-metric-btn"
                  onClick={() => openLogModal('weight')}
                >
                  Add weight
                </button>
                {logs.some((l) => l.weightKg != null) && (
                  <button
                    type="button"
                    className="baby-dev-edit-btn baby-dev-edit-btn--header"
                    onClick={() => setEditListMode('weight')}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
            {loading ? (
              <div className="baby-dev-chart-loading" style={{ minHeight: CHART_HEIGHT }}>Loading…</div>
            ) : weightChartData.length === 0 ? (
              <div className="baby-dev-chart-empty" style={{ minHeight: CHART_HEIGHT }}>
                No weight data yet. Add weight above.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart
                  data={weightChartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                  />
                  <XAxis
                    dataKey="ageLabel"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11 }}
                    unit=" lbs"
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v} lbs`, 'Weight']}
                    labelFormatter={(label) => `Age: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="weightLbs"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--accent)', r: 4 }}
                    name="Weight"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="baby-dev-chart-card baby-dev-chart-card--compact">
          <div className="baby-dev-chart-header">
            <h3 className="baby-dev-chart-title">Height over time (inches)</h3>
            <div className="baby-dev-chart-actions">
              <button
                type="button"
                className="baby-dev-add-metric-btn"
                onClick={() => openLogModal('height')}
              >
                Add height
              </button>
              {logs.some((l) => l.heightCm != null) && (
                <button
                  type="button"
                  className="baby-dev-edit-btn baby-dev-edit-btn--header"
                  onClick={() => setEditListMode('height')}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div className="baby-dev-chart-loading" style={{ minHeight: CHART_HEIGHT }}>Loading…</div>
          ) : heightChartData.length === 0 ? (
            <div className="baby-dev-chart-empty" style={{ minHeight: CHART_HEIGHT }}>
              No height data yet. Add height above.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart
                data={heightChartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.06)"
                />
                <XAxis
                  dataKey="ageLabel"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                  unit=" in"
                />
                <Tooltip
                  formatter={(v: number) => [`${v} in`, 'Height']}
                  labelFormatter={(label) => `Age: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="heightIn"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)', r: 4 }}
                  name="Height"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          </div>
        </section>

        <section className="baby-dev-bottom-row">
        <section className="baby-dev-milestone-section baby-dev-bottom-col">
          <div className="baby-dev-milestone-header">
            <h3 className="baby-dev-milestone-title">Milestones</h3>
            <div className="baby-dev-milestone-actions">
              <button
                type="button"
                className="baby-dev-add-metric-btn"
                onClick={() => openLogModal('milestone')}
              >
                Add milestone
              </button>
              <button
                type="button"
                className="baby-dev-tips-btn"
                onClick={() => {
                  setShowTipsModal(true)
                  setTipsContent(null)
                  setTipsError(null)
                  setTipsGoal('')
                }}
              >
                Tips
              </button>
            </div>
          </div>
          {loading ? (
            <p className="baby-dev-milestone-loading">Loading…</p>
          ) : logs.filter((l) => l.milestone?.trim()).length === 0 ? (
            <p className="baby-dev-milestone-empty">
              No milestones yet. Add a milestone above.
            </p>
          ) : (
            <ul className="baby-dev-milestone-list">
              {[...logs]
                .filter((l) => l.milestone?.trim())
                .reverse()
                .map((log) => (
                  <li key={log.id} className="baby-dev-milestone-item">
                    <span className="baby-dev-milestone-date">
                      {formatDate(log.recordedAt)}
                    </span>
                    <span className="baby-dev-milestone-text">{log.milestone}</span>
                    <button
                      type="button"
                      className="baby-dev-edit-btn"
                      onClick={() => openEditModal(log)}
                      aria-label={`Edit milestone from ${formatDate(log.recordedAt)}`}
                    >
                      Edit
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="baby-dev-logs-section baby-dev-bottom-col">
          <h3 className="baby-dev-logs-title">Past logs</h3>

          {loading ? (
            <p className="baby-dev-logs-loading">Loading logs…</p>
          ) : logs.length === 0 ? (
            <p className="baby-dev-logs-empty">
              No logs yet. Click &quot;Log baby info&quot; to add weight,
              height, or milestones.
            </p>
          ) : (
            <ul className="baby-dev-logs-list">
              {[...logs].reverse().map((log) => (
                <li key={log.id} className="baby-dev-log-item">
                  <span className="baby-dev-log-date">
                    {formatDate(log.recordedAt)}
                  </span>
                  <span className="baby-dev-log-age">
                    {log.ageMonths} mo
                    {(log.ageDays % 30) > 0
                      ? ` ${log.ageDays % 30} d`
                      : ''}
                  </span>
                  <span className="baby-dev-log-values">
                    {log.weightKg != null && (
                      <span>{kgToLbs(log.weightKg)} lbs</span>
                    )}
                    {log.weightKg != null && log.heightCm != null && ' · '}
                    {log.heightCm != null && (
                      <span>{cmToInches(log.heightCm)} in</span>
                    )}
                    {log.milestone && (
                      <>
                        {(log.weightKg != null || log.heightCm != null) &&
                          ' · '}
                        <span className="baby-dev-log-milestone">
                          {log.milestone}
                        </span>
                      </>
                    )}
                    {!log.weightKg && !log.heightCm && !log.milestone && '—'}
                  </span>
                  <button
                    type="button"
                    className="baby-dev-edit-btn"
                    onClick={() => openEditModal(log)}
                    aria-label={`Edit log from ${formatDate(log.recordedAt)}`}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        </section>
      </main>

      {/* Edit list modal - pick which log to edit */}
      {editListMode != null && !editingLog && (
        <div
          className="baby-dev-modal-backdrop"
          onClick={() => setEditListMode(null)}
          onKeyDown={(e) => e.key === 'Escape' && setEditListMode(null)}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div
            className="baby-dev-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-list-modal-title"
          >
            <h2 id="edit-list-modal-title" className="baby-dev-modal-title">
              Edit {editListMode === 'weight' ? 'weight' : 'height'} entries
            </h2>
            <ul className="baby-dev-edit-list">
              {logsToEdit.map((log) => (
                <li key={log.id} className="baby-dev-edit-list-item">
                  <span className="baby-dev-edit-list-date">
                    {formatDate(log.recordedAt)}
                  </span>
                  <span className="baby-dev-edit-list-value">
                    {editListMode === 'weight' && log.weightKg != null
                      ? `${kgToLbs(log.weightKg)} lbs`
                      : editListMode === 'height' && log.heightCm != null
                        ? `${cmToInches(log.heightCm)} in`
                        : ''}
                  </span>
                  <button
                    type="button"
                    className="baby-dev-edit-btn"
                    onClick={() => {
                      setEditListMode(null)
                      openEditModal(log)
                    }}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="baby-dev-modal-cancel baby-dev-modal-cancel--block"
              onClick={() => setEditListMode(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit modal - modify a log */}
      {editingLog != null && (
        <div
          className="baby-dev-modal-backdrop"
          onClick={() => setEditingLog(null)}
          onKeyDown={(e) => e.key === 'Escape' && setEditingLog(null)}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div
            className="baby-dev-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
          >
            <h2 id="edit-modal-title" className="baby-dev-modal-title">
              Edit log ({formatDate(editingLog.recordedAt)})
            </h2>
            <form onSubmit={handleEditSubmit} className="baby-dev-modal-form">
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
              {(error || updateError) && (
                <p className="baby-dev-modal-error" role="alert">
                  {updateError ?? error}
                </p>
              )}
              <div className="baby-dev-modal-actions">
                <button
                  type="button"
                  className="baby-dev-modal-cancel"
                  onClick={() => setEditingLog(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="baby-dev-modal-submit"
                  disabled={updating || !canSubmit}
                >
                  {updating ? 'Updating…' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tips modal */}
      {showTipsModal && (
        <div
          className="baby-dev-modal-backdrop"
          onClick={() => setShowTipsModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowTipsModal(false)}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div
            className="baby-dev-modal baby-dev-tips-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tips-modal-title"
          >
            <h2 id="tips-modal-title" className="baby-dev-modal-title">
              Development tips
            </h2>
            <p className="baby-dev-tips-subtitle">
              Set a goal for {firstBaby.name}&apos;s development. We&apos;ll use their age, weight, height, and milestones to suggest personalized steps.
            </p>
            <form onSubmit={handleGetTips} className="baby-dev-modal-form">
              {!tipsContent && (
                <label className="baby-dev-modal-label">
                  Your goal
                  <input
                    type="text"
                    placeholder="e.g. Have my baby start crawling"
                    value={tipsGoal}
                    onChange={(e) => setTipsGoal(e.target.value)}
                    required
                    disabled={tipsLoading}
                    className="baby-dev-modal-input"
                  />
                </label>
              )}
              {tipsError && (
                <p className="baby-dev-modal-error" role="alert">
                  {tipsError}
                </p>
              )}
              {tipsContent ? (
                <div className="baby-dev-tips-result">
                  <h3 className="baby-dev-tips-result-title">Steps to achieve your goal</h3>
                  <div className="baby-dev-tips-content">
                    {tipsContent.split(/\n\n+/).map((para, i) => (
                      <p key={i}>{para.trim()}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="baby-dev-modal-actions">
                  <button
                    type="button"
                    className="baby-dev-modal-cancel"
                    onClick={() => setShowTipsModal(false)}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="baby-dev-modal-submit"
                    disabled={tipsLoading || !tipsGoal.trim()}
                  >
                    {tipsLoading ? 'Generating…' : 'Get tips'}
                  </button>
                </div>
              )}
            </form>
            {tipsContent && (
              <div className="baby-dev-tips-actions">
                <button
                  type="button"
                  className="baby-dev-modal-cancel"
                  onClick={() => {
                    setTipsContent(null)
                    setTipsGoal('')
                  }}
                >
                  Try another goal
                </button>
                <button
                  type="button"
                  className="baby-dev-modal-submit"
                  onClick={() => setShowTipsModal(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add baby modal */}
      {showAddBabyModal && (
        <div
          className="baby-dev-modal-backdrop"
          onClick={() => setShowAddBabyModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowAddBabyModal(false)}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div
            className="baby-dev-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-baby-modal-title"
          >
            <h2 id="add-baby-modal-title" className="baby-dev-modal-title">
              Add baby
            </h2>
            <form onSubmit={handleAddBaby} className="baby-dev-modal-form">
              <label className="baby-dev-modal-label">
                Baby&apos;s name
                <input
                  type="text"
                  placeholder="e.g. Emma"
                  value={addBabyName}
                  onChange={(e) => setAddBabyName(e.target.value)}
                  required
                  className="baby-dev-modal-input"
                />
              </label>
              <label className="baby-dev-modal-label">
                Birth date
                <input
                  type="date"
                  value={addBabyBirthDate}
                  onChange={(e) => setAddBabyBirthDate(e.target.value)}
                  required
                  className="baby-dev-modal-input"
                />
              </label>
              {addBabyError && (
                <p className="baby-dev-modal-error" role="alert">
                  {addBabyError}
                </p>
              )}
              <div className="baby-dev-modal-actions">
                <button
                  type="button"
                  className="baby-dev-modal-cancel"
                  onClick={() => setShowAddBabyModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="baby-dev-modal-submit"
                  disabled={addBabySubmitting}
                >
                  {addBabySubmitting ? 'Adding…' : 'Add baby'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log modal */}
      {logModalMode != null && (
        <div
          className="baby-dev-modal-backdrop"
          onClick={() => setLogModalMode(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLogModalMode(null)}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          <div
            className="baby-dev-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-modal-title"
          >
            <h2 id="log-modal-title" className="baby-dev-modal-title">
              {logModalMode === 'weight'
                ? 'Log weight'
                : logModalMode === 'height'
                  ? 'Log height'
                  : logModalMode === 'milestone'
                    ? 'Add milestone'
                    : 'Log baby info'}
            </h2>
            <form onSubmit={handleLogSubmit} className="baby-dev-modal-form">
              {showWeightInModal && (
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
              )}
              {showHeightInModal && (
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
              )}
              {showMilestoneInModal && (
              <label className="baby-dev-modal-label">
                Milestone{logModalMode === 'milestone' ? '' : ' (optional)'}
                <input
                  type="text"
                  placeholder="e.g. First smile"
                  value={logMilestone}
                  onChange={(e) => setLogMilestone(e.target.value)}
                  className="baby-dev-modal-input"
                />
              </label>
              )}
              {error && (
                <p className="baby-dev-modal-error" role="alert">
                  {error}
                </p>
              )}
              <div className="baby-dev-modal-actions">
                <button
                  type="button"
                  className="baby-dev-modal-cancel"
                  onClick={() => setLogModalMode(null)}
                >
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
      )}
    </>
  )
}
