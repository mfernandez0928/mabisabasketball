import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp, Trophy, User } from "lucide-react";
import { GameResult, PlayerStats } from "../types";
import { cn } from "../lib/utils";

interface GameChartProps {
  games: GameResult[];
  players: PlayerStats[];
}

export const GameChart: React.FC<GameChartProps> = ({ games, players }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getPlayerName = (id: string) => {
    const player = players.find((p) => p.id === id);
    return player ? player.name : id;
  };

  return (
    <section className="py-20 px-4 bg-black/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-6xl mb-12 text-center grungy-text italic">
          Game History
        </h2>

        <div className="space-y-4">
          {(games || []).map((game) => (
            <div
              key={game.id}
              className="bg-card-bg border border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === game.id ? null : game.id)
                }
                className="w-full p-6 flex flex-wrap items-center justify-between gap-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                  <div className="text-center sm:text-left">
                    <div className="text-[10px] md:text-xs text-white/40 uppercase tracking-widest font-mono">
                      {game.date}
                    </div>
                    <div className="text-xs md:text-sm font-semibold text-white/60">
                      {game.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:gap-8">
                    <div className="text-center">
                      <div className="text-[10px] text-white/40 uppercase mb-1">
                        {game.teamWhite.name || "White"}
                      </div>
                      <div
                        className={cn(
                          "text-2xl md:text-3xl font-display",
                          game.teamWhite.score > game.teamBlue.score
                            ? "text-neon-blue"
                            : "text-white/40",
                        )}
                      >
                        {game.teamWhite.score}
                      </div>
                    </div>
                    <div className="text-lg md:text-xl font-display text-white/20">
                      VS
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-white/40 uppercase mb-1">
                        {game.teamBlue.name || "Blue"}
                      </div>
                      <div
                        className={cn(
                          "text-2xl md:text-3xl font-display",
                          game.teamBlue.score > game.teamWhite.score
                            ? "text-neon-red"
                            : "text-white/40",
                        )}
                      >
                        {game.teamBlue.score}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <Trophy size={14} className="text-yellow-500" />
                    <span className="text-xs font-mono">
                      MVP: {getPlayerName(game.mvpId)}
                    </span>
                  </div>
                  {expandedId === game.id ? <ChevronUp /> : <ChevronDown />}
                </div>
              </button>

              <AnimatePresence>
                {expandedId === game.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-6 grid md:grid-cols-2 gap-8">
                      {/* Team 1 Box Score */}
                      <div>
                        <h4 className="text-neon-blue mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-neon-blue rounded-full" />
                          {game.teamWhite.name || "Team White"} Box Score
                        </h4>
                        <div className="space-y-2">
                          {(game.teamWhite.players || []).map((p, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center p-2 bg-white/5 rounded border border-white/5"
                            >
                              <span className="text-sm font-medium">
                                {p.name}
                              </span>
                              <div className="flex gap-3 text-[10px] font-mono">
                                <span className="text-neon-blue font-bold">
                                  {p.pts}P
                                </span>
                                <span className="text-white/40">{p.reb}R</span>
                                <span className="text-white/40">{p.ast}A</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team 2 Box Score */}
                      <div>
                        <h4 className="text-neon-red mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-neon-red rounded-full" />
                          {game.teamBlue.name || "Team Blue"} Box Score
                        </h4>
                        <div className="space-y-2">
                          {(game.teamBlue.players || []).map((p, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center p-2 bg-white/5 rounded border border-white/5"
                            >
                              <span className="text-sm font-medium">
                                {p.name}
                              </span>
                              <div className="flex gap-3 text-[10px] font-mono">
                                <span className="text-neon-red font-bold">
                                  {p.pts}P
                                </span>
                                <span className="text-white/40">{p.reb}R</span>
                                <span className="text-white/40">{p.ast}A</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
