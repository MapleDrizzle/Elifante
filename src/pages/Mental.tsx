import { useState, useMemo, useEffect } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import {
  useLatestMood,
  useMoodHistory,
  useInsertMood,
  useForumPosts,
  useInsertForumPost,
  useUpdateForumPost,
  useDeleteForumPost,
} from '../hooks/useDashboardData'
import '../styles/TrackPage.css'
import '../styles/MentalPage.css'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MOOD_IMAGES = [
  '/images/1_mood_logo.png',
  '/images/2_mood_logo.png',
  '/images/3_mood_logo.png',
  '/images/4_mood_logo.png',
  '/images/5_mood_logo.png',
]

function getMoodOptions(t: (k: string) => string) {
  return [
    { value: 1 as const, label: t('mental.mad'), imageSrc: MOOD_IMAGES[0] },
    { value: 2 as const, label: t('mental.low'), imageSrc: MOOD_IMAGES[1] },
    { value: 3 as const, label: t('mental.okay'), imageSrc: MOOD_IMAGES[2] },
    { value: 4 as const, label: t('mental.good'), imageSrc: MOOD_IMAGES[3] },
    { value: 5 as const, label: t('mental.happy'), imageSrc: MOOD_IMAGES[4] },
  ]
}

function getContextOptions(t: (k: string) => string) {
  return [
    { value: '', label: t('mental.contextNone') },
    { value: 'Sleep', label: t('mental.contextSleep') },
    { value: 'Baby', label: t('mental.contextBaby') },
    { value: 'Support', label: t('mental.contextSupport') },
    { value: 'Alone time', label: t('mental.contextAloneTime') },
    { value: 'Overwhelmed', label: t('mental.contextOverwhelmed') },
  ]
}

const SUPPORT_LINK = 'https://www.postpartum.net/'
const SUPPORT_LABEL = 'Postpartum Support International'

async function fetchMoodSuggestion(
  mood: number,
  moodLabel: string,
  context: string,
  whatOnMind: string
): Promise<string | null> {
  const apiUrl = import.meta.env.VITE_MOOD_SUGGESTION_URL as string | undefined
  const url = (apiUrl?.trim() || '') ? apiUrl : '/api/mood-suggestion'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood,
        moodLabel,
        context: context || '',
        whatOnMind: whatOnMind || '',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const suggestion = data?.suggestion
    return typeof suggestion === 'string' ? suggestion.trim() : null
  } catch {
    return null
  }
}

function formatMoodTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getMoodDisplay(rating: number, moodOptions: { value: number; imageSrc: string; label: string }[]): { imageSrc: string; label: string } {
  const opt = moodOptions.find((o) => o.value === rating)
  const fallback = { imageSrc: MOOD_IMAGES[2], label: moodOptions[2]?.label ?? 'Okay' }
  return opt ?? fallback
}

function isLoggedToday(recordedAtIso: string | null): boolean {
  if (!recordedAtIso) return false
  const d = new Date(recordedAtIso)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

export default function Mental(): JSX.Element {
  const { t } = useTranslation()
  const { mom, profile } = useAuth()
  const momId = mom?.id ?? null
  const profileId = profile?.id ?? null
  const MOOD_OPTIONS = useMemo(() => getMoodOptions(t), [t])
  const MOOD_CONTEXT_OPTIONS = useMemo(() => getContextOptions(t), [t])
  const FORUM_TOPIC_SUGGESTIONS = useMemo(() => [t('mental.forumTopic1'), t('mental.forumTopic2'), t('mental.forumTopic3'), t('mental.forumTopic4')], [t])

  const { mood, emotion, moodContext, recordedAt, loading: moodLoading } = useLatestMood(momId)
  const { moods, loading: historyLoading, refetch: refetchMoods } = useMoodHistory(momId)
  const { insert: insertMood, inserting: moodInserting, error: moodError } = useInsertMood(momId)
  const { posts, loading: forumLoading, refetch: refetchForum } = useForumPosts()
  const { insert: insertPost, inserting: postInserting, error: postError } = useInsertForumPost(profileId)
  const { update: updatePost, updating: postUpdating, error: updateError } = useUpdateForumPost(profileId)
  const { deletePost, deleting: postDeleting, error: deleteError } = useDeleteForumPost(profileId)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editTopic, setEditTopic] = useState('')
  const [editBody, setEditBody] = useState('')

  const [showMoodForm, setShowMoodForm] = useState(false)
  const [moodRating, setMoodRating] = useState<number>(4)
  const [emotionText, setEmotionText] = useState('')
  const [moodContextValue, setMoodContextValue] = useState('')
  const [forumTopic, setForumTopic] = useState('')
  const [forumBody, setForumBody] = useState('')
  const [showHeardMessage, setShowHeardMessage] = useState<'default' | 'low' | false>(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false)

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const savedEmotion = emotionText.trim()
    if (!savedEmotion) return
    try {
      await insertMood(
        moodRating,
        savedEmotion,
        moodContextValue.trim() || null
      )
      setShowMoodForm(false)
      setEmotionText('')
      setMoodContextValue('')
      setShowHeardMessage(moodRating <= 2 ? 'low' : 'default')
      setAiSuggestion(null)
      setAiSuggestionLoading(true)
      refetchMoods()
      fetchMoodSuggestion(
        moodRating,
        getMoodDisplay(moodRating, MOOD_OPTIONS).label,
        moodContextValue.trim(),
        savedEmotion
      ).then((s) => setAiSuggestion(s)).finally(() => setAiSuggestionLoading(false))
    } catch {
      setAiSuggestionLoading(false)
      // error handled in hook
    }
  }

  useEffect(() => {
    if (showHeardMessage === false) return
    const t = setTimeout(() => setShowHeardMessage(false), 5000)
    return () => clearTimeout(t)
  }, [showHeardMessage])

  useEffect(() => {
    if (!showMoodForm) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMoodForm(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showMoodForm])

  const handleForumSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forumTopic.trim() || !forumBody.trim()) return
    try {
      await insertPost(forumTopic.trim(), forumBody.trim())
      setForumTopic('')
      setForumBody('')
      refetchForum()
    } catch {
      // error handled in hook
    }
  }

  const startEdit = (p: { id: string; topic: string; body: string }) => {
    setEditingPostId(p.id)
    setEditTopic(p.topic)
    setEditBody(p.body)
  }

  const cancelEdit = () => {
    setEditingPostId(null)
    setEditTopic('')
    setEditBody('')
  }

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPostId || !editTopic.trim() || !editBody.trim()) return
    try {
      await updatePost(editingPostId, editTopic.trim(), editBody.trim())
      setEditingPostId(null)
      setEditTopic('')
      setEditBody('')
      refetchForum()
    } catch {
      // error handled in hook
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm(t('mental.deletePostConfirm'))) return
    try {
      await deletePost(postId)
      refetchForum()
    } catch {
      // error handled in hook
    }
  }

  const currentMoodDisplay = mood != null ? getMoodDisplay(mood, MOOD_OPTIONS) : null
  const hasLoggedToday = isLoggedToday(recordedAt)

  const weekStats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const inWeek = moods.filter((m) => new Date(m.recorded_at) >= weekAgo)
    const betterDays = inWeek.filter((m) => m.mood >= 4).length
    return { total: inWeek.length, betterDays }
  }, [moods])

  const weeklyChartData = useMemo(() => {
    const data: { day: string; date: string; mood: number; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayLabel = DAY_LABELS[d.getDay()]
      const moodsOnDay = moods.filter((m) => m.recorded_at.slice(0, 10) === dateStr)
      const latest = moodsOnDay.length > 0
        ? moodsOnDay.sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0]
        : null
      const moodVal = latest?.mood ?? 0
      const label = latest ? getMoodDisplay(latest.mood, MOOD_OPTIONS).label : '—'
      data.push({ day: dayLabel, date: dateStr, mood: moodVal, label })
    }
    return data
  }, [moods, MOOD_OPTIONS])

  return (
    <>
      <header className="app-header mental-header">
        <h1>{t('mental.title')}</h1>
        <p className="mental-tagline">{t('mental.tagline')}</p>
        <p className="mental-subtext">{t('mental.subtext')}</p>
        <p className="mental-checkin-reminder">{t('mental.checkinReminder')}</p>
      </header>
      <main className="app-main mental-page">
        <div className="mental-layout">
          {/* Left: Mood section */}
          <section className="mental-mood-section">
            {showHeardMessage === 'default' && (
              <p className="mental-heard-message" role="status">
                {t('mental.thanksSharing')}
              </p>
            )}
            {showHeardMessage === 'low' && (
              <div className="mental-heard-message mental-heard-message-low" role="status">
                <p>{t('mental.thanksSharingLow')}</p>
                <p>
                  {t('mental.ifYouWantToTalk')}{' '}
                  <a
                    href={SUPPORT_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mental-heard-support-link"
                  >
                    {t('mental.supportLink')}
                  </a>{' '}
                  {t('mental.supportHereForYou')}
                </p>
              </div>
            )}
            {aiSuggestionLoading && (
              <p className="mental-ai-loading" aria-live="polite">
                {t('mental.thinkingForYou')}
              </p>
            )}
            {aiSuggestion && !aiSuggestionLoading && (
              <div className="mental-ai-suggestion mental-card" role="status">
                <h3 className="mental-card-title">{t('mental.littleSomethingForYou')}</h3>
                <p className="mental-ai-suggestion-text">{aiSuggestion}</p>
              </div>
            )}

            {/* Current mood card – today’s check-in (How are you doing) */}
            <div className="mental-current-mood mental-card">
              <h3 className="mental-card-title">How are you today?</h3>
              {moodLoading ? (
                <p className="mental-loading">Loading…</p>
              ) : hasLoggedToday && currentMoodDisplay ? (
                <div className="mental-current-display">
                  <img
                    src={currentMoodDisplay.imageSrc}
                    alt=""
                    className="mental-mood-img"
                    aria-hidden
                  />
                  <p className="mental-mood-label">{currentMoodDisplay.label}</p>
                  {(moodContext || emotion) && (
                    <p className="mental-context-emotion-line">
                      {moodContext && emotion
                        ? `${t('mental.affectedBy')} ${moodContext}. ${t('mental.inYourWords')} ${emotion}`
                        : moodContext
                          ? `${t('mental.affectedBy')} ${moodContext}`
                          : `${t('mental.inYourWords')} ${emotion}`}
                    </p>
                  )}
                  <button
                    type="button"
                    className="mental-update-btn"
                    onClick={() => { setShowMoodForm(true); setAiSuggestion(null); }}
                  >
                    {t('mental.updateTodaysMood')}
                  </button>
                </div>
              ) : (
                <div className="mental-current-empty">
                  <p>
                    {currentMoodDisplay
                      ? t('mental.haventLoggedToday')
                      : t('mental.logHowDoingToday')}
                  </p>
                  {currentMoodDisplay && recordedAt && (
                    <p className="mental-last-checkin">
                      {t('mental.lastCheckin')} {formatMoodTime(recordedAt)} — {currentMoodDisplay.label}
                      {moodContext && ` · ${moodContext}`}
                    </p>
                  )}
                  <button
                    type="button"
                    className="mental-update-btn mental-log-today-btn"
                    onClick={() => { setShowMoodForm(true); setAiSuggestion(null); }}
                  >
                    {t('mental.logMoodToday')}
                  </button>
                </div>
              )}
            </div>

            {/* Weekly trend chart */}
            <div className="mental-week-chart mental-card">
              <h3 className="mental-card-title">{t('mental.weekAtGlance')}</h3>
              <p className="mental-chart-subtitle">{t('mental.moodByDay')}</p>
              {historyLoading ? (
                <p className="mental-loading">{t('common.loading')}</p>
              ) : (
                <div className="mental-chart-wrap">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={weeklyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} width={20} />
                      <Tooltip
                        formatter={(value: number) => [value === 0 ? t('mental.noCheckin') : getMoodDisplay(value, MOOD_OPTIONS).label, t('mental.mood')]}
                        labelFormatter={(_, payload) => (payload?.[0]?.payload?.date ? formatMoodTime(payload[0].payload.date + 'T12:00:00').split(',')[0] : '')}
                      />
                      <Bar
                        dataKey="mood"
                        fill="var(--accent)"
                        radius={[4, 4, 0, 0]}
                        name={t('mental.mood')}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Update mood form – modal popup */}
            {showMoodForm && (
              <div
                className="mental-mood-modal-backdrop"
                onClick={() => setShowMoodForm(false)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="mental-modal-title"
              >
                <div className="mental-mood-modal-wrap" onClick={(e) => e.stopPropagation()}>
                  <div className="mental-mood-form mental-card">
                    <h3 id="mental-modal-title" className="mental-card-title">{t('mental.howAreYouToday')}</h3>
                <p className="mental-form-subtext">{t('mental.checkinForToday')}</p>
                <form onSubmit={handleMoodSubmit}>
                  <p className="mental-form-label">{t('mental.howFeelingLabel')}</p>
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
                        <img
                          src={opt.imageSrc}
                          alt=""
                          className="mental-option-img"
                          aria-hidden
                        />
                        <span className="mental-option-label">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <label className="mental-form-label">
                    {t('mental.whatsAffectingYou')}
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
                    {t('mental.whatsOnMind')}
                    <input
                      type="text"
                      className="mental-emotion-input"
                      placeholder={t('mental.whatsOnMindPlaceholder')}
                      value={emotionText}
                      onChange={(e) => setEmotionText(e.target.value)}
                      required
                      minLength={1}
                    />
                  </label>
                  {moodError && (
                    <p className="mental-error" role="alert">
                      {moodError}
                    </p>
                  )}
                  <div className="mental-form-actions">
                    <button
                      type="button"
                      className="mental-cancel-btn"
                      onClick={() => setShowMoodForm(false)}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="mental-submit-btn"
                      disabled={moodInserting}
                    >
                      {moodInserting ? t('diet.saving') : t('mental.saveCheckin')}
                    </button>
                  </div>
                </form>
                  </div>
                </div>
              </div>
            )}

            {/* Past moods */}
            <div className="mental-past-moods mental-card">
              <h3 className="mental-card-title">Past check-ins</h3>
              {historyLoading ? (
                <p className="mental-loading">Loading…</p>
              ) : moods.length === 0 ? (
                <p className="mental-empty">No moods logged yet.</p>
              ) : (
                <div className="mental-mood-list-scroll">
                <ul className="mental-mood-list">
                  {moods.map((m) => {
                    const d = getMoodDisplay(m.mood, MOOD_OPTIONS)
                    return (
                      <li key={m.id} className="mental-mood-item">
                        <img
                          src={d.imageSrc}
                          alt=""
                          className="mental-mood-item-img"
                          aria-hidden
                        />
                        <div className="mental-mood-item-details">
                          <span className="mental-mood-item-time">
                            {formatMoodTime(m.recorded_at)}
                          </span>
                          <span className="mental-mood-item-label">{d.label}</span>
                          {m.mood_context && (
                            <span className="mental-mood-item-context">
                              {m.mood_context}
                            </span>
                          )}
                          {m.emotion && (
                            <span className="mental-mood-item-emotion">
                              &ldquo;{m.emotion}&rdquo;
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                </div>
              )}
            </div>
          </section>

          {/* Right: Forum + Support */}
          <section className="mental-forum-section">
            <div className="mental-card">
            <h3 className="mental-card-title">{t('mental.shareWithMoms')}</h3>
            <p className="mental-forum-intro">{t('mental.forumIntro')}</p>
            <form onSubmit={handleForumSubmit} className="mental-forum-form">
              <input
                type="text"
                className="mental-forum-topic"
                placeholder={t('mental.forumTopicPlaceholder')}
                value={forumTopic}
                onChange={(e) => setForumTopic(e.target.value)}
                required
              />
              <textarea
                className="mental-forum-body"
                placeholder="What's one small win or something that helped?"
                rows={3}
                value={forumBody}
                onChange={(e) => setForumBody(e.target.value)}
                required
              />
              <p className="mental-forum-suggestions">
                {t('mental.topicIdeas')} {FORUM_TOPIC_SUGGESTIONS.join(', ')}
              </p>
              {(postError || updateError || deleteError) && (
                <p className="mental-error" role="alert">
                  {postError || updateError || deleteError}
                </p>
              )}
              <button
                type="submit"
                className="mental-submit-btn mental-forum-submit"
                disabled={postInserting}
              >
                {postInserting ? t('mental.posting') : t('mental.post')}
              </button>
            </form>
            <div className="mental-forum-posts">
              {forumLoading ? (
                <p className="mental-loading">{t('mental.loadingPosts')}</p>
              ) : posts.length === 0 ? (
                <p className="mental-empty">{t('mental.noPostsYet')}</p>
              ) : (
                <ul className="mental-post-list">
                  {posts.map((p) => (
                    <li key={p.id} className="mental-post-item">
                      {editingPostId === p.id ? (
                        <form onSubmit={handleUpdatePost} className="mental-post-edit-form">
                          <input
                            type="text"
                            className="mental-forum-topic mental-post-edit-input"
                            value={editTopic}
                            onChange={(e) => setEditTopic(e.target.value)}
                            required
                          />
                          <textarea
                            className="mental-forum-body mental-post-edit-input"
                            rows={2}
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            required
                          />
                          <div className="mental-post-edit-actions">
                            <button type="button" className="mental-post-btn mental-post-cancel" onClick={cancelEdit}>
                              Cancel
                            </button>
                            <button type="submit" className="mental-post-btn mental-post-save" disabled={postUpdating}>
                              {postUpdating ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="mental-post-item-header">
                            <h4 className="mental-post-topic">{p.topic}</h4>
                            {profileId === p.profile_id && (
                              <div className="mental-post-actions">
                                <button
                                  type="button"
                                  className="mental-post-btn mental-post-edit-btn"
                                  onClick={() => startEdit(p)}
                                  aria-label={t('mental.editPost')}
                                >
                                  {t('mental.editPost')}
                                </button>
                                <button
                                  type="button"
                                  className="mental-post-btn mental-post-delete-btn"
                                  onClick={() => handleDeletePost(p.id)}
                                  aria-label={t('mental.deletePost')}
                                >
                                  {t('mental.deletePost')}
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="mental-post-body">{p.body}</p>
                          <p className="mental-post-meta">
                            {p.profiles?.username ?? t('mental.anonymous')} ·{' '}
                            {new Date(p.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>

            {/* When you need support – always visible */}
            <div className="mental-support-card mental-card">
              <h3 className="mental-card-title">{t('mental.whenNeedSupport')}</h3>
              <p className="mental-support-card-text">{t('mental.notAlone')}</p>
              <a
                href={SUPPORT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mental-support-link"
              >
                {t('mental.supportLink')}
              </a>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
