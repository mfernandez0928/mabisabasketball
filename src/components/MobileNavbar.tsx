import React from "react";
import { motion } from "motion/react";
import { Home, Trophy, Users, MessageSquare, Calendar } from "lucide-react";
import { cn } from "../lib/utils";

interface MobileNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsManualScrolling: (value: boolean) => void;
}

const NAV_ITEMS = [
  { id: "schedule", label: "Home", icon: Home },
  { id: "stats", label: "Stats", icon: Trophy },
  { id: "leaderboard", label: "Players", icon: Users },
  { id: "mvp", label: "MVP", icon: Calendar },
  { id: "social", label: "Hype", icon: MessageSquare },
];

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  activeTab,
  setActiveTab,
  setIsManualScrolling,
}) => {
  const handleClick = (id: string) => {
    setIsManualScrolling(true);
    setActiveTab(id);

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setTimeout(() => {
      setIsManualScrolling(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] md:hidden px-6 pointer-events-none">
      <div className="max-w-[320px] mx-auto h-14 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-between px-2 shadow-[0_20px_40px_rgba(0,0,0,0.4)] pointer-events-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className="group relative flex-1 h-10 flex items-center justify-center transition-all duration-300"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-neon-blue rounded-full mx-1 my-1"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center justify-center">
                <item.icon
                  size={18}
                  className={cn(
                    "transition-colors duration-300",
                    isActive
                      ? "text-black"
                      : "text-white/40 group-hover:text-white",
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
