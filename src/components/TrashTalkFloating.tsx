import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Minimize2, Maximize2 } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

interface TrashTalkFloatingProps {
  messages: { user: string; msg: string; time: string }[];
}

export const TrashTalkFloating: React.FC<TrashTalkFloatingProps> = ({
  messages,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const chatMessage = {
        user: userName.trim() || "Anonymous Player",
        msg: newMessage.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const appDataRef = doc(db, "settings", "app_data");
      await updateDoc(appDataRef, {
        socialMessages: arrayUnion(chatMessage),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-32 md:bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "48px" : "450px",
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[280px] md:w-[380px] bg-card-bg border border-white/10 rounded-2xl shadow-2xl overflow-hidden mb-4 flex flex-col backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-3 flex items-center justify-between border-b border-white/10 bg-neon-red/10">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-neon-red" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Trash Talk Corner
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                >
                  {isMinimized ? (
                    <Maximize2 size={14} />
                  ) : (
                    <Minimize2 size={14} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div
                  ref={scrollRef}
                  className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-black/20"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <MessageSquare size={32} className="text-white/5" />
                      <p className="text-[10px] font-mono text-white/20 uppercase">
                        No banter yet. Be the first to talk trash!
                      </p>
                    </div>
                  ) : (
                    messages.map((chat, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-bold text-neon-blue uppercase">
                            {chat.user}
                          </span>
                          <span className="text-[9px] text-white/20">
                            {chat.time}
                          </span>
                        </div>
                        <div className="bg-white/5 p-2.5 rounded-xl text-xs border border-white/5 leading-relaxed">
                          {chat.msg}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-white/10 bg-black/40">
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your Name (Optional)"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] focus:outline-none focus:border-neon-blue transition-colors"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Join the banter..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neon-red transition-colors pr-10"
                      />
                      <button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neon-red disabled:opacity-30 p-1"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? "bg-neon-red text-white rotate-90"
            : "bg-neon-blue text-black"
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-dark-bg">
            {messages.length > 9 ? "9+" : messages.length}
          </span>
        )}
      </motion.button>
    </div>
  );
};
