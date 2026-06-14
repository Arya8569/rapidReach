import React from 'react';
import { motion } from 'motion/react';
import { FileCheck, Languages, Map, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export const SolutionSection = () => {
  const features = [
    {
      icon: <FileCheck className="w-6 h-6" />,
      title: "Smart Normalization",
      description: "Converts messy, informal text into structured, standardized address formats automatically.",
    },
    {
      icon: <Languages className="w-6 h-6" />,
      title: "Multilingual Support",
      description: "Understands and processes addresses in English, Hindi, and mixed regional scripts (Hinglish).",
    },
    {
      icon: <Map className="w-6 h-6" />,
      title: "Landmark Resolution",
      description: "Intelligently maps informal landmarks like 'Near Shiva Temple' to precise geocoordinates.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Predictive Correction",
      description: "Fixes typos, incorrect pincodes, and ambiguous locality names in real-time.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Confidence Scoring",
      description: "Assigns a reliability score to every address, flagging low-confidence ones for manual review.",
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-slate-900 text-white relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-700"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-1000 delay-500"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 md:mb-24">
          <div className="max-w-2xl">
            <span className="text-indigo-400 font-semibold tracking-wider text-xs md:text-sm uppercase mb-3 block">Our Solution</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">AI-First Address Intelligence</h2>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
              A comprehensive suite of tools designed to decode the chaos of Indian addresses with 99.8% accuracy.
            </p>
          </div>
          
          <button className="hidden md:flex items-center gap-2 text-white font-semibold hover:text-indigo-300 transition-colors group">
             Explore Documentation <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className="group p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden backdrop-blur-sm"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-[100px] -translate-y-8 translate-x-8 transition-transform group-hover:scale-150 duration-700 ease-out"></div>
              
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-300 border border-indigo-500/10">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-indigo-300 transition-colors">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                {feature.description}
              </p>
            </motion.div>
          ))}
          
          {/* Last Card CTA */}
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.5 }}
             className="p-8 rounded-2xl border border-dashed border-slate-700 flex flex-col justify-center items-center text-center hover:bg-slate-800/30 transition-colors cursor-pointer group"
          >
             <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
               <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-white" />
             </div>
             <h3 className="text-lg font-bold text-slate-300 mb-1">View All Features</h3>
             <p className="text-sm text-slate-500">Discover the full API capability</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
