import React from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ProblemSection } from './components/ProblemSection'
import { SolutionSection } from './components/SolutionSection'
import { UseCaseSection } from './components/UseCaseSection'
import { HowItWorks } from './components/HowItWorks'
import { TechStack, Footer } from './components/Footer'
import { ToastProvider } from '../components/ui/toast'
import { ShimmerStyles } from '../components/ui/skeleton'
import { useAuthWorking } from '../hooks/useAuthWorking'
import { Dashboard } from '../pages/Dashboard'

export default function AppWorking() {
  const { isAuthenticated, loading } = useAuthWorking()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <ToastProvider>
        <ShimmerStyles />
        <Dashboard />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <ShimmerStyles />
      <div className="min-h-screen bg-white">
        <Navbar />
        <main>
          <Hero />
          <ProblemSection />
          <SolutionSection />
          <HowItWorks />
          <UseCaseSection />
          <TechStack />
        </main>
        <Footer />
      </div>
    </ToastProvider>
  )
}
