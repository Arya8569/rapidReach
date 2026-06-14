import React, { useState, useEffect } from 'react';
import { MapPin, Menu, X, ChevronRight, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthWorking } from '../../hooks/useAuthWorking';
import { AuthModal } from '../../components/auth/AuthModal';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const { user, isAuthenticated, signOut } = useAuthWorking();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOpenAuthModal = () => setAuthModalOpen(true);
    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "Demo", href: "#demo" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-slate-200/50 py-3 shadow-sm'
            : 'bg-transparent border-transparent py-5 md:py-6'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 z-50 relative">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <MapPin className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </div>
            <span className={`text-xl md:text-2xl font-bold tracking-tight ${scrolled || mobileMenuOpen ? 'text-slate-900' : 'text-slate-900'}`}>
              RapidReach
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full ${scrolled ? 'bg-slate-100/50' : 'bg-white/40 backdrop-blur-sm'}`}>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-white rounded-full transition-all duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="group px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/25 flex items-center gap-2"
              >
                Get Started
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden relative z-50 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-white md:hidden flex flex-col pt-24 px-6 pb-8 h-[100dvh]"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link, idx) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.1 }}
                  className="text-2xl font-bold text-slate-800 flex items-center justify-between group py-2 border-b border-slate-100"
                >
                  {link.name}
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </motion.a>
              ))}
            </div>
            
            {/* Mobile Auth */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-auto space-y-3"
            >
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full py-3 bg-slate-200 text-slate-700 text-lg font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full py-4 bg-indigo-600 text-white text-lg font-bold rounded-xl shadow-xl shadow-indigo-200"
                >
                  Get Started Now
                </button>
              )}
              <p className="text-center text-sm text-slate-400">
                © {new Date().getFullYear()} RapidReach AI
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </>
  );
};
