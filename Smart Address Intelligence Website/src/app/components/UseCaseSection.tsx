import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Check, X, ArrowLeftRight } from 'lucide-react';

export const UseCaseSection = () => {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');

  return (
    <section id="use-cases" className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 md:mb-20">
          <span className="text-indigo-600 font-semibold tracking-wider text-xs md:text-sm uppercase mb-3 block">Real World Impact</span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Before vs. After</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            See how RapidReach transforms ambiguous customer inputs into actionable logistics data.
          </p>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex justify-center mb-10">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full max-w-xs">
            <button 
              onClick={() => setActiveTab('before')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'before' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500'}`}
            >
              Before ❌
            </button>
            <button 
              onClick={() => setActiveTab('after')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'after' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
            >
              After ✅
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto bg-slate-50/50 rounded-[2rem] p-6 md:p-12 border border-slate-200/60 relative overflow-hidden">
          
          {/* Desktop Grid Layout */}
          <div className="hidden md:grid md:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
            <BeforeCard />
            
            {/* Center Connector */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
               <div className="w-12 h-12 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center text-indigo-500">
                 <ArrowLeftRight className="w-5 h-5" />
               </div>
            </div>

            <AfterCard />
          </div>

          {/* Mobile Swappable View */}
          <div className="md:hidden min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'before' ? (
                <motion.div 
                  key="before"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <BeforeCard />
                </motion.div>
              ) : (
                <motion.div 
                  key="after"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AfterCard />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
};

const BeforeCard = () => (
  <div className="space-y-6 h-full flex flex-col justify-center">
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide self-start">
      Raw Input
    </div>
    <div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2">The Chaos</h3>
      <p className="text-slate-500">Unstructured, informal text that confuses traditional geocoders.</p>
    </div>
    
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 relative group hover:border-red-200 transition-colors">
      <div className="absolute -left-3 top-8 w-8 h-8 bg-red-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-md">
        <X className="w-4 h-4" />
      </div>
      <div className="font-mono text-sm text-slate-400 mb-2">Input String:</div>
      <p className="text-lg md:text-xl text-slate-700 italic font-medium leading-relaxed">
        "Near the big tree, after the chai shop, first lane from main road, opp sharma ji house"
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <span className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100">Missing Pincode</span>
        <span className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100">Ambiguous Landmark</span>
      </div>
    </div>
  </div>
);

const AfterCard = () => (
  <div className="space-y-6 h-full flex flex-col justify-center">
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide self-start">
      AI Output
    </div>
    <div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2">The Clarity</h3>
      <p className="text-slate-500">Standardized, geocoded, and verified data ready for dispatch.</p>
    </div>

    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-emerald-500/10 border border-emerald-100 relative overflow-hidden group hover:border-emerald-300 transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full -z-0"></div>
      
      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg md:text-xl">
              House No. 12, Lane 1
            </p>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Behind Sharma Chai Stall, MG Road,<br/>
              Indirapuram, Ghaziabad, UP - 201014
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Confidence Score</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-emerald-600">98.5%</span>
              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-[98.5%] h-full bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Lat/Lng: <span className="font-mono text-slate-700 font-semibold ml-1">28.6412, 77.3711</span></span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
