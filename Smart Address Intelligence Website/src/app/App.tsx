import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { UseCaseSection } from './components/UseCaseSection';
import { HowItWorks } from './components/HowItWorks';
import { TechStack, Footer } from './components/Footer';
import { ToastProvider } from '../components/ui/toast';
import { ShimmerStyles } from '../components/ui/skeleton';
import { useAuthSimple } from '../hooks/useAuthSimple';
import { Dashboard } from '../pages/Dashboard';

export default function App() {
  const { isAuthenticated, loading } = useAuthSimple();

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
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 font-sans">
        <ShimmerStyles />
        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient-x {
            animation: gradient 3s ease infinite;
            background-size: 200% 200%;
          }
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes grow {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
        `}</style>
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
  );
}
