import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Trophy, Users, MessageSquare, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'stats', label: 'Stats', icon: Trophy },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'hype', label: 'Hype', icon: MessageSquare },
  { id: 'settings', label: 'More', icon: Settings },
];

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden px-6 pb-8 pointer-events-none">
      <div className="max-w-md mx-auto h-20 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto relative">
        {/* Active Indicator Background */}
        <div className="absolute inset-0 flex items-center justify-around px-4 pointer-events-none">
          {NAV_ITEMS.map((item) => (
            <div key={item.id} className="relative w-12 h-12 flex items-center justify-center">
              {activeTab === item.id && (
                <motion.div 
                  layoutId="nav-glow"
                  className="absolute -top-12 w-16 h-16 bg-neon-blue/20 blur-2xl rounded-full"
                />
              )}
            </div>
          ))}
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative w-12 h-12 flex flex-col items-center justify-center group"
            >
              {/* Active Circle Lift */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-circle"
                    initial={{ y: 20, opacity: 0, scale: 0.5 }}
                    animate={{ y: -35, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute w-14 h-14 bg-neon-blue rounded-full border-4 border-black shadow-[0_10px_20px_rgba(0,242,255,0.3)] flex items-center justify-center z-10"
                  >
                    <item.icon size={24} className="text-black" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inactive Icon */}
              <div className={cn(
                "transition-all duration-300",
                isActive ? "opacity-0 scale-50" : "opacity-40 scale-100 group-hover:opacity-80"
              )}>
                <item.icon size={22} className="text-white" />
              </div>

              {/* Label */}
              <span className={cn(
                "text-[8px] font-mono uppercase tracking-widest mt-1 transition-all duration-300",
                isActive ? "text-neon-blue font-bold translate-y-2" : "text-white/20"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
