import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative pt-24 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-white overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full blur-[100px] opacity-60 -translate-y-1/2 translate-x-1/3 animate-pulse duration-10000"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/40 to-emerald-100/40 rounded-full blur-[80px] opacity-60 translate-y-1/3 -translate-x-1/4"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-indigo-100 shadow-sm backdrop-blur-sm text-indigo-700 text-xs md:text-sm font-semibold tracking-wide">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              NEW: Multi-lingual Support Added
            </span>
          </motion.div>
          
          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.15] md:leading-[1.1]"
          >
            Smart Address Intelligence for <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x bg-[length:200%_auto]">
              Last-Mile Logistics
            </span>
          </motion.h1>
          
          {/* Subheading */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed px-4"
          >
            Turn unstructured, ambiguous, and multilingual addresses into precise geolocation data with our AI-powered normalization engine.
          </motion.p>
          
          {/* CTA Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 w-full sm:w-auto px-4"
          >
            <button 
              onClick={() => {
                // Trigger sign in modal
                const event = new CustomEvent('openAuthModal');
                window.dispatchEvent(event);
              }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-base md:text-lg transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Stats / Trust Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-20 pt-10 border-t border-slate-200/60 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4"
          >
            {[
              { label: "Address Accuracy", value: "99.8%", icon: ShieldCheck },
              { label: "Languages", value: "12+", icon: null },
              { label: "Latency", value: "<50ms", icon: Zap },
              { label: "Cost Reduction", value: "35%", icon: null },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-2">
                <div className="text-2xl md:text-4xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                  {stat.value}
                  {stat.icon && <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-indigo-500 hidden sm:block" />}
                </div>
                <div className="text-sm font-medium text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
