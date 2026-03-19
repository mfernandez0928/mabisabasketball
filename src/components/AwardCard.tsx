import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Share2, Download, Star, User } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Award } from '../types';
import { cn } from '../lib/utils';

interface AwardCardProps {
  award: Award;
}

export const AwardCard: React.FC<AwardCardProps> = ({ award }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    try {
      // Ensure all images are loaded
      const images = cardRef.current.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        const htmlImg = img as HTMLImageElement;
        if (htmlImg.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          htmlImg.onload = resolve;
          htmlImg.onerror = reject;
        });
      }));

      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        pixelRatio: 3, // Even higher quality
        backgroundColor: '#000000',
        style: {
          // Force some styles that might be lost
          borderRadius: '24px',
        }
      });
      
      const link = document.createElement('a');
      link.download = `Mabisa_Award_${award.type.replace(/\s+/g, '_')}_${award.playerName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading award card:', err);
      alert('Failed to download poster. This might be due to browser restrictions or image loading issues.');
    }
  };

  const isPOTN = award.type === 'Player of the Night';

  return (
    <div className="space-y-4">
      <div 
        ref={cardRef}
        className={cn(
          "relative w-full aspect-[4/5] overflow-hidden rounded-3xl border-4 bg-black",
          isPOTN ? "border-neon-blue" : "border-neon-red"
        )}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={cn(
            "absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full opacity-50",
            isPOTN ? "bg-neon-blue" : "bg-neon-red"
          )} />
          <div className={cn(
            "absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] rounded-full opacity-30",
            isPOTN ? "bg-neon-blue" : "bg-neon-red"
          )} />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        </div>

        {/* Player Image - Adjusted for "Full" view */}
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
          {award.photoUrl ? (
            <img 
              src={award.photoUrl} 
              alt={award.playerName}
              className="w-full h-full object-contain z-0"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          ) : (
            <User size={120} className="text-white/10" />
          )}
          {/* Darker gradient for better text readability with full image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 space-y-4 z-20">
          <div className="space-y-1">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border",
                isPOTN 
                  ? "bg-neon-blue/20 border-neon-blue/50 text-neon-blue" 
                  : "bg-neon-red/20 border-neon-red/50 text-neon-red"
              )}
            >
              <Trophy size={12} />
              {award.type}
            </motion.div>
            <h2 className="text-5xl font-display uppercase italic leading-none tracking-tighter text-white drop-shadow-lg">
              {award.playerName}
            </h2>
          </div>

          {/* Removed backdrop-blur as it breaks html-to-image, using solid-ish background */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/10 bg-black/60 rounded-2xl px-6">
            <div className="text-center">
              <p className="text-[8px] text-white/60 uppercase font-bold tracking-widest">Points</p>
              <p className="text-2xl font-display text-white">{award.stats.pts}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-white/60 uppercase font-bold tracking-widest">Rebounds</p>
              <p className="text-2xl font-display text-white">{award.stats.reb}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-white/60 uppercase font-bold tracking-widest">Assists</p>
              <p className="text-2xl font-display text-white">{award.stats.ast}</p>
            </div>
          </div>

          <div className="relative">
            <div className={cn(
              "absolute -left-8 top-0 bottom-0 w-1",
              isPOTN ? "bg-neon-blue" : "bg-neon-red"
            )} />
            <p className="text-sm text-white/80 leading-relaxed font-medium italic">
              "{award.caption}"
            </p>
          </div>

          <div className="flex justify-between items-end pt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1.5">
                <img src="/logo.png" alt="Mabisa" className="w-full h-full object-contain" />
              </div>
              <div className="leading-none">
                <p className="text-[10px] font-display uppercase tracking-tighter">Mabisa Basketball</p>
                <p className="text-[8px] font-mono text-white/40">EST. 2024</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Game Date</p>
              <p className="text-[10px] font-bold">{award.gameDate}</p>
            </div>
          </div>
        </div>

        {/* Decorative Stars */}
        <div className="absolute top-8 right-8 flex gap-1">
          {[1, 2, 3].map(i => (
            <Star key={i} size={12} className={cn(isPOTN ? "text-neon-blue" : "text-neon-red")} fill="currentColor" />
          ))}
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
        <button 
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
};
