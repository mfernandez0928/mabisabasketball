import React, { useRef } from "react";
import { Trophy, Zap, Download, Share2 } from "lucide-react";
import { Award } from "../types";
import { toPng } from "html-to-image";

interface MVPSpotlightProps {
  awards: Award[];
}

export const MVPSpotlight: React.FC<MVPSpotlightProps> = ({ awards = [] }) => {
  const posterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  if (!awards || awards.length === 0) return null;

  const currentAwards = awards.filter((a) => a.isCurrent);
  const historyAwards = awards
    .filter((a) => !a.isCurrent)
    .sort(
      (a, b) => new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime(),
    );

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
            Honoring the best from the latest run
          </p>
        </div>

        {currentAwards.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {currentAwards.map((award, index) => (
              <div
                key={award.id || `current-${award.type}-${index}`}
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
                    className={`absolute inset-0 bg-gradient-to-t ${award.type === "Player of the Night" ? "from-neon-blue/40" : "from-neon-red/40"} via-transparent to-transparent`}
                  />

                  {/* Large Background Text */}
                  <div className="absolute top-10 left-0 right-0 flex justify-center opacity-10 pointer-events-none">
                    <span className="text-[8rem] font-display leading-none rotate-[-5deg] whitespace-nowrap">
                      {award.type === "Player of the Night" ? "MVP" : "HUSTLE"}
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
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    {/* Top Label */}
                    <div className="flex justify-between items-start">
                      <div
                        className={`px-3 py-1.5 rounded-lg font-display text-lg skew-x-[-12deg] ${award.type === "Player of the Night" ? "bg-neon-blue text-black" : "bg-neon-red text-white"}`}
                      >
                        {award.type === "Player of the Night"
                          ? "PLAYER OF THE NIGHT"
                          : "HUSTLE PLAYER"}
                      </div>
                      <div className="bg-black/80 backdrop-blur-md border border-white/10 p-2 rounded-lg">
                        {award.type === "Player of the Night" ? (
                          <Trophy className="text-neon-blue" size={18} />
                        ) : (
                          <Zap className="text-neon-red" size={18} />
                        )}
                      </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="space-y-4">
                      <div className="flex items-end gap-3">
                        {/* Stats Column */}
                        <div className="space-y-1.5 pb-1">
                          {[
                            { label: "PTS", value: award.stats.pts },
                            { label: "REB", value: award.stats.reb },
                            { label: "AST", value: award.stats.ast },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="flex items-baseline gap-1.5"
                            >
                              <span className="text-[8px] font-mono text-white/40 uppercase">
                                {stat.label}
                              </span>
                              <span className="text-xl font-display text-white">
                                {stat.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Name Column */}
                        <div className="flex-1">
                          <h3 className="text-4xl md:text-5xl font-display leading-none tracking-tighter uppercase break-words">
                            {award.playerName.split(" ").map((part, i) => (
                              <span
                                key={i}
                                className={
                                  i % 2 === 0
                                    ? "text-white"
                                    : award.type === "Player of the Night"
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
                      <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/5">
                        <p className="text-xs text-white/80 italic leading-snug">
                          "{award.caption}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Branding */}
                  <div className="absolute bottom-3 right-3 opacity-50">
                    <div className="text-[6px] font-mono text-white/40 uppercase tracking-[0.3em]">
                      Mabisa Basketball Club
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleExport(award.id, award.playerName)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group"
                  >
                    <Download
                      size={16}
                      className="text-neon-blue group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[10px] uppercase tracking-widest font-bold">
                      Export
                    </span>
                  </button>
                  <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                    <Share2 size={16} className="text-white/60" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-white/40 font-mono uppercase tracking-widest">
              No current awards spotlighted
            </p>
          </div>
        )}

        {/* History Section */}
        {historyAwards.length > 0 && (
          <div className="space-y-10 pt-20 border-t border-white/5">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-display italic uppercase tracking-tighter">
                Award <span className="text-neon-blue">History</span>
              </h3>
              <p className="text-white/20 font-mono text-[10px] uppercase tracking-[0.2em]">
                Previous Players of the Night & Hustle Players
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {historyAwards.map((award, index) => (
                <div
                  key={award.id || `history-${index}`}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 group hover:border-neon-blue/50 transition-all"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-black relative">
                    <img
                      src={
                        award.photoUrl ||
                        "https://picsum.photos/seed/player/400/400"
                      }
                      alt={award.playerName}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                      referrerPolicy="no-referrer"
                    />
                    <div
                      className={`absolute top-2 left-2 p-1 rounded bg-black/80 backdrop-blur-sm border border-white/10`}
                    >
                      {award.type === "Player of the Night" ? (
                        <Trophy size={10} className="text-neon-blue" />
                      ) : (
                        <Zap size={10} className="text-neon-red" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[8px] font-mono text-white/40 uppercase truncate">
                      {award.gameDate}
                    </div>
                    <div className="text-xs font-bold truncate">
                      {award.playerName}
                    </div>
                    <div className="flex gap-2 text-[10px] font-mono text-neon-blue">
                      <span>{award.stats.pts}P</span>
                      <span>{award.stats.reb}R</span>
                      <span>{award.stats.ast}A</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
