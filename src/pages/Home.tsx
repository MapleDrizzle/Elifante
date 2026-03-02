import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
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
                  height={360}
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
        <ChatBox />
      </main>
    </div>
  )
}
