import React from 'react';
import { MapPin, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export const TechStack = () => {
  const stack = [
    "React 18", "Tailwind CSS", "Motion", "TypeScript", "Node.js (Sim)", "Mapbox GL (Mock)"
  ];

  return (
    <section className="py-16 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Built With Modern Technologies</h3>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {stack.map((tech, idx) => (
            <span key={idx} className="px-5 py-2.5 bg-slate-50 rounded-full text-slate-600 text-sm font-medium border border-slate-100 shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-colors cursor-default">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8 mb-16">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">RapidReach</span>
            </div>
            <p className="text-sm opacity-80 leading-relaxed mb-6">
              Transforming last-mile logistics in India through AI-powered address intelligence and geolocation resolution.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={<Twitter className="w-4 h-4" />} />
              <SocialIcon icon={<Github className="w-4 h-4" />} />
              <SocialIcon icon={<Linkedin className="w-4 h-4" />} />
            </div>
          </div>

          {/* Links */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6">Hackathon Details</h4>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
               <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Track</p>
               <p className="text-white font-medium text-sm mb-4">Logistics & Smart Cities</p>
               <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Team</p>
               <p className="text-white font-medium text-sm">Team Innovators</p>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} RapidReach AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for the Hackathon
          </p>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
    {icon}
  </a>
);
