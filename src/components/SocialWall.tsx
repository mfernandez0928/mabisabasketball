import React, { useState } from 'react';
import { Instagram, Facebook, Video, MessageSquare, ExternalLink, Send } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

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

export const SocialWall: React.FC<SocialWallProps> = ({ messages, socialPosts }) => {
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const chatMessage = {
        user: userName.trim() || 'Anonymous Player',
        msg: newMessage.trim(),
        time: 'Just now'
      };

      const appDataRef = doc(db, "settings", "app_data");
      await updateDoc(appDataRef, {
        socialMessages: arrayUnion(chatMessage)
      });

      setNewMessage('');
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Facebook Feed (Manual) */}
          <div className="bg-card-bg border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 flex items-center justify-between border-b border-white/10 bg-[#1877F2]/10">
              <div className="flex items-center gap-2">
                <Facebook size={20} className="text-[#1877F2]" />
                <span className="text-sm font-bold">Facebook Updates</span>
              </div>
              <a href="https://www.facebook.com/mabisabasketball" target="_blank" rel="noreferrer" className="text-[10px] text-white/40 uppercase font-bold hover:text-white transition-colors">Visit Page</a>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {socialPosts && socialPosts.length > 0 ? (
                socialPosts.map(post => (
                  <div key={post.id} className="space-y-3 group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1877F2]/20 flex items-center justify-center text-[#1877F2] font-bold text-[10px]">
                          MB
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{post.user}</div>
                          <div className="text-[10px] text-white/30">{post.time}</div>
                        </div>
                      </div>
                      {post.url && post.url !== '#' && (
                        <a href={post.url} target="_blank" rel="noreferrer" className="text-white/20 group-hover:text-[#1877F2] transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    
                    {post.msg && (
                      <p className="text-sm text-white/80 leading-relaxed">
                        {post.msg}
                      </p>
                    )}
                    
                    {post.image && (
                      <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40 relative group">
                        <img 
                          src={post.image} 
                          alt="" 
                          className="w-full h-auto block transition-transform duration-500 group-hover:scale-105" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/hoops-fallback/800/600';
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
                  <p className="text-xs text-white/40 font-mono">No updates posted yet. Check back soon for the latest from Mabisa Basketball!</p>
                </div>
              )}
            </div>
          </div>

          {/* Trash Talk Corner */}
          <div className="bg-card-bg border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 flex items-center justify-between border-b border-white/10 bg-neon-red/10">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-neon-red" />
                <span className="text-sm font-bold">Trash Talk Corner</span>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar flex flex-col-reverse">
              <div className="space-y-4">
                {(messages || []).map((chat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neon-blue">{chat.user}</span>
                      <span className="text-[10px] text-white/30">{chat.time}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg text-sm border border-white/5">
                      {chat.msg}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-white/10 bg-black/20">
              <form onSubmit={handleSendMessage} className="space-y-3">
                <input 
                  type="text" 
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-neon-blue transition-colors"
                />
                <div className="relative">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Join the banter..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neon-red transition-colors pr-12"
                  />
                  <button 
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neon-red font-bold text-xs uppercase disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSending ? '...' : <Send size={16} />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
