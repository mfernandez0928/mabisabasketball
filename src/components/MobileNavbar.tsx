import React, { useState, useEffect } from "react";
import { Home, BarChart2, Trophy, Users, Globe } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export const MobileNavbar: React.FC = () => {
  const [activeTab, setActiveTab] = useState("schedule");
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = [
    { id: "schedule", icon: Home, label: "Home" },
    { id: "stats", icon: BarChart2, label: "History" },
    { id: "mvp", icon: Trophy, label: "MVP" },
    { id: "leaderboard", icon: Users, label: "Leaders" },
    { id: "social", icon: Globe, label: "Social" },
  ];

  const scrollToSection = (id: string, index: number) => {
    setActiveTab(id);
    setActiveIndex(index);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Update active tab on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = navItems.findIndex(
              (item) => item.id === entry.target.id,
            );
            if (index !== -1) {
              setActiveTab(entry.target.id);
              setActiveIndex(index);
            }
          }
        });
      },
      { threshold: 0.5 },
    );

    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[150] px-4 pb-4 pointer-events-none">
      <div className="relative max-w-[400px] mx-auto w-full h-[70px] pointer-events-auto">
        {/* The Curved Background with Moving Notch */}
        <div className="absolute inset-0 rounded-2xl drop-shadow-[0_-10px_25px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute inset-0 bg-[#121214]/95 backdrop-blur-3xl" />

          {/* Moving Notch SVG */}
          <motion.div
            animate={{ x: `calc(${activeIndex * 20}% + 10%)` }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="absolute top-0 left-0 w-0 h-full flex justify-center items-start"
          >
            <div className="relative w-32 h-10 -translate-x-1/2">
              <svg
                viewBox="0 0 100 40"
                className="w-full h-full fill-[#0a0a0c]"
              >
                <path d="M0 0 C 15 0 25 0 30 10 C 35 18 65 18 70 10 C 75 0 85 0 100 0 Z" />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <div className="relative h-full flex items-center justify-around z-10">
          {navItems.map((item, index) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id, index)}
                className="relative flex-1 flex flex-col items-center justify-center h-full"
              >
                {/* Lifted Circle for Active Item */}
                <div className="relative h-10 w-full flex items-center justify-center">
                  <motion.div
                    animate={{
                      y: isActive ? -28 : 0,
                      scale: isActive ? 1.1 : 0.8,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 20,
                      delay: isActive ? 0 : 0.05,
                    }}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500",
                      isActive
                        ? "bg-neon-blue shadow-[0_0_30px_rgba(0,243,255,0.8)] text-black"
                        : "bg-transparent text-white/30",
                    )}
                  >
                    <item.icon
                      size={20}
                      className={cn(isActive ? "scale-120" : "scale-100")}
                    />
                  </motion.div>
                </div>

                {/* Label */}
                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.4,
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -20 : 0,
                  }}
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-tighter mt-1 transition-colors",
                    isActive ? "text-white" : "text-white/40",
                  )}
                >
                  {item.label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
