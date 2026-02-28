import { Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import Home from './pages/Home'
import Diet from './pages/Diet'
import Sleep from './pages/Sleep'
import Mental from './pages/Mental'
import BabyDevelopment from './pages/BabyDevelopment'

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="diet" element={<Diet />} />
        <Route path="sleep" element={<Sleep />} />
        <Route path="mental" element={<Mental />} />
        <Route path="baby-development" element={<BabyDevelopment />} />
      </Route>
    </Routes>
  )
}

export default App
