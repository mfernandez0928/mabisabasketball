import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  User,
  Send,
} from "lucide-react";
import { SocialPost } from "../types";
import { formatDistanceToNow } from "date-fns";
import { safeParseDate } from "../lib/dateUtils";
import { ASSETS } from "../constants/assets";

interface SocialWallProps {
  socialPosts: SocialPost[];
  onLike?: (postId: string) => void;
  onComment?: (postId: string, text: string) => void;
}

export const SocialWall: React.FC<SocialWallProps> = ({
  socialPosts,
  onLike,
  onComment,
}) => {
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    const savedLikes = localStorage.getItem("mabisa_likes");
    if (savedLikes) {
      setLikedPosts(JSON.parse(savedLikes));
    }
  }, []);

  const handleLikeClick = (postId: string) => {
    if (likedPosts.includes(postId)) return;

    const newLikes = [...likedPosts, postId];
    setLikedPosts(newLikes);
    localStorage.setItem("mabisa_likes", JSON.stringify(newLikes));
    onLike?.(postId);
  };

  const handleCommentSubmit = (postId: string) => {
    if (!commentText.trim()) return;
    onComment?.(postId, commentText);
    setCommentText("");
    setCommentingId(null);
  };

  const renderContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-blue hover:underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto space-y-20">
        <div className="text-center space-y-4">
          <h2 className="text-5xl md:text-7xl grungy-text italic">
            The Community
          </h2>
          <p className="text-white/40 font-mono text-sm uppercase tracking-widest">
            Hype from the court
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-[1px] flex-1 bg-white/10" />
            <h3 className="text-2xl font-display text-neon-blue italic">
              Social Feed
            </h3>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>
          {socialPosts.map((post) => {
            const isLiked = likedPosts.includes(post.id);
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card-bg/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
              >
                {/* Post Header */}
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border border-white/10">
                      <img
                        src={ASSETS.LOGO}
                        alt="Mabisa"
                        className="w-full h-full object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-white uppercase tracking-tight">
                        {post.authorName ||
                          (post as any).user ||
                          "Mabisa Hooper"}
                      </h3>
                      <p className="text-xs text-white/40 font-mono uppercase">
                        {formatDistanceToNow(
                          safeParseDate(post.createdAt || (post as any).time),
                          { addSuffix: true },
                        )}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-white/40 hover:text-white transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                {/* Post Content */}
                <div className="px-6 pb-4">
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap text-left">
                    {renderContentWithLinks(
                      post.content || (post as any).msg || "",
                    )}
                  </p>
                </div>

                {/* Post Image */}
                {(post.imageUrl || (post as any).image) && (
                  <div className="aspect-video w-full overflow-hidden border-y border-white/5">
                    <img
                      src={post.imageUrl || (post as any).image}
                      alt=""
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="p-6 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLikeClick(post.id)}
                        className={`flex items-center gap-2 group ${isLiked ? "cursor-default" : ""}`}
                      >
                        <div
                          className={`p-2 rounded-full transition-colors ${isLiked ? "bg-neon-red/20" : "group-hover:bg-neon-red/10"}`}
                        >
                          <Heart
                            size={20}
                            className={`transition-colors ${isLiked ? "text-neon-red fill-neon-red" : "text-white/40 group-hover:text-neon-red"}`}
                          />
                        </div>
                        <span
                          className={`text-sm font-mono transition-colors ${isLiked ? "text-white" : "text-white/40 group-hover:text-white"}`}
                        >
                          {post.likes || 0}
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          setCommentingId(
                            commentingId === post.id ? null : post.id,
                          )
                        }
                        className="flex items-center gap-2 group"
                      >
                        <div className="p-2 rounded-full group-hover:bg-neon-blue/10 transition-colors">
                          <MessageCircle
                            size={20}
                            className="text-white/40 group-hover:text-neon-blue transition-colors"
                          />
                        </div>
                        <span className="text-sm font-mono text-white/40 group-hover:text-white transition-colors">
                          {post.comments || 0}
                        </span>
                      </button>
                    </div>
                    <button className="p-2 text-white/40 hover:text-white transition-colors">
                      <Share2 size={20} />
                    </button>
                  </div>

                  {/* Inline Comment Input */}
                  <AnimatePresence>
                    {commentingId === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-2 pt-2">
                          <input
                            autoFocus
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleCommentSubmit(post.id)
                            }
                            placeholder="Write a comment..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-neon-blue transition-colors"
                          />
                          <button
                            onClick={() => handleCommentSubmit(post.id)}
                            className="p-2 bg-neon-blue text-black rounded-xl hover:bg-white transition-colors"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load More / Join the Hype */}
        <div className="text-center pt-8">
          <button
            onClick={() => {
              const scheduleSection = document.getElementById("schedule");
              if (scheduleSection) {
                scheduleSection.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-8 py-4 bg-white text-black font-display text-xl skew-x-[-12deg] hover:bg-neon-blue transition-all"
          >
            JOIN THE HYPE
          </button>
        </div>
      </div>
    </section>
  );
};
