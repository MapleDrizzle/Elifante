import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Diet from './pages/Diet'
import Sleep from './pages/Sleep'
import Mental from './pages/Mental'
import BabyDevelopment from './pages/BabyDevelopment'
import Login from './pages/Login'
import AddMomMeal from './pages/AddMomMeal'
import AddBabyMeal from './pages/AddBabyMeal'
import AddMomSleep from './pages/AddMomSleep'
import AddBabySleep from './pages/AddBabySleep'

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="diet" element={<Diet />} />
        <Route path="diet/add-mom" element={<AddMomMeal />} />
        <Route path="diet/add-baby" element={<AddBabyMeal />} />
        <Route path="sleep" element={<Sleep />} />
        <Route path="sleep/add-mom" element={<AddMomSleep />} />
        <Route path="sleep/add-baby" element={<AddBabySleep />} />
        <Route path="mental" element={<Mental />} />
        <Route path="baby-development" element={<BabyDevelopment />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
