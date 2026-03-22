import React from "react";
import { Logo } from "./Logo";
import { ASSETS } from "../constants/assets";

const PARTNERS = [
  { name: "Mabisa Basketball", logo: ASSETS.LOGO },
  { name: "Jiko Katipunan", logo: ASSETS.PARTNERS.PARTNER_1 },
  { name: "Ignite", logo: ASSETS.PARTNERS.PARTNER_2 },
];

export const PartnersSection: React.FC = () => {
  // Duplicate the partners list for seamless scrolling
  const scrollingPartners = [
    ...PARTNERS,
    ...PARTNERS,
    ...PARTNERS,
    ...PARTNERS,
  ];

  return (
    <section className="py-20 border-t border-white/5 bg-black/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="text-center">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 mb-4">
            Official Partners & Sponsors
          </h3>
          <div className="h-[1px] w-12 bg-neon-blue mx-auto" />
        </div>
      </div>

      <div className="relative flex overflow-hidden group">
        {/* Gradient Overlays */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-dark-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-dark-bg to-transparent z-10 pointer-events-none" />

        {/* Scrolling Container */}
        <div className="flex gap-12 md:gap-24 items-center whitespace-nowrap [animation:marquee_30s_linear_infinite] hover:[animation-play-state:paused]">
          {scrollingPartners.map((partner, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-4 group/item transition-all duration-500 shrink-0"
            >
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover/item:scale-110 group-hover/item:rotate-6">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="w-full h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = ASSETS.LOGO;
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-neon-blue/20 blur-2xl rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/20 group-hover/item:text-white/60 transition-colors">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
