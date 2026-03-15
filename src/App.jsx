import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Header from './components/Header/Header.jsx'
import CookieBanner from './components/CookieBanner/CookieBanner.jsx'
import HomePage from './pages/HomePage/HomePage.jsx'
import PsychologistsPage from './pages/PsychologistsPage/PsychologistsPage.jsx'
import FavoritesPage from './pages/FavoritesPage/FavoritesPage.jsx'
import PrivacyPage from './pages/PrivacyPage/PrivacyPage.jsx'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.jsx'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/psychologists" element={<PsychologistsPage />} />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <CookieBanner />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
