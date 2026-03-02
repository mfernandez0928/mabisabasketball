import React, { useRef } from "react";
import { motion } from "motion/react";
import { Share2, Trophy, Zap, Download } from "lucide-react";
import { PlayerStats } from "../types";
import * as htmlToImage from "html-to-image";

interface MVPSpotlightProps {
  player: PlayerStats;
  description?: string;
  stats?: { pts: number; reb: number; ast: number };
}

export const MVPSpotlight: React.FC<MVPSpotlightProps> = ({
  player,
  description,
  stats,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Use game stats if provided, otherwise fallback to season stats
  const displayStats = stats || {
    pts: player.points,
    reb: player.rebounds,
    ast: player.assists,
    stl: player.steals,
    blk: player.blocks,
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    try {
      // Generate the image from the card element
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#0a0a0c",
        style: {
          transform: "scale(1)",
          borderRadius: "24px",
        },
      });

      // Convert dataUrl to a File object for sharing
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `MVP_${player.name}.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `MVP Spotlight: ${player.name}`,
          text: `Check out the MVP of the Day at Mabisa Basketball: ${player.name}!`,
        });
      } else {
        // Fallback: Download the image
        const link = document.createElement("a");
        link.download = `MVP_${player.name}.png`;
        link.href = dataUrl;
        link.click();
        alert(
          "Image downloaded! You can now upload this picture directly to your Facebook or Instagram story.",
        );
      }
    } catch (err) {
      console.error("Error sharing image:", err);
      alert("Could not generate shareable image. Try taking a screenshot!");
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-6xl mb-12 text-center grungy-text italic">
          MVP of the Day
        </h2>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Digital Trading Card */}
          <div className="relative perspective-1000 max-w-lg mx-auto w-full">
            <motion.div
              ref={cardRef}
              whileHover={{ rotateY: 5, rotateX: -5 }}
              className="relative aspect-[4/5] w-full group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue via-transparent to-neon-red opacity-20 group-hover:opacity-40 transition-opacity rounded-3xl" />
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-red rounded-3xl blur opacity-25 group-hover:opacity-50 transition-opacity" />

              <div className="relative h-full bg-card-bg border border-white/10 rounded-3xl overflow-hidden flex flex-col">
                {/* Card Header */}
                <div className="p-6 flex justify-between items-start">
                  <div>
                    <div className="text-neon-blue font-mono text-sm tracking-tighter">
                      KING OF THE COURT
                    </div>
                    <h3 className="text-4xl font-display uppercase tracking-tighter">
                      {player.name}
                    </h3>
                  </div>
                  <div className="bg-neon-red text-white px-3 py-1 rounded font-display text-xl -rotate-12 shadow-lg">
                    MVP
                  </div>
                </div>

                {/* Player Image */}
                <div className="flex-1 relative overflow-hidden bg-black/40">
                  <img
                    src={player.image}
                    alt={player.name}
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card-bg/80 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Stats Bar */}
                <div className="p-6 grid grid-cols-3 gap-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-display text-neon-blue">
                      {displayStats.pts}
                    </div>
                    <div className="text-[10px] uppercase text-white/40 tracking-widest">
                      PTS
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-display text-white">
                      {displayStats.reb}
                    </div>
                    <div className="text-[10px] uppercase text-white/40 tracking-widest">
                      REB
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-display text-neon-red">
                      {displayStats.stl}
                    </div>
                    <div className="text-[10px] uppercase text-white/40 tracking-widest">
                      STL
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Player Details & Actions */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-4xl font-display text-neon-blue uppercase tracking-tighter">
                Dominance on Display
              </h3>
              <p className="text-lg text-white/70 leading-relaxed">
                {description ||
                  `${player.name} absolutely took over the last run. With a clinical performance from the perimeter and lockdown defense, he led his team to a decisive victory.`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Trophy className="text-yellow-500" size={20} />
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase">
                    Total MVPs
                  </div>
                  <div className="font-bold">{player.mvps}</div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                <div className="p-2 bg-neon-blue/20 rounded-lg">
                  <Zap className="text-neon-blue" size={20} />
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase">
                    Win Rate
                  </div>
                  <div className="font-bold">78%</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleShare}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-white text-black font-display text-lg rounded-xl hover:bg-neon-blue transition-colors shadow-lg"
              >
                <Share2 size={20} />
                Share MVP Card
              </button>
              <button className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 border border-white/20 hover:bg-white/5 font-display text-lg rounded-xl transition-colors">
                <Download size={20} />
                Download Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
