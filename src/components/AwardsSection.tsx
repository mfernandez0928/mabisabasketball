import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star } from 'lucide-react';
import { Award } from '../types';
import { AwardCard } from './AwardCard';

interface AwardsSectionProps {
  awards: Award[];
}

export const AwardsSection: React.FC<AwardsSectionProps> = ({ awards }) => {
  if (!awards || awards.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/5 blur-[120px] rounded-full" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            <Trophy size={14} />
            Game Recognition
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display uppercase italic tracking-tighter"
          >
            Players of the <span className="text-neon-blue">Game</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/40 max-w-2xl mx-auto text-sm md:text-base font-medium"
          >
            Celebrating outstanding performances and hustle from our latest match.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {awards.map((award, index) => (
            <motion.div
              key={award.id || `${award.type}-${index}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-gradient-to-b from-white/5 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <AwardCard award={award} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
