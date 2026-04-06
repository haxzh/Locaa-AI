import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './components/Login'
import Register from './components/Register'
import ForgotPassword from './components/ForgotPassword'
import DashboardAdvanced from './components/DashboardAdvanced'
import PricingPlans from './components/PricingPlans'
import UserProfile from './components/UserProfile'
import Integrations from './components/Integrations'
import ProjectSettings from './components/ProjectSettings'
import BrandingStudio from './components/BrandingStudio'
import CreateJob from './components/CreateJob'
import TeamCollaboration from './components/TeamCollaboration'
import SupportDocs from './components/SupportDocs'
import AIGenerator from './components/AIGenerator'
import Analytics from './components/analytics'
import LandingPage from './components/LandingPage'
import './index.css'

// Internal component to handle route animations
const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardAdvanced />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team-collaboration"
          element={
            <ProtectedRoute>
              <TeamCollaboration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <PricingPlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <ProtectedRoute>
              <Integrations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProjectSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branding"
          element={
            <ProtectedRoute>
              <BrandingStudio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support-docs"
          element={
            <ProtectedRoute>
              <SupportDocs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-generator"
          element={
            <ProtectedRoute>
              <AIGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
