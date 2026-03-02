import React, { useState } from "react";
import {
  Instagram,
  Facebook,
  Video,
  MessageSquare,
  ExternalLink,
  Send,
} from "lucide-react";
import { db } from "../lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

interface SocialPost {
  id: string;
  user: string;
  msg: string;
  time: string;
  image?: string;
  url: string;
}

interface SocialWallProps {
  messages: { user: string; msg: string; time: string }[];
  socialPosts: SocialPost[];
}

export const SocialWall: React.FC<SocialWallProps> = ({
  messages,
  socialPosts,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const chatMessage = {
        user: userName.trim() || "Anonymous Player",
        msg: newMessage.trim(),
        time: "Just now",
      };

      const appDataRef = doc(db, "settings", "app_data");
      await updateDoc(appDataRef, {
        socialMessages: arrayUnion(chatMessage),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="py-20 px-4 bg-black/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-6xl mb-12 text-center grungy-text italic">
          The Social Feed
        </h2>

        <div className="max-w-3xl mx-auto">
          {/* Facebook Feed (Manual) */}
          <div className="bg-card-bg border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl backdrop-blur-md">
            <div className="p-4 flex items-center justify-between border-b border-white/10 bg-[#1877F2]/10">
              <div className="flex items-center gap-2">
                <Facebook size={20} className="text-[#1877F2]" />
                <span className="text-sm font-bold uppercase tracking-widest">
                  Facebook Updates
                </span>
              </div>
              <a
                href="https://www.facebook.com/mabisabasketball"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-white/40 uppercase font-bold hover:text-white transition-colors"
              >
                Visit Page
              </a>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {socialPosts && socialPosts.length > 0 ? (
                socialPosts.map((post) => (
                  <div key={post.id} className="space-y-4 group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 flex items-center justify-center text-[#1877F2] font-bold text-xs border border-[#1877F2]/20">
                          MB
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white uppercase tracking-tight">
                            {post.user}
                          </div>
                          <div className="text-[10px] text-white/30 font-mono">
                            {post.time}
                          </div>
                        </div>
                      </div>
                      {post.url && post.url !== "#" && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-white/20 group-hover:text-[#1877F2] transition-colors p-2 hover:bg-white/5 rounded-lg"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>

                    {post.msg && (
                      <p className="text-sm text-white/80 leading-relaxed font-light">
                        {post.msg}
                      </p>
                    )}

                    {post.image && (
                      <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/40 relative group/img shadow-xl">
                        <img
                          src={post.image}
                          alt=""
                          className="w-full h-auto block transition-transform duration-700 group-hover/img:scale-105"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://picsum.photos/seed/hoops-fallback/800/600";
                          }}
                        />
                      </div>
                    )}

                    <div className="h-[1px] bg-white/5 w-full pt-4" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
                  <Facebook size={40} className="text-white/10" />
                  <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
                    No updates posted yet. Check back soon!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
