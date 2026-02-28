import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  useWeeklySleep,
  useTodayDiet,
  useLatestMood,
  useBabyDevelopment,
} from '../hooks/useDashboardData'
import SleepChart from '../components/dashboard/SleepChart'
import DietChart from '../components/dashboard/DietChart'
import MoodSlide from '../components/dashboard/MoodSlide'
import DevelopmentSlide from '../components/dashboard/DevelopmentSlide'

const SLIDE_LABELS = ['Sleep', 'Diet', 'Mood', 'Development']
const AUTO_SLIDE_MS = 6000

export default function Home(): JSX.Element {
  const { displayName, mom, babies } = useAuth()
  const [slideIndex, setSlideIndex] = useState(0)

  const goNext = useCallback(() => {
    setSlideIndex((i) => (i + 1) % SLIDE_LABELS.length)
  }, [])
  const goPrev = useCallback(() => {
    setSlideIndex((i) => (i - 1 + SLIDE_LABELS.length) % SLIDE_LABELS.length)
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
  const { data: dietData, loading: dietLoading } = useTodayDiet(mom?.id ?? null)
  const { mood, loading: moodLoading } = useLatestMood(mom?.id ?? null)
  const { data: devData, loading: devLoading } = useBabyDevelopment(
    firstBaby?.id ?? null,
    firstBaby?.name ?? '',
    firstBaby?.birth_date ?? ''
  )

  return (
    <>
      <header className="app-header app-header--home">
        <h1 className="home-greeting">Hello, {displayName}!</h1>
        <p className="app-header-tagline">Your postpartum companion</p>
      </header>
      <main className="app-main app-main--dashboard">
        <section className="slideshow" aria-label="Weekly summary slideshow">
          <div className="slideshow-track">
            <div
              className="slideshow-slides"
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
            >
              <div className="slideshow-slide">
                <SleepChart data={sleepData} loading={sleepLoading} />
              </div>
              <div className="slideshow-slide">
                <DietChart data={dietData} loading={dietLoading} />
              </div>
              <div className="slideshow-slide">
                <MoodSlide mood={mood} loading={moodLoading} />
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
              aria-label="Previous slide"
            >
              ‹
            </button>
            <div className="slideshow-dots" role="tablist" aria-label="Slide">
              {SLIDE_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-label={`Slide ${i + 1}: ${label}`}
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
              aria-label="Next slide"
            >
              ›
            </button>
          </div>
        </section>
      </main>
    </>
  )
}
