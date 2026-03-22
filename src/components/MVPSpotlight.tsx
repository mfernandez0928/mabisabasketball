import React, { useRef } from "react";
import { motion } from "motion/react";
import { Trophy, Zap, Download, Share2 } from "lucide-react";
import { Award } from "../types";
import { toPng } from "html-to-image";

interface MVPSpotlightProps {
  awards: Award[];
}

export const MVPSpotlight: React.FC<MVPSpotlightProps> = ({ awards = [] }) => {
  const posterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  if (!awards || awards.length === 0) return null;

  const handleExport = async (awardId: string, playerName: string) => {
    const node = posterRefs.current[awardId];
    if (!node) return;

    try {
      const dataUrl = await toPng(node, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${playerName.replace(/\s+/g, "_")}_Spotlight.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto space-y-20">
        <div className="text-center space-y-4">
          <h2 className="text-5xl md:text-7xl grungy-text italic">
            The Spotlight
          </h2>
          <p className="text-white/40 font-mono text-sm uppercase tracking-widest">
            Honoring the best from the last run
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {awards.map((award, index) => (
            <div
              key={award.id || `${award.type}-${index}`}
              className="space-y-6"
            >
              {/* Poster Container */}
              <div
                ref={(el) => (posterRefs.current[award.id] = el)}
                className="relative aspect-[4/5] w-full bg-black overflow-hidden rounded-3xl border border-white/10 shadow-2xl group"
              >
                {/* Background Textures/Gradients */}
                <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${award.type === "player_of_the_night" ? "from-neon-blue/40" : "from-neon-red/40"} via-transparent to-transparent`}
                />

                {/* Large Background Text */}
                <div className="absolute top-10 left-0 right-0 flex justify-center opacity-10 pointer-events-none">
                  <span className="text-[12rem] font-display leading-none rotate-[-5deg] whitespace-nowrap">
                    {award.type === "player_of_the_night" ? "MVP" : "HUSTLE"}
                  </span>
                </div>

                {/* Player Photo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={
                      award.photoUrl ||
                      "https://picsum.photos/seed/player/800/1000"
                    }
                    alt={award.playerName}
                    className="h-full w-full object-cover object-top grayscale hover:grayscale-0 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Overlay Elements */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  {/* Top Label */}
                  <div className="flex justify-between items-start">
                    <div
                      className={`px-4 py-2 rounded-lg font-display text-xl skew-x-[-12deg] ${award.type === "player_of_the_night" ? "bg-neon-blue text-black" : "bg-neon-red text-white"}`}
                    >
                      {award.type === "player_of_the_night"
                        ? "PLAYER OF THE NIGHT"
                        : "HUSTLE PLAYER"}
                    </div>
                    <div className="bg-black/80 backdrop-blur-md border border-white/10 p-2 rounded-lg">
                      {award.type === "player_of_the_night" ? (
                        <Trophy className="text-neon-blue" />
                      ) : (
                        <Zap className="text-neon-red" />
                      )}
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="space-y-4">
                    <div className="flex items-end gap-4">
                      {/* Stats Column */}
                      <div className="space-y-2 pb-2">
                        {[
                          { label: "PTS", value: award.stats.pts },
                          { label: "REB", value: award.stats.reb },
                          { label: "AST", value: award.stats.ast },
                          //{ label: "STL", value: award.stats.stl },
                          //{ label: "BLK", value: award.stats.blk },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="flex items-baseline gap-2"
                          >
                            <span className="text-[10px] font-mono text-white/40 uppercase">
                              {stat.label}
                            </span>
                            <span className="text-2xl font-display text-white">
                              {stat.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Name Column */}
                      <div className="flex-1">
                        <h3 className="text-6xl md:text-8xl font-display leading-none tracking-tighter uppercase break-words">
                          {award.playerName.split(" ").map((part, i) => (
                            <span
                              key={i}
                              className={
                                i % 2 === 0
                                  ? "text-white"
                                  : award.type === "player_of_the_night"
                                    ? "text-neon-blue"
                                    : "text-neon-red"
                              }
                            >
                              {part}
                              <br />
                            </span>
                          ))}
                        </h3>
                      </div>
                    </div>

                    {/* Caption */}
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/5">
                      <p className="text-sm text-white/80 italic leading-snug">
                        "{award.caption}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Branding */}
                <div className="absolute bottom-4 right-4 opacity-50">
                  <div className="text-[8px] font-mono text-white/40 uppercase tracking-[0.3em]">
                    Mabisa Basketball Club
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleExport(award.id, award.playerName)}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
                >
                  <Download
                    size={20}
                    className="text-neon-blue group-hover:scale-110 transition-transform"
                  />
                  <span className="text-xs uppercase tracking-widest font-bold">
                    Export Poster
                  </span>
                </button>
                <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                  <Share2 size={20} className="text-white/60" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
