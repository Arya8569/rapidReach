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

export default function AppSimple() {
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
