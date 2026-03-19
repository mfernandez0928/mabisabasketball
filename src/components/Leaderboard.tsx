import React from 'react';
import { Trophy, Medal, Star, User } from 'lucide-react';
import { PlayerStats } from '../types';

interface LeaderboardProps {
  players: PlayerStats[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ players }) => {
  const sortedPlayers = [...(players || [])].sort((a, b) => b.points - a.points);

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-6xl mb-12 text-center grungy-text italic">
          Game Leaders
        </h2>

        <div className="bg-card-bg border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-bottom border-white/10">
                  <th className="p-3 md:p-6 text-[10px] md:text-xs uppercase tracking-widest text-white/40">Rank</th>
                  <th className="p-3 md:p-6 text-[10px] md:text-xs uppercase tracking-widest text-white/40">Player</th>
                  <th className="p-3 md:p-6 text-[10px] md:text-xs uppercase tracking-widest text-white/40 text-center">PTS</th>
                  <th className="p-3 md:p-6 text-[10px] md:text-xs uppercase tracking-widest text-white/40 text-center">REB</th>
                  <th className="p-3 md:p-6 text-[10px] md:text-xs uppercase tracking-widest text-white/40 text-center">AST</th>
                  <th className="p-3 md:p-6 text-[10px] md:text-xs uppercase tracking-widest text-white/40 text-center">STL</th>
                  <th className="p-3 md:p-6 text-[10px] md:text-xs uppercase tracking-widest text-white/40 text-center">BLK</th>
                  <th className="p-3 md:p-6 text-[10px] md:text-xs uppercase tracking-widest text-white/40 text-right">MVPs</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player, index) => {
                  return (
                    <tr 
                      key={player.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="p-3 md:p-6">
                        <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white/5 font-mono text-[10px] md:text-base font-bold group-hover:bg-neon-blue group-hover:text-black transition-colors">
                           {index + 1}
                        </div>
                      </td>
                      <td className="p-3 md:p-6">
                        <div className="flex items-center gap-2 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                          {player.image ? (
                            <img 
                              src={player.image} 
                              alt={player.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User size={16} className="text-white/20" />
                          )}
                        </div>
                          <span className="font-bold text-xs md:text-base">{player.name}</span>
                        </div>
                      </td>
                      <td className="p-3 md:p-6 text-center font-mono text-xs md:text-base text-neon-blue">{player.points}</td>
                      <td className="p-3 md:p-6 text-center font-mono text-xs md:text-base">{player.rebounds}</td>
                      <td className="p-3 md:p-6 text-center font-mono text-xs md:text-base">{player.assists}</td>
                      <td className="p-3 md:p-6 text-center font-mono text-xs md:text-base">{player.steals}</td>
                      <td className="p-3 md:p-6 text-center font-mono text-xs md:text-base">{player.blocks}</td>
                      <td className="p-3 md:p-6 text-right font-mono text-xs md:text-base">
                        {player.mvps}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
