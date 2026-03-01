import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  useLatestMood,
  useMoodHistory,
  useInsertMood,
  useForumPosts,
  useInsertForumPost,
} from '../hooks/useDashboardData'
import '../styles/TrackPage.css'
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

function formatMoodTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getMoodDisplay(rating: number): { imageSrc: string; label: string } {
  const opt = MOOD_OPTIONS.find((o) => o.value === rating)
  const fallback = { imageSrc: MOOD_IMAGES[2], label: 'Okay' }
  return opt ?? fallback
}

export default function Mental(): JSX.Element {
  const { mom, profile } = useAuth()
  const momId = mom?.id ?? null
  const profileId = profile?.id ?? null

  const { mood, emotion, loading: moodLoading } = useLatestMood(momId)
  const { moods, loading: historyLoading, refetch: refetchMoods } = useMoodHistory(momId)
  const { insert: insertMood, inserting: moodInserting, error: moodError } = useInsertMood(momId)
  const { posts, loading: forumLoading, refetch: refetchForum } = useForumPosts()
  const { insert: insertPost, inserting: postInserting, error: postError } = useInsertForumPost(profileId)

  const [showMoodForm, setShowMoodForm] = useState(false)
  const [moodRating, setMoodRating] = useState<number>(4)
  const [emotionText, setEmotionText] = useState('')
  const [forumTopic, setForumTopic] = useState('')
  const [forumBody, setForumBody] = useState('')

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await insertMood(moodRating, emotionText.trim() || null)
      setShowMoodForm(false)
      setEmotionText('')
      refetchMoods()
    } catch {
      // error handled in hook
    }
  }

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

  const currentMoodDisplay = mood != null ? getMoodDisplay(mood) : null

  return (
    <>
      <header className="app-header">
        <h1>Mental</h1>
        <p>Track your mental wellness</p>
      </header>
      <main className="app-main mental-page">
        <div className="mental-layout">
          {/* Left: Mood section */}
          <section className="mental-mood-section">
            {/* Current mood card */}
            <div className="mental-current-mood mental-card">
              <h3 className="mental-card-title">Current mood</h3>
              {moodLoading ? (
                <p className="mental-loading">Loading…</p>
              ) : currentMoodDisplay ? (
                <div className="mental-current-display">
                  <img
                    src={currentMoodDisplay.imageSrc}
                    alt=""
                    className="mental-mood-img"
                    aria-hidden
                  />
                  <p className="mental-mood-label">{currentMoodDisplay.label}</p>
                  {emotion && (
                    <p className="mental-emotion-text">“{emotion}”</p>
                  )}
                  <button
                    type="button"
                    className="mental-update-btn"
                    onClick={() => setShowMoodForm(true)}
                  >
                    Update mood
                  </button>
                </div>
              ) : (
                <div className="mental-current-empty">
                  <p>No mood logged yet.</p>
                  <button
                    type="button"
                    className="mental-update-btn"
                    onClick={() => setShowMoodForm(true)}
                  >
                    Log your mood
                  </button>
                </div>
              )}
            </div>

            {/* Update mood form (modal or inline) */}
            {showMoodForm && (
              <div className="mental-mood-form mental-card">
                <h3 className="mental-card-title">Log your mood</h3>
                <form onSubmit={handleMoodSubmit}>
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
                    Emotion (optional)
                    <input
                      type="text"
                      className="mental-emotion-input"
                      placeholder="e.g. grateful, anxious, peaceful"
                      value={emotionText}
                      onChange={(e) => setEmotionText(e.target.value)}
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
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="mental-submit-btn"
                      disabled={moodInserting}
                    >
                      {moodInserting ? 'Saving…' : 'Save mood'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Past moods */}
            <div className="mental-past-moods mental-card">
              <h3 className="mental-card-title">Past moods</h3>
              {historyLoading ? (
                <p className="mental-loading">Loading…</p>
              ) : moods.length === 0 ? (
                <p className="mental-empty">No moods logged yet.</p>
              ) : (
                <ul className="mental-mood-list">
                  {moods.map((m) => {
                    const d = getMoodDisplay(m.mood)
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
                          {m.emotion && (
                            <span className="mental-mood-item-emotion">
                              “{m.emotion}”
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Right: Forum */}
          <section className="mental-forum-section mental-card">
            <h3 className="mental-card-title">Community forum</h3>
            <form onSubmit={handleForumSubmit} className="mental-forum-form">
              <input
                type="text"
                className="mental-forum-topic"
                placeholder="Topic"
                value={forumTopic}
                onChange={(e) => setForumTopic(e.target.value)}
                required
              />
              <textarea
                className="mental-forum-body"
                placeholder="Share your thoughts..."
                rows={4}
                value={forumBody}
                onChange={(e) => setForumBody(e.target.value)}
                required
              />
              {postError && (
                <p className="mental-error" role="alert">
                  {postError}
                </p>
              )}
              <button
                type="submit"
                className="mental-submit-btn mental-forum-submit"
                disabled={postInserting}
              >
                {postInserting ? 'Posting…' : 'Post'}
              </button>
            </form>
            <div className="mental-forum-posts">
              {forumLoading ? (
                <p className="mental-loading">Loading posts…</p>
              ) : posts.length === 0 ? (
                <p className="mental-empty">No posts yet. Be the first!</p>
              ) : (
                <ul className="mental-post-list">
                  {posts.map((p) => (
                    <li key={p.id} className="mental-post-item">
                      <h4 className="mental-post-topic">{p.topic}</h4>
                      <p className="mental-post-body">{p.body}</p>
                      <p className="mental-post-meta">
                        {p.profiles?.username ?? 'Anonymous'} ·{' '}
                        {new Date(p.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
