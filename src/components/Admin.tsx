import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import {
  Save,
  Plus,
  Trash2,
  LogOut,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Image as ImageIcon,
  MessageSquare,
  Users,
  User,
  Trophy,
  Zap,
  RotateCcw,
  Camera,
  Loader2,
  Wallet,
  QrCode,
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Star,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  PlayerStats,
  GameResult,
  UpcomingGame,
  Award,
  PendingPayment,
  SocialPost,
} from "../types";
import { Logo } from "./Logo";
import { AwardCard } from "./AwardCard";
import { safeParseDate } from "../lib/dateUtils";

import { db, storage } from "../lib/firebase";
import { supabase, uploadFile } from "../lib/supabase";
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  arrayRemove,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [data, setData] = useState<{
    players: PlayerStats[];
    games: GameResult[];
    upcomingGame: UpcomingGame;
    socialMessages: { user: string; msg: string; time: string }[];
    socialPosts: SocialPost[];
    awards: Award[];
    gcashNumber?: string;
    gcashQrCode?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    | "schedule"
    | "stats"
    | "players"
    | "social"
    | "reservations"
    | "awards"
    | "settings"
  >("schedule");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (token) setIsLoggedIn(true);

    const unsub = onSnapshot(
      doc(db, "settings", "app_data"),
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data() as any);
        }
      },
      (err) => {
        console.warn("Firestore Admin Error, falling back to local:", err);
        fetchData(); // Fallback to local API
      },
    );

    return () => unsub();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Local data fetch failed:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "mabisa@2026!") {
      localStorage.setItem("admin-token", "admin-token-123");
      setIsLoggedIn(true);
    } else {
      alert("Invalid password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-token");
    setIsLoggedIn(false);
    navigate("/");
  };

  const confirmReservation = async (id: string) => {
    if (!data) return;
    try {
      const pending = data.upcomingGame?.pendingReservations || [];
      const reservationIndex = pending.findIndex((r: any) => r.id === id);
      if (reservationIndex === -1) return;

      const reservation = pending[reservationIndex];

      const newData = JSON.parse(JSON.stringify(data));

      if (!newData.upcomingGame) newData.upcomingGame = {};
      if (!newData.upcomingGame.pendingReservations)
        newData.upcomingGame.pendingReservations = [];
      if (!newData.upcomingGame.reservedPlayers)
        newData.upcomingGame.reservedPlayers = [];
      if (!newData.players) newData.players = [];

      newData.upcomingGame.pendingReservations.splice(reservationIndex, 1);

      // Add to reserved if not already there
      const fullName =
        `${reservation.firstName} ${reservation.lastName}`.trim();
      const isAlreadyReserved = (
        newData.upcomingGame.reservedPlayers || []
      ).some(
        (p: any) =>
          `${p.firstName} ${p.lastName}`.trim().toLowerCase() ===
          fullName.toLowerCase(),
      );

      if (!isAlreadyReserved) {
        newData.upcomingGame.reservedPlayers.push({
          firstName: reservation.firstName,
          lastName: reservation.lastName,
          age: reservation.age,
          positions: reservation.positions || [],
        });
      }

      // Update filled slots
      newData.upcomingGame.filledSlots = (
        newData.upcomingGame.reservedPlayers || []
      ).length;

      // Add to global players list if not already there
      const playerExists = newData.players.some(
        (p: any) => p.name?.toLowerCase() === fullName.toLowerCase(),
      );

      if (!playerExists) {
        newData.players.push({
          id: "p" + Math.random().toString(36).substr(2, 5),
          name: fullName,
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          mvps: 0,
          wins: 0,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
        });
      }

      await setDoc(doc(db, "settings", "app_data"), newData);
    } catch (error) {
      console.error("Error confirming reservation:", error);
      alert("Failed to confirm reservation. Check console for details.");
    }
  };

  const rejectReservation = async (id: string) => {
    if (!data || !confirm("Are you sure you want to reject this reservation?"))
      return;
    try {
      const pending = data.upcomingGame?.pendingReservations || [];
      const reservation = pending.find((r: any) => r.id === id);
      if (!reservation) {
        alert("Reservation not found.");
        return;
      }

      await updateDoc(doc(db, "settings", "app_data"), {
        "upcomingGame.pendingReservations": arrayRemove(reservation),
      });
      alert("Reservation rejected.");
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      alert("Failed to reject reservation.");
    }
  };

  const syncReservedToGlobal = () => {
    if (!data) return;
    const newData = JSON.parse(JSON.stringify(data));
    let addedCount = 0;

    (newData.upcomingGame?.reservedPlayers || []).forEach((res: any) => {
      const fullName = `${res.firstName} ${res.lastName}`.trim();
      if (!fullName) return;

      const exists = newData.players.some(
        (p: any) => p.name?.toLowerCase() === fullName.toLowerCase(),
      );
      if (!exists) {
        newData.players.push({
          id: "p" + Math.random().toString(36).substr(2, 5),
          name: fullName,
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          mvps: 0,
          wins: 0,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setData(newData);
      alert(`Synced! Added ${addedCount} new players to the global list.`);
    } else {
      alert("All reserved players are already in the global list.");
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadingSocialId, setUploadingSocialId] = useState<string | null>(
    null,
  );

  const handleSocialImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    postId: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploadingSocialId(postId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${postId}_${Date.now()}.${fileExt}`;
      const filePath = `social/${fileName}`;

      const publicUrl = await uploadFile("social-post", filePath, file);

      const newPosts = data.socialPosts.map((p) =>
        p.id === postId ? { ...p, imageUrl: publicUrl } : p,
      );

      setData({ ...data, socialPosts: newPosts });
      alert("Social post image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setUploadingSocialId(null);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    playerId: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploadingId(playerId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${playerId}_${Date.now()}.${fileExt}`;
      const filePath = `players/${fileName}`;

      const publicUrl = await uploadFile("social-post", filePath, file);

      const newPlayers = data.players.map((p) =>
        p.id === playerId ? { ...p, image: publicUrl } : p,
      );

      setData({ ...data, players: newPlayers });
      alert("Photo uploaded successfully to Supabase!");
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        "Failed to upload image to Supabase. Make sure your bucket 'social-post' exists and is public.",
      );
    } finally {
      setUploadingId(null);
    }
  };

  const confirmPayment = async (id: string) => {
    if (!data) return;
    try {
      const pending = data.upcomingGame?.pendingPayments || [];
      const paymentIndex = pending.findIndex((p: any) => p.id === id);
      if (paymentIndex === -1) return;

      const payment = pending[paymentIndex];
      const newData = JSON.parse(JSON.stringify(data));

      if (!newData.upcomingGame) newData.upcomingGame = {};
      if (!newData.upcomingGame.pendingPayments)
        newData.upcomingGame.pendingPayments = [];
      if (!newData.upcomingGame.reservedPlayers)
        newData.upcomingGame.reservedPlayers = [];
      if (!newData.players) newData.players = [];

      newData.upcomingGame.pendingPayments.splice(paymentIndex, 1);

      // Add to reserved if not already there
      const fullName = `${payment.firstName} ${payment.lastName}`.trim();
      const isAlreadyReserved = (
        newData.upcomingGame.reservedPlayers || []
      ).some(
        (p: any) =>
          `${p.firstName} ${p.lastName}`.trim().toLowerCase() ===
          fullName.toLowerCase(),
      );

      if (!isAlreadyReserved) {
        newData.upcomingGame.reservedPlayers.push({
          firstName: payment.firstName,
          lastName: payment.lastName,
          age: payment.age,
          positions: payment.positions || [],
        });
      }

      // Update filled slots
      newData.upcomingGame.filledSlots = (
        newData.upcomingGame.reservedPlayers || []
      ).length;

      // Add to global players list if not already there
      const playerExists = newData.players.some(
        (p: any) => p.name?.toLowerCase() === fullName.toLowerCase(),
      );

      if (!playerExists) {
        newData.players.push({
          id: "p" + Math.random().toString(36).substr(2, 5),
          name: fullName,
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          mvps: 0,
          wins: 0,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
        });
      }

      await setDoc(doc(db, "settings", "app_data"), newData);
      alert("Payment confirmed!");
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("Failed to confirm payment.");
    }
  };

  const rejectPayment = async (id: string) => {
    if (!data || !confirm("Are you sure you want to reject this payment?"))
      return;
    try {
      const pending = data.upcomingGame?.pendingPayments || [];
      const payment = pending.find((p: any) => p.id === id);
      if (!payment) {
        alert("Payment not found.");
        return;
      }

      await updateDoc(doc(db, "settings", "app_data"), {
        "upcomingGame.pendingPayments": arrayRemove(payment),
      });
      alert("Payment rejected.");
    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert("Failed to reject payment.");
    }
  };

  const handleAwardImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slotId: string,
    awardType: "Player of the Night" | "Hustle Player",
  ) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `award_${slotId}_${Date.now()}.${fileExt}`;
      const filePath = `awards/${fileName}`;

      const publicUrl = await uploadFile("social-post", filePath, file);

      // Create or update award
      const newAwards = [...(data.awards || [])];
      const existingIndex = newAwards.findIndex(
        (a) => a.slotId === slotId && a.isCurrent,
      );

      if (existingIndex > -1) {
        newAwards[existingIndex] = {
          ...newAwards[existingIndex],
          photoUrl: publicUrl,
        };
      } else {
        newAwards.push({
          id: Math.random().toString(36).substr(2, 9),
          type: awardType,
          slotId,
          isCurrent: true,
          playerName: "",
          photoUrl: publicUrl,
          stats: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 },
          caption: "",
          gameDate: new Date().toISOString().split("T")[0],
        });
      }

      setData({ ...data, awards: newAwards });
      alert("Award photo uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload award image.");
    }
  };

  const handleResetAwards = () => {
    if (!data.awards) return;
    if (
      window.confirm(
        "Are you sure you want to reset the current awards? This will move them to history.",
      )
    ) {
      const resetAwards = data.awards.map((a) => ({ ...a, isCurrent: false }));
      setData({ ...data, awards: resetAwards });
    }
  };

  const handleGcashQrUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `gcash_qr_${Date.now()}.${fileExt}`;
      const filePath = `settings/${fileName}`;

      const publicUrl = await uploadFile("social-post", filePath, file);

      setData({ ...data, gcashQrCode: publicUrl });
      alert("GCash QR Code uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload QR code.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    console.log("File selected:", file.name, file.type);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        if (!dataBuffer) {
          alert("Failed to read file data.");
          return;
        }

        const wb = XLSX.read(dataBuffer, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rawJsonData = XLSX.utils.sheet_to_json(ws, { defval: "" });
        console.log("Raw Excel Data:", rawJsonData);

        if (!rawJsonData || rawJsonData.length === 0) {
          alert(
            "The Excel file seems to be empty or has no recognizable data.",
          );
          return;
        }

        const newPlayers = [...(data.players || [])];
        let updatedCount = 0;
        let addedCount = 0;

        // Helper to find value by flexible key matching
        const getValue = (row: any, searchKeys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const searchKey of searchKeys) {
            const foundKey = rowKeys.find(
              (k) =>
                k.trim().toUpperCase() === searchKey.toUpperCase() ||
                k.trim().toUpperCase().includes(searchKey.toUpperCase()),
            );
            if (foundKey) return row[foundKey];
          }
          return "";
        };

        rawJsonData.forEach((row: any, index: number) => {
          let firstName = String(
            getValue(row, ["FIRST NAME", "FIRSTNAME", "FNAME"]) || "",
          ).trim();
          let lastName = String(
            getValue(row, ["LAST NAME", "LASTNAME", "LNAME"]) || "",
          ).trim();
          let fullName = `${firstName} ${lastName}`.trim();

          // Fallback to "PLAYER NAME" or "NAME" or "FULL NAME" if first/last are missing
          if (!fullName) {
            fullName = String(
              getValue(row, ["PLAYER NAME", "NAME", "FULL NAME", "FULLNAME"]) ||
                "",
            ).trim();
          }

          if (!fullName) {
            console.warn(`Row ${index + 1} skipped: No name found.`, row);
            return;
          }

          const points =
            parseInt(getValue(row, ["TOTAL POINTS", "POINTS", "PTS"])) || 0;
          const assists =
            parseInt(getValue(row, ["TOTAL ASSISTS", "ASSISTS", "AST"])) || 0;
          const rebounds =
            parseInt(getValue(row, ["TOTAL REBOUNDS", "REBOUNDS", "REB"])) || 0;
          const steals =
            parseInt(getValue(row, ["TOTAL STEALS", "STEALS", "STL"])) || 0;
          const blocks =
            parseInt(getValue(row, ["TOTAL BLOCKS", "BLOCKS", "BLK"])) || 0;
          const fg2m =
            parseInt(getValue(row, ["TOTAL 2PM", "2PM", "FG2M"])) || 0;
          const fg3m =
            parseInt(getValue(row, ["TOTAL 3PM", "3PM", "FG3M"])) || 0;
          const oreb =
            parseInt(
              getValue(row, [
                "TOTAL OFFENSIVE REBOUNDS",
                "OFFENSIVE REBOUNDS",
                "OREB",
              ]),
            ) || 0;
          const dreb =
            parseInt(
              getValue(row, [
                "TOTAL DEFENSIVE REBOUNDS",
                "DEFENSIVE REBOUNDS",
                "DREB",
              ]),
            ) || 0;
          const gamesPlayed =
            parseInt(getValue(row, ["GAMES PLAYED", "GP"])) || 0;

          const existingPlayerIdx = newPlayers.findIndex(
            (p) => p.name.toLowerCase() === fullName.toLowerCase(),
          );

          if (existingPlayerIdx !== -1) {
            newPlayers[existingPlayerIdx] = {
              ...newPlayers[existingPlayerIdx],
              points,
              assists,
              rebounds,
              steals,
              blocks,
              fg2m,
              fg3m,
              oreb,
              dreb,
              gamesPlayed:
                gamesPlayed || newPlayers[existingPlayerIdx].gamesPlayed,
            };
            updatedCount++;
          } else {
            newPlayers.push({
              id: Math.random().toString(36).substr(2, 9),
              name: fullName,
              points,
              assists,
              rebounds,
              steals,
              blocks,
              fg2m,
              fg3m,
              oreb,
              dreb,
              gamesPlayed,
              mvps: 0,
              wins: 0,
              image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
            });
            addedCount++;
          }
        });

        setData({ ...data, players: newPlayers });
        alert(
          `Excel upload successful!\nUpdated: ${updatedCount} players\nAdded: ${addedCount} new players\n\nDon't forget to click "SAVE CHANGES" to persist to database.`,
        );
      } catch (err) {
        console.error("Excel parse error:", err);
        alert(
          "Error parsing Excel file. Please check the format and ensure it's a valid .xlsx, .xls, or .csv file.",
        );
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      alert("Failed to read the file.");
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    if (e.target) e.target.value = "";
  };

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      // Auto-sync reserved players to global list on save
      const newData = JSON.parse(JSON.stringify(data));
      (newData.upcomingGame?.reservedPlayers || []).forEach((res: any) => {
        const fullName = `${res.firstName} ${res.lastName}`.trim();
        if (!fullName) return;
        const exists = newData.players.some(
          (p: any) => p.name?.toLowerCase() === fullName.toLowerCase(),
        );
        if (!exists) {
          newData.players.push({
            id: "p" + Math.random().toString(36).substr(2, 5),
            name: fullName,
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            fg2m: 0,
            fg3m: 0,
            oreb: 0,
            dreb: 0,
            mvps: 0,
            wins: 0,
            gamesPlayed: 0,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`,
          });
        }
      });

      // Re-calculate MVPs for all players based on games history (MVP, POTN, Hustle)
      newData.players = newData.players.map((p: any) => {
        let mvpCount = 0;
        (newData.games || []).forEach((g: any) => {
          if (g.mvpId === p.id) mvpCount++;
          if (g.playerOfTheNightId === p.id) mvpCount++;
          (g.hustlePlayerIds || []).forEach((hId: string) => {
            if (hId === p.id) mvpCount++;
          });
        });
        return { ...p, mvps: mvpCount };
      });

      await setDoc(doc(db, "settings", "app_data"), newData);
      setData(newData);
      alert("Data saved successfully to Firestore!");
    } catch (error) {
      console.error(error);
      alert("Error saving data to Firestore. Please check your rules.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card-bg p-8 rounded-2xl border border-white/5 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <Logo className="w-16 h-16 mb-4" />
            <h1 className="text-3xl font-display text-center">Admin Access</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-white/40 uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors"
                placeholder="Enter admin password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-neon-blue text-black font-display py-3 rounded-lg hover:bg-neon-red transition-colors"
            >
              LOGIN
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-white/20 font-mono">
            Hint: WePlay
          </p>
        </motion.div>
      </div>
    );
  }

  if (!data)
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center text-white font-mono">
        Mabisa Loading...
      </div>
    );

  const navItems = [
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "reservations", label: "Reservations", icon: CheckSquare },
    { id: "awards", label: "Awards", icon: Star },
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "players", label: "Players", icon: Users },
    { id: "social", label: "Social", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-dark-bg text-white flex">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-card-bg border-r border-white/5 z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8" />
              <span className="font-display text-lg tracking-tighter">
                ADMIN
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasAlert =
                item.id === "reservations" &&
                data?.upcomingGame?.pendingReservations &&
                data.upcomingGame.pendingReservations.length > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                    activeTab === item.id
                      ? "bg-neon-blue/10 text-neon-blue shadow-[0_0_20px_rgba(0,242,255,0.05)]"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={
                        activeTab === item.id
                          ? "text-neon-blue"
                          : "text-white/20 group-hover:text-white/60"
                      }
                    />
                    <span className="text-xs font-mono uppercase tracking-widest">
                      {item.label}
                    </span>
                  </div>
                  {hasAlert && (
                    <span className="w-2 h-2 bg-neon-red rounded-full animate-pulse shadow-[0_0_10px_rgba(255,68,68,0.5)]" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest"
            >
              <ExternalLink size={18} className="text-white/20" />
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-neon-red transition-colors text-xs font-mono uppercase tracking-widest"
            >
              <LogOut size={18} className="text-white/20" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-white/40 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-display uppercase tracking-tight">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 bg-neon-blue text-black px-4 py-2 rounded-xl font-display text-xs md:text-sm transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)] ${
                isSaving
                  ? "opacity-50 cursor-not-allowed scale-95"
                  : "hover:bg-white hover:scale-105 active:scale-95"
              }`}
            >
              <Save size={16} className={isSaving ? "animate-pulse" : ""} />
              {isSaving ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </div>
        </header>

        <main className="p-4 md:p-8 lg:p-12 max-w-6xl">
          {activeTab === "settings" && (
            <div className="space-y-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-display text-neon-blue">
                    App Settings
                  </h2>
                  <p className="text-xs text-white/40 font-mono">
                    Manage GCash payment details and other configurations
                  </p>
                </div>

                <div className="bg-card-bg p-8 rounded-2xl border border-white/5 space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-display flex items-center gap-2">
                      <Wallet className="text-neon-blue" size={20} />
                      GCash Payment Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                            GCash Phone Number
                          </label>
                          <input
                            type="text"
                            value={data.gcashNumber || ""}
                            onChange={(e) =>
                              setData({ ...data, gcashNumber: e.target.value })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors font-mono"
                            placeholder="0917-XXX-XXXX"
                          />
                        </div>

                        <div className="p-4 bg-neon-blue/5 rounded-xl border border-neon-blue/20">
                          <p className="text-[10px] text-neon-blue/60 leading-relaxed">
                            This number will be displayed to players when they
                            choose the GCash payment method during reservation.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                          GCash QR Code
                        </label>
                        <div className="relative group">
                          <div className="aspect-square w-48 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-neon-blue/50">
                            {data.gcashQrCode ? (
                              <img
                                src={data.gcashQrCode}
                                alt="GCash QR"
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex flex-col items-center text-white/20">
                                <QrCode size={48} />
                                <span className="text-[10px] font-mono uppercase mt-2">
                                  No QR Code
                                </span>
                              </div>
                            )}

                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleGcashQrUpload}
                              />
                              <Camera size={24} className="text-white mb-2" />
                              <span className="text-[10px] font-bold uppercase text-white">
                                Change QR
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reservations" && (
            <div className="space-y-12">
              {/* Pending Payments Section */}
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-display text-neon-blue">
                      Pending Payments (GCash)
                    </h2>
                    <p className="text-xs text-white/40 font-mono">
                      Review GCash screenshots and confirm payments
                    </p>
                  </div>
                  <div className="bg-neon-blue/10 border border-neon-blue/20 px-4 py-2 rounded-lg">
                    <span className="text-xs font-mono text-neon-blue uppercase tracking-widest">
                      {data.upcomingGame?.pendingPayments?.length || 0} Pending
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {!data.upcomingGame?.pendingPayments ||
                  data.upcomingGame.pendingPayments.length === 0 ? (
                    <div className="bg-card-bg p-12 rounded-2xl border border-white/5 text-center">
                      <ImageIcon
                        className="mx-auto text-white/10 mb-4"
                        size={48}
                      />
                      <p className="text-white/40 font-mono">
                        No pending GCash payments.
                      </p>
                    </div>
                  ) : (
                    (data.upcomingGame?.pendingPayments || []).map(
                      (res: any) => (
                        <div
                          key={res.id}
                          className="bg-card-bg p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-display">
                                {res.firstName} {res.lastName}
                              </h3>
                              <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-mono text-white/40 uppercase">
                                Age: {res.age}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {(res.positions || []).map((pos) => (
                                <span
                                  key={pos}
                                  className="text-[10px] font-bold text-neon-blue uppercase tracking-wider"
                                >
                                  {pos === 1
                                    ? "PG"
                                    : pos === 2
                                      ? "SG"
                                      : pos === 3
                                        ? "SF"
                                        : pos === 4
                                          ? "PF"
                                          : "C"}
                                </span>
                              ))}
                            </div>
                            <div className="text-[10px] text-white/20 font-mono uppercase">
                              Requested:{" "}
                              {safeParseDate(res.timestamp).toLocaleString()}
                            </div>
                            {res.screenshotUrl && (
                              <div className="mt-4">
                                <p className="text-[10px] font-mono text-white/40 uppercase mb-2">
                                  Payment Proof:
                                </p>
                                <a
                                  href={res.screenshotUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block relative group"
                                >
                                  <img
                                    src={res.screenshotUrl}
                                    alt="Payment Proof"
                                    className="w-32 h-32 object-cover rounded-lg border border-white/10 group-hover:opacity-50 transition-opacity"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink size={20} />
                                  </div>
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3 w-full md:w-auto">
                            <button
                              onClick={() => rejectPayment(res.id)}
                              className="flex-1 md:flex-none px-6 py-2 border border-neon-red/50 text-neon-red rounded-lg text-xs font-mono uppercase hover:bg-neon-red/10 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => confirmPayment(res.id)}
                              className="flex-1 md:flex-none px-6 py-2 bg-neon-blue text-black rounded-lg text-xs font-mono uppercase font-bold hover:bg-white transition-colors"
                            >
                              Confirm Payment
                            </button>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>

              <div className="h-[1px] bg-white/5" />

              {/* Cash Reservations Section */}
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-display">Cash Reservations</h2>
                    <p className="text-xs text-white/40 font-mono">
                      Confirm cash payments on-site
                    </p>
                  </div>
                  <div className="bg-neon-blue/10 border border-neon-blue/20 px-4 py-2 rounded-lg">
                    <span className="text-xs font-mono text-neon-blue uppercase tracking-widest">
                      {data.upcomingGame?.pendingReservations?.length || 0}{" "}
                      Pending
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {!data.upcomingGame?.pendingReservations ||
                  data.upcomingGame.pendingReservations.length === 0 ? (
                    <div className="bg-card-bg p-12 rounded-2xl border border-white/5 text-center">
                      <Users className="mx-auto text-white/10 mb-4" size={48} />
                      <p className="text-white/40 font-mono">
                        No pending cash reservations.
                      </p>
                    </div>
                  ) : (
                    (data.upcomingGame?.pendingReservations || []).map(
                      (res: any) => (
                        <div
                          key={res.id}
                          className="bg-card-bg p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-display">
                                {res.firstName} {res.lastName}
                              </h3>
                              <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-mono text-white/40 uppercase">
                                Age: {res.age}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {(res.positions || []).map((pos) => (
                                <span
                                  key={pos}
                                  className="text-[10px] font-bold text-neon-blue uppercase tracking-wider"
                                >
                                  {pos === 1
                                    ? "PG"
                                    : pos === 2
                                      ? "SG"
                                      : pos === 3
                                        ? "SF"
                                        : pos === 4
                                          ? "PF"
                                          : "C"}
                                </span>
                              ))}
                            </div>
                            <div className="text-[10px] text-white/20 font-mono uppercase">
                              Requested:{" "}
                              {safeParseDate(res.timestamp).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex gap-3 w-full md:w-auto">
                            <button
                              onClick={() => rejectReservation(res.id)}
                              className="flex-1 md:flex-none px-6 py-2 border border-neon-red/50 text-neon-red rounded-lg text-xs font-mono uppercase hover:bg-neon-red/10 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => confirmReservation(res.id)}
                              className="flex-1 md:flex-none px-6 py-2 bg-neon-blue text-black rounded-lg text-xs font-mono uppercase font-bold hover:bg-white transition-colors"
                            >
                              Confirm Payment
                            </button>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "schedule" && (
            <div className="space-y-8">
              <h2 className="text-3xl font-display">Upcoming Game</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card-bg p-6 rounded-2xl border border-white/5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-white/40 uppercase mb-2">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={data.upcomingGame?.date?.slice(0, 16) || ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          upcomingGame: {
                            ...data.upcomingGame,
                            date: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-white/40 uppercase mb-2">
                      Time Range (e.g. 6pm - 8pm)
                    </label>
                    <input
                      type="text"
                      value={data.upcomingGame?.timeRange || ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          upcomingGame: {
                            ...data.upcomingGame,
                            timeRange: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue"
                      placeholder="6pm - 8pm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-white/40 uppercase mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={data.upcomingGame?.location || ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          upcomingGame: {
                            ...data.upcomingGame,
                            location: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-white/40 uppercase mb-2">
                      Entrance Fee (₱)
                    </label>
                    <input
                      type="text"
                      value={data.upcomingGame?.entranceFee || ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          upcomingGame: {
                            ...data.upcomingGame,
                            entranceFee: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-white/40 uppercase mb-2">
                      Cash Prize (₱)
                    </label>
                    <input
                      type="text"
                      value={data.upcomingGame?.cashPrize || ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          upcomingGame: {
                            ...data.upcomingGame,
                            cashPrize: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue"
                      placeholder="e.g. 1,000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-white/40 uppercase mb-2">
                        Total Slots
                      </label>
                      <input
                        type="number"
                        value={data.upcomingGame?.totalSlots || 0}
                        onChange={(e) =>
                          setData({
                            ...data,
                            upcomingGame: {
                              ...data.upcomingGame,
                              totalSlots: parseInt(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-neon-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-white/40 uppercase mb-2">
                        Filled Slots (Auto)
                      </label>
                      <div className="w-full bg-black/50 border border-white/5 rounded-lg px-4 py-2 text-white/40 font-mono">
                        {(data.upcomingGame?.reservedPlayers || []).length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-display">Reserved Players</h3>
                    <button
                      onClick={syncReservedToGlobal}
                      className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 text-white/40 font-mono uppercase transition-colors"
                      title="Add all these names to the global Players list"
                    >
                      Sync to Global
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      setData({
                        ...data,
                        upcomingGame: {
                          ...data.upcomingGame,
                          reservedPlayers: [
                            ...(data.upcomingGame?.reservedPlayers || []),
                            {
                              firstName: "",
                              lastName: "",
                              age: 25,
                              positions: [1],
                            },
                          ],
                        },
                      })
                    }
                    className="text-neon-blue flex items-center gap-1 text-xs font-mono uppercase"
                  >
                    <Plus size={14} /> Add Player
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {(data.upcomingGame?.reservedPlayers || []).map(
                    (player: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-card-bg p-4 rounded-xl border border-white/5 space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="grid grid-cols-2 gap-4 flex-1">
                            <div>
                              <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                                First Name
                              </label>
                              <input
                                type="text"
                                value={player.firstName}
                                onChange={(e) => {
                                  const newPlayers = [
                                    ...data.upcomingGame.reservedPlayers,
                                  ];
                                  newPlayers[idx].firstName = e.target.value;
                                  setData({
                                    ...data,
                                    upcomingGame: {
                                      ...data.upcomingGame,
                                      reservedPlayers: newPlayers,
                                    },
                                  });
                                }}
                                className="w-full bg-black border border-white/10 rounded px-3 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                                Last Name
                              </label>
                              <input
                                type="text"
                                value={player.lastName}
                                onChange={(e) => {
                                  const newPlayers = [
                                    ...data.upcomingGame.reservedPlayers,
                                  ];
                                  newPlayers[idx].lastName = e.target.value;
                                  setData({
                                    ...data,
                                    upcomingGame: {
                                      ...data.upcomingGame,
                                      reservedPlayers: newPlayers,
                                    },
                                  });
                                }}
                                className="w-full bg-black border border-white/10 rounded px-3 py-1 text-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newPlayers = (
                                data.upcomingGame?.reservedPlayers || []
                              ).filter((_, i) => i !== idx);
                              setData({
                                ...data,
                                upcomingGame: {
                                  ...data.upcomingGame,
                                  reservedPlayers: newPlayers,
                                },
                              });
                            }}
                            className="ml-4 text-white/20 hover:text-neon-red"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                              Age
                            </label>
                            <input
                              type="number"
                              value={player.age}
                              onChange={(e) => {
                                const newPlayers = [
                                  ...data.upcomingGame.reservedPlayers,
                                ];
                                newPlayers[idx].age = parseInt(e.target.value);
                                setData({
                                  ...data,
                                  upcomingGame: {
                                    ...data.upcomingGame,
                                    reservedPlayers: newPlayers,
                                  },
                                });
                              }}
                              className="w-full bg-black border border-white/10 rounded px-3 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                              Positions (1-5)
                            </label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((pos) => (
                                <button
                                  key={pos}
                                  onClick={() => {
                                    const newPlayers = [
                                      ...(data.upcomingGame?.reservedPlayers ||
                                        []),
                                    ];
                                    const currentPositions =
                                      newPlayers[idx]?.positions || [];
                                    if (currentPositions.includes(pos)) {
                                      newPlayers[idx].positions =
                                        currentPositions.filter(
                                          (p) => p !== pos,
                                        );
                                    } else if (currentPositions.length < 2) {
                                      newPlayers[idx].positions = [
                                        ...currentPositions,
                                        pos,
                                      ];
                                    }
                                    setData({
                                      ...data,
                                      upcomingGame: {
                                        ...data.upcomingGame,
                                        reservedPlayers: newPlayers,
                                      },
                                    });
                                  }}
                                  className={`w-8 h-8 rounded border text-[10px] font-bold flex items-center justify-center transition-colors ${
                                    (player.positions || []).includes(pos)
                                      ? "bg-neon-blue border-neon-blue text-black"
                                      : "bg-black border-white/10 text-white/40"
                                  }`}
                                >
                                  {pos}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="space-y-8">
              <div className="bg-neon-blue/5 border border-neon-blue/20 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-neon-blue">
                  <Trophy size={20} />
                  <h3 className="font-display text-xl">
                    MVP of the Day Spotlight
                  </h3>
                </div>
                <p className="text-xs text-white/40 font-mono">
                  This text appears next to the MVP card on the main site.
                </p>
                <textarea
                  value={data.mvpDescription || ""}
                  onChange={(e) =>
                    setData({ ...data, mvpDescription: e.target.value })
                  }
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:border-neon-blue"
                  placeholder="Write something about today's MVP dominance..."
                />
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-display">Game History</h2>
                <button
                  onClick={() =>
                    setData({
                      ...data,
                      games: [
                        {
                          id: Math.random().toString(36).substr(2, 9),
                          date: new Date().toLocaleDateString(),
                          location: "Hoops Dome, QC",
                          teamWhite: { score: 0, players: [] },
                          teamBlue: { score: 0, players: [] },
                          mvpId: "",
                        },
                        ...(data.games || []),
                      ],
                    })
                  }
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-mono uppercase"
                >
                  Add New Game
                </button>
              </div>

              <div className="space-y-6">
                {(data.games || []).map((game, gIdx) => (
                  <div
                    key={game.id}
                    className="bg-card-bg p-6 rounded-2xl border border-white/5 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        <div>
                          <label className="block text-xs font-mono text-white/40 uppercase mb-1">
                            Date
                          </label>
                          <input
                            type="text"
                            value={game.date}
                            onChange={(e) => {
                              const newGames = [...data.games];
                              newGames[gIdx].date = e.target.value;
                              setData({ ...data, games: newGames });
                            }}
                            className="w-full bg-black border border-white/10 rounded px-3 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-white/40 uppercase mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={game.location}
                            onChange={(e) => {
                              const newGames = [...data.games];
                              newGames[gIdx].location = e.target.value;
                              setData({ ...data, games: newGames });
                            }}
                            className="w-full bg-black border border-white/10 rounded px-3 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newGames = (data.games || []).filter(
                            (_, i) => i !== gIdx,
                          );
                          setData({ ...data, games: newGames });
                        }}
                        className="ml-4 text-white/20 hover:text-neon-red"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <input
                            type="text"
                            value={game.teamWhite?.name || "Team White"}
                            onChange={(e) => {
                              const newGames = [...(data.games || [])];
                              newGames[gIdx].teamWhite.name = e.target.value;
                              setData({ ...data, games: newGames });
                            }}
                            className="flex-1 bg-transparent border-b border-white/10 text-xs font-mono text-white/40 uppercase focus:border-neon-blue outline-none"
                          />
                          <input
                            type="number"
                            value={game.teamWhite?.score || 0}
                            onChange={(e) => {
                              const newGames = [...(data.games || [])];
                              newGames[gIdx].teamWhite.score = parseInt(
                                e.target.value,
                              );
                              setData({ ...data, games: newGames });
                            }}
                            className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-center font-display"
                          />
                        </div>
                        {/* Team White Players */}
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                              Players & Stats
                            </span>
                            <button
                              onClick={() => {
                                const newGames = [...data.games];
                                newGames[gIdx].teamWhite.players.push({
                                  name: "",
                                  pts: 0,
                                  reb: 0,
                                  ast: 0,
                                  stl: 0,
                                  blk: 0,
                                });
                                setData({ ...data, games: newGames });
                              }}
                              className="text-[10px] text-neon-blue hover:underline font-mono uppercase"
                            >
                              + Add
                            </button>
                          </div>
                          {game.teamWhite.players.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex flex-col gap-1 p-2 bg-black/40 rounded border border-white/5"
                            >
                              <div className="flex gap-1 items-center">
                                <input
                                  type="text"
                                  value={p.name}
                                  placeholder="Name"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamWhite.players[
                                      pIdx
                                    ].name = e.target.value;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="flex-1 bg-black border border-white/10 rounded px-2 py-1 text-[10px]"
                                />
                                <button
                                  onClick={() => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamWhite.players.splice(
                                      pIdx,
                                      1,
                                    );
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="text-white/20 hover:text-neon-red"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div className="grid grid-cols-5 gap-1">
                                <input
                                  type="number"
                                  value={p.pts}
                                  placeholder="PTS"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamWhite.players[pIdx].pts =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Points"
                                />
                                <input
                                  type="number"
                                  value={p.ast}
                                  placeholder="AST"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamWhite.players[pIdx].ast =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Assists"
                                />
                                <input
                                  type="number"
                                  value={p.reb}
                                  placeholder="REB"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamWhite.players[pIdx].reb =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Rebounds"
                                />
                                <input
                                  type="number"
                                  value={p.stl}
                                  placeholder="STL"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamWhite.players[pIdx].stl =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Steals"
                                />
                                <input
                                  type="number"
                                  value={p.blk}
                                  placeholder="BLK"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamWhite.players[pIdx].blk =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Blocks"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <input
                            type="text"
                            value={game.teamBlue?.name || "Team Blue"}
                            onChange={(e) => {
                              const newGames = [...(data.games || [])];
                              newGames[gIdx].teamBlue.name = e.target.value;
                              setData({ ...data, games: newGames });
                            }}
                            className="flex-1 bg-transparent border-b border-white/10 text-xs font-mono text-white/40 uppercase focus:border-neon-red outline-none"
                          />
                          <input
                            type="number"
                            value={game.teamBlue?.score || 0}
                            onChange={(e) => {
                              const newGames = [...(data.games || [])];
                              newGames[gIdx].teamBlue.score = parseInt(
                                e.target.value,
                              );
                              setData({ ...data, games: newGames });
                            }}
                            className="w-16 bg-black border border-white/10 rounded px-2 py-1 text-center font-display"
                          />
                        </div>
                        {/* Team Blue Players */}
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                              Players & Stats
                            </span>
                            <button
                              onClick={() => {
                                const newGames = [...data.games];
                                newGames[gIdx].teamBlue.players.push({
                                  name: "",
                                  pts: 0,
                                  reb: 0,
                                  ast: 0,
                                  stl: 0,
                                  blk: 0,
                                });
                                setData({ ...data, games: newGames });
                              }}
                              className="text-[10px] text-neon-blue hover:underline font-mono uppercase"
                            >
                              + Add
                            </button>
                          </div>
                          {game.teamBlue.players.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex flex-col gap-1 p-2 bg-black/40 rounded border border-white/5"
                            >
                              <div className="flex gap-1 items-center">
                                <input
                                  type="text"
                                  value={p.name}
                                  placeholder="Name"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamBlue.players[pIdx].name =
                                      e.target.value;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="flex-1 bg-black border border-white/10 rounded px-2 py-1 text-[10px]"
                                />
                                <button
                                  onClick={() => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamBlue.players.splice(
                                      pIdx,
                                      1,
                                    );
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="text-white/20 hover:text-neon-red"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div className="grid grid-cols-5 gap-1">
                                <input
                                  type="number"
                                  value={p.pts}
                                  placeholder="PTS"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamBlue.players[pIdx].pts =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Points"
                                />
                                <input
                                  type="number"
                                  value={p.ast}
                                  placeholder="AST"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamBlue.players[pIdx].ast =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Assists"
                                />
                                <input
                                  type="number"
                                  value={p.reb}
                                  placeholder="REB"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamBlue.players[pIdx].reb =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Rebounds"
                                />
                                <input
                                  type="number"
                                  value={p.stl}
                                  placeholder="STL"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamBlue.players[pIdx].stl =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Steals"
                                />
                                <input
                                  type="number"
                                  value={p.blk}
                                  placeholder="BLK"
                                  onChange={(e) => {
                                    const newGames = [...data.games];
                                    newGames[gIdx].teamBlue.players[pIdx].blk =
                                      parseInt(e.target.value) || 0;
                                    setData({ ...data, games: newGames });
                                  }}
                                  className="bg-black border border-white/10 rounded px-1 py-0.5 text-[9px] text-center"
                                  title="Blocks"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-mono text-white/40 uppercase">
                            MVP of the Game
                          </label>
                          <button
                            onClick={() => {
                              const allGamePlayers = [
                                ...(game.teamWhite?.players || []),
                                ...(game.teamBlue?.players || []),
                              ];
                              if (allGamePlayers.length > 0) {
                                const topPlayer = allGamePlayers.reduce(
                                  (prev, current) =>
                                    prev.pts > current.pts ? prev : current,
                                );
                                const actualPlayer = data.players.find(
                                  (p) =>
                                    p.name.toLowerCase() ===
                                    topPlayer.name.toLowerCase(),
                                );
                                if (actualPlayer) {
                                  const newGames = [...data.games];
                                  newGames[gIdx].mvpId = actualPlayer.id;
                                  setData({ ...data, games: newGames });
                                } else {
                                  alert(
                                    `Could not find profile for ${topPlayer.name}.`,
                                  );
                                }
                              }
                            }}
                            className="text-[8px] text-neon-blue hover:underline font-mono uppercase"
                          >
                            Auto-Select
                          </button>
                        </div>
                        <select
                          value={game.mvpId}
                          onChange={(e) => {
                            const newGames = [...data.games];
                            newGames[gIdx].mvpId = e.target.value;
                            setData({ ...data, games: newGames });
                          }}
                          className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="">Select MVP</option>
                          {data.players.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                          Player of the Night
                        </label>
                        <select
                          value={game.playerOfTheNightId || ""}
                          onChange={(e) => {
                            const newGames = [...data.games];
                            newGames[gIdx].playerOfTheNightId = e.target.value;
                            setData({ ...data, games: newGames });
                          }}
                          className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="">Select POTN</option>
                          {data.players.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                            Hustle Player 1
                          </label>
                          <select
                            value={(game.hustlePlayerIds || [])[0] || ""}
                            onChange={(e) => {
                              const newGames = [...data.games];
                              const currentIds = [
                                ...(newGames[gIdx].hustlePlayerIds || []),
                              ];
                              currentIds[0] = e.target.value;
                              newGames[gIdx].hustlePlayerIds = currentIds;
                              setData({ ...data, games: newGames });
                            }}
                            className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="">Select Hustle 1</option>
                            {data.players.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                            Hustle Player 2
                          </label>
                          <select
                            value={(game.hustlePlayerIds || [])[1] || ""}
                            onChange={(e) => {
                              const newGames = [...data.games];
                              const currentIds = [
                                ...(newGames[gIdx].hustlePlayerIds || []),
                              ];
                              currentIds[1] = e.target.value;
                              newGames[gIdx].hustlePlayerIds = currentIds;
                              setData({ ...data, games: newGames });
                            }}
                            className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="">Select Hustle 2</option>
                            {data.players.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "players" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-display">Player Stats</h2>
                <div className="flex gap-3">
                  <input
                    type="file"
                    ref={excelInputRef}
                    className="hidden"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelUpload}
                  />
                  <button
                    onClick={() => excelInputRef.current?.click()}
                    className="bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/20 px-4 py-2 rounded-lg text-xs font-mono uppercase text-neon-blue flex items-center gap-2 transition-all"
                  >
                    <Save size={14} />
                    Upload Excel
                  </button>
                  <button
                    onClick={() =>
                      setData({
                        ...data,
                        players: [
                          ...(data.players || []),
                          {
                            id: Math.random().toString(36).substr(2, 9),
                            name: "New Player",
                            points: 0,
                            rebounds: 0,
                            assists: 0,
                            steals: 0,
                            blocks: 0,
                            fg2m: 0,
                            fg3m: 0,
                            oreb: 0,
                            dreb: 0,
                            gamesPlayed: 0,
                            mvps: 0,
                            wins: 0,
                            image: "https://picsum.photos/seed/new/800/1000",
                          },
                        ],
                      })
                    }
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-mono uppercase"
                  >
                    Add Player
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {(data.players || []).map((player, pIdx) => (
                  <div
                    key={player.id}
                    className="bg-card-bg p-6 rounded-2xl border border-white/5 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 items-center flex-1">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                          {player.image ? (
                            <img
                              src={player.image}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="text-white/20" size={24} />
                          )}
                        </div>
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => {
                            const newPlayers = [...data.players];
                            newPlayers[pIdx].name = e.target.value;
                            setData({ ...data, players: newPlayers });
                          }}
                          className="bg-transparent border-b border-white/10 focus:border-neon-blue px-2 py-1 text-xl font-display"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newPlayers = (data.players || []).filter(
                            (_, i) => i !== pIdx,
                          );
                          setData({ ...data, players: newPlayers });
                        }}
                        className="text-white/20 hover:text-neon-red"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-4">
                      {[
                        { label: "PTS", key: "points" },
                        { label: "REB", key: "rebounds" },
                        { label: "AST", key: "assists" },
                        { label: "STL", key: "steals" },
                        { label: "BLK", key: "blocks" },
                        { label: "2PM", key: "fg2m" },
                        { label: "3PM", key: "fg3m" },
                        { label: "OREB", key: "oreb" },
                        { label: "DREB", key: "dreb" },
                        { label: "GP", key: "gamesPlayed" },
                        { label: "MVPs", key: "mvps" },
                      ].map((stat) => (
                        <div key={stat.key}>
                          <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                            {stat.label}
                          </label>
                          <input
                            type="number"
                            value={(player as any)[stat.key] || 0}
                            onChange={(e) => {
                              const newPlayers = [...data.players];
                              (newPlayers[pIdx] as any)[stat.key] =
                                parseInt(e.target.value) || 0;
                              setData({ ...data, players: newPlayers });
                            }}
                            className="w-full bg-black border border-white/10 rounded px-2 py-1 text-sm text-center"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                        Player Photo (MVP Photo)
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={player.image}
                            onChange={(e) => {
                              const newPlayers = [...data.players];
                              newPlayers[pIdx].image = e.target.value;
                              setData({ ...data, players: newPlayers });
                            }}
                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs font-mono focus:border-neon-blue outline-none"
                            placeholder="Paste URL or use upload button ->"
                          />
                        </div>
                        <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 flex items-center justify-center transition-colors group">
                          {uploadingId === player.id ? (
                            <Loader2
                              size={16}
                              className="animate-spin text-neon-blue"
                            />
                          ) : (
                            <Camera
                              size={16}
                              className="text-white/40 group-hover:text-white"
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, player.id)}
                            disabled={uploadingId !== null}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "awards" && (
            <div className="space-y-12">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-3xl font-display">Game Awards</h2>
                  <p className="text-white/40 text-xs font-mono uppercase tracking-widest">
                    Spotlight the best from the latest run
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleResetAwards}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl font-mono text-xs hover:bg-white/10 transition-all uppercase tracking-widest"
                  >
                    <RotateCcw size={16} />
                    Reset Awards
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-neon-blue text-black px-6 py-3 rounded-xl font-display text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,242,255,0.4)] disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Save size={20} />
                    )}
                    SAVE AWARDS
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    id: "potn",
                    type: "Player of the Night",
                    label: "Player of the Night",
                  },
                  {
                    id: "hustle1",
                    type: "Hustle Player",
                    label: "Hustle Player 1",
                  },
                  {
                    id: "hustle2",
                    type: "Hustle Player",
                    label: "Hustle Player 2",
                  },
                ].map((slot) => {
                  const award = (data.awards || []).find(
                    (a) => a.slotId === slot.id && a.isCurrent,
                  ) || {
                    id: Math.random().toString(36).substr(2, 9),
                    type: slot.type as any,
                    slotId: slot.id,
                    isCurrent: true,
                    playerName: "",
                    photoUrl: "",
                    stats: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0 },
                    caption: "",
                    gameDate: new Date().toISOString().split("T")[0],
                  };

                  return (
                    <div key={slot.id} className="space-y-6">
                      <div className="bg-card-bg p-6 rounded-2xl border border-white/5 space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-display text-neon-blue uppercase tracking-tighter">
                            {slot.label}
                          </h3>
                          {slot.type === "Player of the Night" ? (
                            <Trophy size={18} className="text-yellow-500" />
                          ) : (
                            <Zap size={18} className="text-neon-red" />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 group">
                            {award.photoUrl ? (
                              <img
                                src={award.photoUrl}
                                alt={slot.label}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                                <Camera size={24} className="mb-2" />
                                <span className="text-[8px] font-mono uppercase">
                                  No Photo
                                </span>
                              </div>
                            )}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) =>
                                  handleAwardImageUpload(
                                    e,
                                    slot.id,
                                    slot.type as any,
                                  )
                                }
                              />
                              <div className="flex items-center gap-2 text-[10px] font-mono uppercase">
                                <Plus size={14} />
                                {award.photoUrl ? "Change" : "Upload"}
                              </div>
                            </label>
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono text-white/40 uppercase mb-1">
                              Player Name
                            </label>
                            <select
                              value={award.playerName}
                              onChange={(e) => {
                                const newAwards = [...(data.awards || [])];
                                const idx = newAwards.findIndex(
                                  (a) => a.slotId === slot.id && a.isCurrent,
                                );
                                if (idx > -1) {
                                  newAwards[idx].playerName = e.target.value;
                                } else {
                                  newAwards.push({
                                    ...award,
                                    playerName: e.target.value,
                                  });
                                }
                                setData({ ...data, awards: newAwards });
                              }}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-neon-blue text-xs"
                            >
                              <option value="">Select Player</option>
                              {data.players.map((p) => (
                                <option key={p.id} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-5 gap-1">
                            {(["pts", "reb", "ast", "stl", "blk"] as const).map(
                              (stat) => (
                                <div key={stat}>
                                  <label className="block text-[7px] font-mono text-white/40 uppercase mb-1">
                                    {stat}
                                  </label>
                                  <input
                                    type="number"
                                    value={award.stats[stat]}
                                    onChange={(e) => {
                                      const newAwards = [
                                        ...(data.awards || []),
                                      ];
                                      const idx = newAwards.findIndex(
                                        (a) =>
                                          a.slotId === slot.id && a.isCurrent,
                                      );
                                      if (idx > -1) {
                                        newAwards[idx].stats[stat] =
                                          parseInt(e.target.value) || 0;
                                      } else {
                                        newAwards.push({
                                          ...award,
                                          stats: {
                                            ...award.stats,
                                            [stat]:
                                              parseInt(e.target.value) || 0,
                                          },
                                        });
                                      }
                                      setData({ ...data, awards: newAwards });
                                    }}
                                    className="w-full bg-black border border-white/10 rounded-lg px-1 py-1 text-center text-[10px] focus:outline-none focus:border-neon-blue"
                                  />
                                </div>
                              ),
                            )}
                          </div>

                          <div>
                            <label className="block text-[8px] font-mono text-white/40 uppercase mb-1">
                              Caption
                            </label>
                            <textarea
                              value={award.caption}
                              onChange={(e) => {
                                const newAwards = [...(data.awards || [])];
                                const idx = newAwards.findIndex(
                                  (a) => a.slotId === slot.id && a.isCurrent,
                                );
                                if (idx > -1) {
                                  newAwards[idx].caption = e.target.value;
                                } else {
                                  newAwards.push({
                                    ...award,
                                    caption: e.target.value,
                                  });
                                }
                                setData({ ...data, awards: newAwards });
                              }}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-1.5 h-16 resize-none focus:outline-none focus:border-neon-blue text-xs"
                              placeholder="Short caption..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Poster Preview */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest text-center">
                          Preview
                        </h4>
                        <div className="max-w-[240px] mx-auto scale-90">
                          <AwardCard award={award} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTab === "social" && (
            <div className="space-y-12">
              {/* Manual Social Posts Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-neon-blue/20 rounded-xl">
                      <ImageIcon className="text-neon-blue" size={24} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display">
                        Social Feed Posts
                      </h2>
                      <p className="text-xs text-white/40 font-mono">
                        Create and manage posts for the main social wall
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setData({
                        ...data!,
                        socialPosts: [
                          {
                            id: Math.random().toString(36).substr(2, 9),
                            authorName: "Mabisa Basketball",
                            content: "",
                            createdAt: new Date().toISOString(),
                            imageUrl:
                              "https://picsum.photos/seed/" +
                              Math.random() +
                              "/800/600",
                            likes: 0,
                            comments: 0,
                            commentsList: [],
                          },
                          ...(data?.socialPosts || []),
                        ],
                      })
                    }
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-mono uppercase flex items-center gap-2"
                  >
                    <Plus size={14} /> New Post
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {(data?.socialPosts || []).map((post, pIdx) => (
                    <div
                      key={post.id}
                      className="bg-card-bg p-4 md:p-6 rounded-2xl border border-white/5 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1 w-full space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                                Author
                              </label>
                              <input
                                type="text"
                                value={post.authorName}
                                onChange={(e) => {
                                  const newPosts = [...data!.socialPosts];
                                  newPosts[pIdx].authorName = e.target.value;
                                  setData({ ...data!, socialPosts: newPosts });
                                }}
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 md:py-1 text-base md:text-sm font-bold focus:border-neon-blue outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                                Date (ISO Format)
                              </label>
                              <input
                                type="text"
                                value={post.createdAt}
                                onChange={(e) => {
                                  const newPosts = [...data!.socialPosts];
                                  newPosts[pIdx].createdAt = e.target.value;
                                  setData({ ...data!, socialPosts: newPosts });
                                }}
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 md:py-1 text-base md:text-sm focus:border-neon-blue outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                              Caption / Message
                            </label>
                            <textarea
                              value={post.content}
                              onChange={(e) => {
                                const newPosts = [...data!.socialPosts];
                                newPosts[pIdx].content = e.target.value;
                                setData({ ...data!, socialPosts: newPosts });
                              }}
                              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-base md:text-sm h-24 focus:outline-none focus:border-neon-blue"
                              placeholder="What's happening?"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                                Image URL
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={post.imageUrl}
                                  onChange={(e) => {
                                    const newPosts = [...data!.socialPosts];
                                    newPosts[pIdx].imageUrl = e.target.value;
                                    setData({
                                      ...data!,
                                      socialPosts: newPosts,
                                    });
                                  }}
                                  className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-3 md:py-1 text-base md:text-sm font-mono focus:border-neon-blue outline-none"
                                  placeholder="https://..."
                                />
                                <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 flex items-center justify-center transition-colors group">
                                  {uploadingSocialId === post.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin text-neon-blue"
                                    />
                                  ) : (
                                    <Camera
                                      size={16}
                                      className="text-white/40 group-hover:text-white"
                                    />
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleSocialImageUpload(e, post.id)
                                    }
                                    disabled={uploadingSocialId !== null}
                                  />
                                </label>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                                  Likes
                                </label>
                                <input
                                  type="number"
                                  value={post.likes}
                                  onChange={(e) => {
                                    const newPosts = [...data!.socialPosts];
                                    newPosts[pIdx].likes =
                                      parseInt(e.target.value) || 0;
                                    setData({
                                      ...data!,
                                      socialPosts: newPosts,
                                    });
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 md:py-1 text-base md:text-sm font-mono focus:border-neon-blue outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono text-white/40 uppercase mb-1">
                                  Comments
                                </label>
                                <input
                                  type="number"
                                  value={post.comments}
                                  onChange={(e) => {
                                    const newPosts = [...data!.socialPosts];
                                    newPosts[pIdx].comments =
                                      parseInt(e.target.value) || 0;
                                    setData({
                                      ...data!,
                                      socialPosts: newPosts,
                                    });
                                  }}
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 md:py-1 text-base md:text-sm font-mono focus:border-neon-blue outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-full md:w-auto md:ml-6 flex flex-row md:flex-col items-center justify-between md:justify-start gap-4">
                          <div className="w-full md:w-32 aspect-video bg-black rounded-lg border border-white/10 overflow-hidden flex items-center justify-center">
                            {post.imageUrl ? (
                              <img
                                src={post.imageUrl}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/10">
                                <ImageIcon size={24} />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const newPosts = (data!.socialPosts || []).filter(
                                (_, i) => i !== pIdx,
                              );
                              setData({ ...data!, socialPosts: newPosts });
                            }}
                            className="p-3 md:p-0 text-white/20 hover:text-neon-red transition-colors bg-white/5 md:bg-transparent rounded-lg"
                          >
                            <Trash2 size={24} className="md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-12 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-neon-red/20 rounded-xl">
                      <MessageSquare className="text-neon-red" size={24} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display">
                        Trash Talk Corner
                      </h2>
                      <p className="text-xs text-white/40 font-mono">
                        Manage the community banter messages
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setData({
                        ...data!,
                        socialMessages: [
                          {
                            user: "Admin",
                            msg: "New message",
                            time: new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }),
                            timestamp: Timestamp.now(),
                          },
                          ...(data!.socialMessages || []),
                        ],
                      })
                    }
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-mono uppercase flex items-center gap-2"
                  >
                    <Plus size={14} /> Add Message
                  </button>
                </div>

                <div className="space-y-4">
                  {(data.socialMessages || []).map((msg, mIdx) => (
                    <div
                      key={mIdx}
                      className="bg-card-bg p-4 rounded-xl border border-white/5 space-y-3"
                    >
                      <div className="flex justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col md:flex-row gap-2 md:gap-4 flex-1">
                          <input
                            type="text"
                            value={msg.user}
                            onChange={(e) => {
                              const newMsgs = [...data.socialMessages];
                              newMsgs[mIdx].user = e.target.value;
                              setData({ ...data, socialMessages: newMsgs });
                            }}
                            className="bg-black border border-white/10 rounded-lg px-4 py-3 md:py-1 text-base md:text-sm font-bold text-neon-blue focus:border-neon-blue outline-none"
                            placeholder="User"
                          />
                          <input
                            type="text"
                            value={msg.time}
                            onChange={(e) => {
                              const newMsgs = [...data.socialMessages];
                              newMsgs[mIdx].time = e.target.value;
                              setData({ ...data, socialMessages: newMsgs });
                            }}
                            className="bg-black border border-white/10 rounded-lg px-4 py-3 md:py-1 text-base md:text-[10px] focus:border-neon-blue outline-none"
                            placeholder="Time (e.g. 2h ago)"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newMsgs = (data.socialMessages || []).filter(
                              (_, i) => i !== mIdx,
                            );
                            setData({ ...data, socialMessages: newMsgs });
                          }}
                          className="p-3 md:p-0 text-white/20 hover:text-neon-red bg-white/5 md:bg-transparent rounded-lg"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <textarea
                        value={msg.msg}
                        onChange={(e) => {
                          const newMsgs = [...data.socialMessages];
                          newMsgs[mIdx].msg = e.target.value;
                          setData({ ...data, socialMessages: newMsgs });
                        }}
                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-base md:text-sm h-20 focus:outline-none focus:border-neon-red"
                        placeholder="Message content..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
