import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MoodModal from '../components/MoodModal'
import BabyDevAddModal from '../components/BabyDevAddModal'
import BehaviorTrendsSection from '../components/BehaviorTrendsSection'
import '../styles/TrackPage.css'
import {
  useWeeklySleep,
  useTodayDietCalories,
  useTodayBabyDietMl,
  useBabyDevelopment,
} from '../hooks/useDashboardData'
import SleepChart from '../components/dashboard/SleepChart'
import CalorieGoalChart from '../components/dashboard/CalorieGoalChart'
import BabyMlGoalChart from '../components/dashboard/BabyMlGoalChart'
import MoodSlide from '../components/dashboard/MoodSlide'
import DevelopmentSlide from '../components/dashboard/DevelopmentSlide'
import ChatBox from '../components/ChatBox'

const SLIDE_LABELS = ['Sleep', 'Diet', 'Mood', 'Development']
const AUTO_SLIDE_MS = 6000

const SLIDE_KEYS = ['sleep', 'diet', 'mood', 'development'] as const

export default function Home(): JSX.Element {
  const { t } = useTranslation()
  const { displayName, mom, babies } = useAuth()
  const [slideIndex, setSlideIndex] = useState(0)
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [showBabyDevModal, setShowBabyDevModal] = useState(false)

  const goNext = useCallback(() => {
    setSlideIndex((i) => (i + 1) % SLIDE_KEYS.length)
  }, [])
  const goPrev = useCallback(() => {
    setSlideIndex((i) => (i - 1 + SLIDE_KEYS.length) % SLIDE_KEYS.length)
  }, [])

  useEffect(() => {
    const id = setInterval(goNext, AUTO_SLIDE_MS)
    return () => clearInterval(id)
  }, [goNext])

  const babyIds = babies.map((b) => b.id)
  const firstBaby = babies[0] ?? null

  const { data: sleepData, loading: sleepLoading } = useWeeklySleep(
    mom?.id ?? null,
    babyIds
  )
  useTodayDietCalories(mom?.id ?? null)
  useTodayBabyDietMl(babyIds)
  const { data: devData, loading: devLoading } = useBabyDevelopment(
    firstBaby?.id ?? null,
    firstBaby?.name ?? '',
    firstBaby?.birth_date ?? ''
  )

  return (
    <div className="home-page">
      <header className="app-header app-header--home">
        <h1 className="home-greeting">{t('home.greeting', { name: displayName })}</h1>
        <p className="app-header-tagline">{t('home.tagline')}</p>
      </header>
      <main className="app-main app-main--dashboard">
        <section className="slideshow" aria-label={t('home.slideshowLabel')}>
          <div className="slideshow-track">
            <div
              className="slideshow-slides"
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
            >
              <div className="slideshow-slide">
                <SleepChart
                  data={sleepData}
                  loading={sleepLoading}
                  height={180}
                />
              </div>
              <div className="slideshow-slide slideshow-slide--diet-pair">
                <div className="slideshow-diet-pair">
                  <div className="slideshow-diet-cell">
                    <CalorieGoalChart momId={mom?.id ?? null} variant="slideshow" />
                    <p className="slideshow-diet-label">{t('home.momCalorieGoal')}</p>
                  </div>
                  <div className="slideshow-diet-cell">
                    {babyIds.length === 0 ? (
                      <div className="dashboard-slide dashboard-slide--empty">
                        <p>{t('home.addBabyToTrack')}</p>
                      </div>
                    ) : (
                      <BabyMlGoalChart babyIds={babyIds} variant="slideshow" />
                    )}
                    <p className="slideshow-diet-label">{t('home.babyIntake')}</p>
                  </div>
                </div>
              </div>
              <div className="slideshow-slide">
                <MoodSlide momId={mom?.id ?? null} />
              </div>
              <div className="slideshow-slide">
                <DevelopmentSlide data={devData} loading={devLoading} />
              </div>
            </div>
          </div>
          <div className="slideshow-footer">
            <button
              type="button"
              className="slideshow-arrow slideshow-arrow--prev"
              onClick={goPrev}
              aria-label={t('home.prevSlide')}
            >
              ‹
            </button>
            <div className="slideshow-dots" role="tablist" aria-label="Slide">
              {SLIDE_KEYS.map((key, i) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-label={t('home.slideLabel', { index: i + 1, name: t(`home.${key}`) })}
                  aria-selected={i === slideIndex}
                  className={`slideshow-dot ${i === slideIndex ? 'slideshow-dot--active' : ''}`}
                  onClick={() => setSlideIndex(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="slideshow-arrow slideshow-arrow--next"
              onClick={goNext}
              aria-label={t('home.nextSlide')}
            >
              ›
            </button>
          </div>
        </section>
        <div className="slideshow-below">
          <div className="slideshow-actions">
            <Link to="/diet/add-mom" className="track-btn slideshow-action-btn">
              Add mom meal
            </Link>
            <Link to="/diet/add-baby" className="track-btn slideshow-action-btn">
              Add baby meal
            </Link>
            {firstBaby ? (
              <button
                type="button"
                className="track-btn slideshow-action-btn"
                onClick={() => setShowBabyDevModal(true)}
              >
                Add baby development
              </button>
            ) : (
              <Link to="/baby-development" className="track-btn slideshow-action-btn">
                Add baby development
              </Link>
            )}
            <button
              type="button"
              className="track-btn slideshow-action-btn"
              onClick={() => setShowMoodModal(true)}
            >
              Update mood
            </button>
          </div>
          <BehaviorTrendsSection momId={mom?.id ?? null} babyIds={babyIds} />
        </div>
        {showMoodModal && (
          <MoodModal
            momId={mom?.id ?? null}
            onClose={() => setShowMoodModal(false)}
          />
        )}
        {showBabyDevModal && firstBaby && (
          <BabyDevAddModal
            babyId={firstBaby.id}
            babyName={firstBaby.name}
            onClose={() => setShowBabyDevModal(false)}
          />
        )}
        <ChatBox />
      </main>
    </div>
  )
}
