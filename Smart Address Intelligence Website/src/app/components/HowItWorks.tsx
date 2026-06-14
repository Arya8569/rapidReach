import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Cpu, Database, MapPin, MessageSquare, Search } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Raw Input",
      desc: "User enters informal text"
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Analysis",
      desc: "NLP detects language & entities"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Mapping",
      desc: "Matches landmarks to geo-db"
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "Correction",
      desc: "AI fixes errors & formats"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Delivery Ready",
      desc: "Precise coordinates generated"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-slate-50 border-y border-slate-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How RapidReach Works</h2>
          <p className="text-lg text-slate-600">From chaos to clarity in five simple steps.</p>
        </div>

        {/* Desktop View: Horizontal */}
        <div className="hidden lg:flex justify-between items-start max-w-6xl mx-auto relative px-10">
          {/* Connecting Line */}
          <div className="absolute top-10 left-0 w-full h-1 bg-slate-200 -z-0 rounded-full">
             <div className="absolute inset-y-0 left-0 bg-indigo-500 w-full origin-left scale-x-0 animate-[grow_2s_ease-out_forwards]"></div>
          </div>

          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center w-48 group">
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, type: "spring", stiffness: 200 }}
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
                className="w-20 h-20 rounded-2xl bg-white border-4 border-indigo-50 shadow-xl flex items-center justify-center text-indigo-600 mb-6 transition-all duration-300"
              >
                {step.icon}
              </motion.div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">{step.title}</h3>
              <p className="text-sm text-slate-500 px-2 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile View: Vertical Stepper */}
        <div className="lg:hidden max-w-md mx-auto relative pl-4">
          {/* Vertical Line */}
          <div className="absolute top-4 bottom-4 left-[27px] w-0.5 bg-slate-200"></div>

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative flex items-center gap-6"
              >
                {/* Icon Circle */}
                <div className="relative z-10 w-14 h-14 rounded-full bg-white border-4 border-indigo-50 shadow-md flex-shrink-0 flex items-center justify-center text-indigo-600">
                  {step.icon}
                </div>
                
                {/* Text Content */}
                <div className="flex-1 p-5 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
