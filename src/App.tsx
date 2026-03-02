import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Facebook, Mail } from "lucide-react";
import { Hero } from "./components/Hero";
import { MVPSpotlight } from "./components/MVPSpotlight";
import { GameChart } from "./components/GameChart";
import { Leaderboard } from "./components/Leaderboard";
import { SocialWall } from "./components/SocialWall";
import { Admin } from "./components/Admin";
import { Logo } from "./components/Logo";
import { PlayerStats, GameResult, UpcomingGame } from "./types";

function MainSite({
  data,
  onRefresh,
}: {
  data: any | null;
  onRefresh: () => void;
}) {
  const location = useLocation();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    onRefresh();
  }, [location.pathname, onRefresh]);

  if (!data)
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center text-white font-mono">
        Loading...
      </div>
    );

  const players = data.players || [];
  const games = data.games || [];
  const upcomingGame = data.upcomingGame || {
    date: new Date().toISOString(),
    location: "TBD",
    reservedPlayers: [],
    pendingReservations: [],
  };

  const latestGame = games[0];
  let mvpPlayer = players.find((p) => p.id === latestGame?.mvpId);
  let mvpGameStats: { pts: number; reb: number; ast: number } | undefined =
    undefined;

  if (mvpPlayer && latestGame) {
    const allGamePlayers = [
      ...(latestGame.teamWhite?.players || []),
      ...(latestGame.teamBlue?.players || []),
    ];
    const stats = allGamePlayers.find(
      (p) => p.name.toLowerCase() === mvpPlayer?.name.toLowerCase(),
    );
    if (stats) {
      mvpGameStats = { pts: stats.pts, reb: stats.reb, ast: stats.ast };
    }
  }

  if (!mvpPlayer && latestGame) {
    const allGamePlayers = [
      ...(latestGame.teamWhite?.players || []),
      ...(latestGame.teamBlue?.players || []),
    ];
    if (allGamePlayers.length > 0) {
      const topScorer = allGamePlayers.reduce((prev, curr) =>
        prev.pts > curr.pts ? prev : curr,
      );
      mvpPlayer = players.find(
        (p) => p.name.toLowerCase() === topScorer.name.toLowerCase(),
      );
      mvpGameStats = {
        pts: topScorer.pts,
        reb: topScorer.reb,
        ast: topScorer.ast,
      };
    }
  }

  if (!mvpPlayer) {
    mvpPlayer =
      [...players].sort((a, b) => b.points - a.points)[0] || players[0];
  }

  return (
    <div className="min-h-screen selection:bg-neon-blue selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-lg border-b border-white/5 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="#" className="flex items-center gap-2 md:gap-3">
            <Logo className="w-8 h-8 md:w-10 md:h-10" />
            <span className="font-display text-lg md:text-2xl tracking-tighter whitespace-nowrap">
              MABISA{" "}
              <span className="text-neon-blue hidden sm:inline">
                BASKETBALL
              </span>
            </span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-bold">
            <a
              href="#schedule"
              className="hover:text-neon-blue transition-colors"
            >
              Schedule
            </a>
            <a href="#stats" className="hover:text-neon-blue transition-colors">
              Stats
            </a>
            <a href="#mvp" className="hover:text-neon-blue transition-colors">
              MVP
            </a>
            <a
              href="#social"
              className="hover:text-neon-blue transition-colors"
            >
              Social
            </a>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to="/admin"
              className="text-white/20 hover:text-white text-[8px] md:text-[10px] font-mono uppercase tracking-widest"
            >
              Admin
            </Link>
            <a
              href="#schedule"
              className="bg-white text-black px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-display text-xs md:text-sm hover:bg-neon-blue transition-colors whitespace-nowrap"
            >
              JOIN RUN
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section id="schedule">
          <Hero game={upcomingGame} onRefresh={onRefresh} />
        </section>

        <div className="relative">
          {/* Section Dividers / Gradients */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-dark-bg to-transparent z-10" />

          {games.length > 0 && (
            <section id="stats">
              <GameChart games={games} players={players} />
            </section>
          )}

          {mvpPlayer && games.length > 0 && (
            <section id="mvp">
              <MVPSpotlight
                player={mvpPlayer}
                description={data.mvpDescription}
                stats={mvpGameStats}
              />
            </section>
          )}

          {players.length > 0 && <Leaderboard players={players} />}

          <section id="social">
            <SocialWall
              messages={data.socialMessages || []}
              socialPosts={data.socialPosts || []}
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo className="w-10 h-10" />
                <span className="font-display text-2xl tracking-tighter">
                  MABISA <span className="text-neon-blue">BASKETBALL</span>
                </span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                The premier basketball community for competitive runs, season
                tracking, and social engagement.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-white">
                Contact Us
              </h4>
              <div className="space-y-3">
                <a
                  href="mailto:mabisabasketballclub@gmail.com"
                  className="flex items-center gap-3 text-white/40 hover:text-neon-blue transition-colors group"
                >
                  <Mail
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm">
                    mabisabasketballclub@gmail.com
                  </span>
                </a>
                <a
                  href="https://www.facebook.com/mabisabasketball"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-white/40 hover:text-[#1877F2] transition-colors group"
                >
                  <Facebook
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm">Mabisa Basketball Facebook</span>
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-white">
                Quick Links
              </h4>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <button
                  onClick={() => setShowTerms(true)}
                  className="text-white/40 hover:text-white transition-colors text-sm"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="text-white/40 hover:text-white transition-colors text-sm"
                >
                  Privacy Policy
                </button>
                <a
                  href="#schedule"
                  className="text-white/40 hover:text-white transition-colors text-sm"
                >
                  Join Run
                </a>
                <a
                  href="#stats"
                  className="text-white/40 hover:text-white transition-colors text-sm"
                >
                  Game History
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white/20 text-[10px] font-mono uppercase tracking-widest">
              MarkDev © 2026 MABISA BASKETBALL CLUB. ALL RIGHTS RESERVED.
            </div>
            <div className="text-white/10 text-[10px] font-mono">
              CRAFTED FOR THE HOOPERS
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerms(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-card-bg border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-2xl font-display">Terms of Service</h3>
                <button
                  onClick={() => setShowTerms(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6 text-white/70 leading-relaxed">
                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">
                    1. Registration & Eligibility
                  </h4>
                  <p className="text-sm">
                    All players must register via the official website to
                    participate in a Mabisa Basketball run. Players must be at
                    least 15 years old. By registering, you confirm you are
                    physically fit to play competitive basketball.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">
                    2. Payment Policy
                  </h4>
                  <p className="text-sm">
                    Entrance fees must be paid to the designated admins before
                    the game starts. Failure to pay may result in your slot
                    being given to a waitlisted player. Fees are non-refundable
                    unless the game is cancelled by the club.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">
                    3. Code of Conduct
                  </h4>
                  <p className="text-sm">
                    We maintain a "Respect the Game" environment. While trash
                    talk is part of the culture, physical violence, threats, or
                    excessive verbal abuse will result in immediate removal and
                    a potential permanent ban from the club.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">
                    4. Liability Waiver
                  </h4>
                  <p className="text-sm">
                    Basketball is a high-impact sport with inherent risks. By
                    participating, you acknowledge these risks and agree that
                    Mabisa Basketball Club, its organizers, and the venue owners
                    are not liable for any injuries, accidents, or loss of
                    property sustained during our events.
                  </p>
                </section>
              </div>
            </motion.div>
          </div>
        )}

        {showPrivacy && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacy(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-card-bg border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-2xl font-display">Privacy Policy</h3>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6 text-white/70 leading-relaxed">
                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">
                    1. Information We Collect
                  </h4>
                  <p className="text-sm">
                    We collect basic information including your name, age, and
                    basketball positions when you register for a run. This is
                    necessary for game organization and balanced team creation.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">
                    2. How We Use Your Data
                  </h4>
                  <p className="text-sm">
                    Your data is used to manage game slots, track season
                    statistics (points, rebounds, etc.), and send you updates
                    about upcoming club events. We do not sell your personal
                    information to third parties.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">
                    3. Media & Publicity
                  </h4>
                  <p className="text-sm">
                    Mabisa Basketball frequently takes photos and videos during
                    games for our website and social media pages. By
                    participating, you consent to the use of your likeness in
                    these promotional materials.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">
                    4. Data Security
                  </h4>
                  <p className="text-sm">
                    We use secure cloud services to store your registration and
                    stats. While we take reasonable measures to protect your
                    data, no online system is 100% secure.
                  </p>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { db } from "./lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";

export default function App() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // Listen to the 'settings/app_data' document in real-time
    const unsub = onSnapshot(
      doc(db, "settings", "app_data"),
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data());
          setError(null);
          setIsLocalMode(false);
        } else {
          setError("Document 'settings/app_data' not found in your Firestore.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError(`Firestore Connection Error: ${err.message}`);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const switchToLocalMode = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/data")
      .then((res) => res.json())
      .then((localData) => {
        setData(localData);
        setIsLocalMode(true);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load even local data. Please check your server.");
        setLoading(false);
      });
  }, []);

  const refreshData = useCallback(() => {}, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/40 font-mono text-sm animate-pulse">
            CONNECTING TO MABISA CLOUD...
          </p>
        </div>
      </div>
    );
  }

  if (error && !isLocalMode) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="bg-neon-red/10 border border-neon-red/20 p-8 rounded-2xl max-w-md">
          <h2 className="text-2xl font-display text-neon-red mb-4">
            Cloud Connection Error
          </h2>
          <p className="text-white/60 mb-6 font-mono text-sm">{error}</p>

          <div className="text-left bg-black/40 p-4 rounded-lg mb-6 space-y-4">
            <div>
              <p className="text-[10px] text-neon-blue uppercase mb-2 font-bold">
                Quick Fix: Update Rules
              </p>
              <p className="text-[10px] text-white/60 leading-relaxed">
                Go to <b>Firestore &gt; Rules</b> and paste this:
              </p>
              <pre className="text-[9px] bg-black p-2 mt-2 rounded border border-white/10 text-green-400 overflow-x-auto">
                {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black px-6 py-3 rounded-lg font-display hover:bg-neon-blue transition-colors"
            >
              RETRY CLOUD SYNC
            </button>
            <button
              onClick={switchToLocalMode}
              className="w-full bg-white/5 border border-white/10 text-white/60 px-6 py-3 rounded-lg font-display hover:bg-white/10 transition-colors"
            >
              USE LOCAL MODE (OFFLINE)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<MainSite data={data} onRefresh={refreshData} />}
        />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
