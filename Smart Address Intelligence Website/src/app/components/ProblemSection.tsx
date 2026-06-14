import React from 'react';
import { MapPinOff, Globe, Navigation, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

export const ProblemSection = () => {
  const problems = [
    {
      icon: <MapPinOff className="w-6 h-6 text-red-600" />,
      title: "Unstructured Data",
      description: "60% of Tier-2/3 addresses lack standardized formats, postal codes, or clear street names.",
      color: "bg-red-50",
      borderColor: "hover:border-red-200"
    },
    {
      icon: <Globe className="w-6 h-6 text-orange-600" />,
      title: "Language Barriers",
      description: "Addresses are often mixed with Hindi, regional dialects, and transliterated text inputs.",
      color: "bg-orange-50",
      borderColor: "hover:border-orange-200"
    },
    {
      icon: <Navigation className="w-6 h-6 text-blue-600" />,
      title: "Landmark Dependence",
      description: "Reliance on 'Near the big tree' or 'Behind the temple' makes automated routing impossible.",
      color: "bg-blue-50",
      borderColor: "hover:border-blue-200"
    },
    {
      icon: <TrendingDown className="w-6 h-6 text-purple-600" />,
      title: "High Failure Costs",
      description: "Last-mile failures increase logistics costs by up to 30% due to returns and re-attempts.",
      color: "bg-purple-50",
      borderColor: "hover:border-purple-200"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-white relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="text-indigo-600 font-semibold tracking-wider text-xs md:text-sm uppercase mb-3 block">The Challenge</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Why Last-Mile Delivery <br className="hidden md:block" /> Fails in India
          </h2>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
            The complexity of Indian addresses creates a massive bottleneck for logistics companies, leading to lost packages and frustrated customers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {problems.map((problem, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className={`p-6 md:p-8 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 ${problem.borderColor}`}
            >
              <div className={`w-14 h-14 rounded-2xl ${problem.color} flex items-center justify-center mb-6 shadow-inner`}>
                {problem.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{problem.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
