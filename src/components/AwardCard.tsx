import React, { useRef } from "react";
import { motion } from "motion/react";
import { Trophy, Share2, Download, Star, User } from "lucide-react";
import { toPng } from "html-to-image";
import { Award } from "../types";
import { cn } from "../lib/utils";
import { ASSETS } from "../constants/assets";

interface AwardCardProps {
  award: Award;
}

export const AwardCard: React.FC<AwardCardProps> = ({ award }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (cardRef.current === null) return;

    try {
      const images = cardRef.current.getElementsByTagName("img");
      await Promise.all(
        Array.from(images).map((img) => {
          const htmlImg = img as HTMLImageElement;
          if (htmlImg.complete) return Promise.resolve();

          return new Promise((resolve, reject) => {
            htmlImg.onload = resolve;
            htmlImg.onerror = reject;
          });
        }),
      );

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#000000",
        style: {
          borderRadius: "24px",
        },
      });

      const link = document.createElement("a");
      link.download = `Mabisa_Award_${award.type.replace(/\s+/g, "_")}_${award.playerName.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading award card:", err);
      alert(
        "Failed to download poster. This might be due to browser restrictions or image loading issues.",
      );
    }
  };

  const isPOTN = award.type === "Player of the Night";

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className={cn(
          "relative w-full overflow-hidden rounded-3xl border-4 bg-black",
          isPOTN ? "border-neon-blue" : "border-neon-red",
        )}
      >
        {/* Background glow + texture */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={cn(
              "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-40",
              isPOTN ? "bg-neon-blue" : "bg-neon-red",
            )}
          />
          <div
            className={cn(
              "absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-25",
              isPOTN ? "bg-neon-blue" : "bg-neon-red",
            )}
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15" />
        </div>

        {/* IMAGE AREA */}
        <div className="relative aspect-[4/5] overflow-hidden bg-black">
          {award.photoUrl ? (
            <img
              src={award.photoUrl}
              alt={award.playerName}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={120} className="text-white/10" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />

          {/* Top badge */}
          <div className="absolute top-6 left-6 z-20">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border",
                isPOTN
                  ? "bg-neon-blue/15 border-neon-blue/50 text-neon-blue"
                  : "bg-neon-red/15 border-neon-red/50 text-neon-red",
              )}
            >
              <Trophy size={12} />
              {award.type}
            </motion.div>
          </div>

          {/* Decorative Stars */}
          <div className="absolute top-6 right-6 flex gap-1 z-20">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                size={12}
                className={cn(isPOTN ? "text-neon-blue" : "text-neon-red")}
                fill="currentColor"
              />
            ))}
          </div>
        </div>

        {/* TEXT AREA BELOW IMAGE */}
        <div className="relative z-10 bg-black px-6 py-6 md:px-8 md:py-7 space-y-5">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-display uppercase italic leading-none tracking-tight text-white break-words">
              {award.playerName}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
            <div className="text-center">
              <p className="text-[9px] text-white/50 uppercase font-bold tracking-[0.2em]">
                Points
              </p>
              <p className="text-2xl font-display text-white">
                {award.stats.pts}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-white/50 uppercase font-bold tracking-[0.2em]">
                Rebounds
              </p>
              <p className="text-2xl font-display text-white">
                {award.stats.reb}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-white/50 uppercase font-bold tracking-[0.2em]">
                Assists
              </p>
              <p className="text-2xl font-display text-white">
                {award.stats.ast}
              </p>
            </div>
          </div>

          {award.caption && (
            <div className="relative pl-4">
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 rounded-full",
                  isPOTN ? "bg-neon-blue" : "bg-neon-red",
                )}
              />
              <p className="text-sm text-white/80 leading-relaxed font-medium italic">
                "{award.caption}"
              </p>
            </div>
          )}

          <div className="flex justify-between items-end pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1.5 overflow-hidden">
                <img
                  src={ASSETS.LOGO}
                  alt="Mabisa"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = ASSETS.LOGO_FALLBACK;
                  }}
                />
              </div>

              <div className="leading-none">
                <p className="text-[10px] font-display uppercase tracking-tighter text-white">
                  Mabisa Basketball
                </p>
                <p className="text-[8px] font-mono text-white/40">EST. 2024</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">
                Game Date
              </p>
              <p className="text-[10px] font-bold text-white">
                {award.gameDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <Download size={16} />
          Download Poster
        </button>

        <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
};
