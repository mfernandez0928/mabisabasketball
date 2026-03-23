import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Timer,
  Users,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  X,
  Camera,
  Loader2,
  QrCode,
  Check,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { UpcomingGame } from "../types";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { db } from "../lib/firebase";
import { supabase, uploadFile } from "../lib/supabase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { safeParseDate } from "../lib/dateUtils";

interface HeroProps {
  game: UpcomingGame;
  onRefresh: () => void;
  gcashNumber?: string;
  gcashQrCode?: string;
}

export const Hero: React.FC<HeroProps> = ({
  game,
  onRefresh,
  gcashNumber,
  gcashQrCode,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showPlayers, setShowPlayers] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    positions: [] as number[],
    paymentMethod: "Cash" as "Cash" | "GCash",
    screenshotUrl: "",
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showZoomedQr, setShowZoomedQr] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  useEffect(() => {
    const target = safeParseDate(game.date).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game.date]);

  const togglePosition = (pos: number) => {
    setFormData((prev) => {
      if (prev.positions.includes(pos)) {
        return { ...prev, positions: prev.positions.filter((p) => p !== pos) };
      }
      if (prev.positions.length < 2) {
        return { ...prev, positions: [...prev.positions, pos] };
      }
      return prev;
    });
  };

  const handleScreenshotUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotFile(file);
    setUploadingScreenshot(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `payment_${Date.now()}.${fileExt}`;
      const filePath = `payments/${fileName}`;

      const publicUrl = await uploadFile("social-post", filePath, file);

      setFormData((prev) => ({ ...prev, screenshotUrl: publicUrl }));
    } catch (error: any) {
      console.error("Screenshot upload error:", error);
      alert(error.message || "Failed to upload screenshot. Please try again.");
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReservationError(null);

    const fullName = `${formData.firstName} ${formData.lastName}`
      .trim()
      .toLowerCase();

    // Check if already in reserved players
    const isAlreadyReserved = (game.reservedPlayers || []).some(
      (p) => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === fullName,
    );

    // Check if already in pending reservations
    const isAlreadyPendingRes = (game.pendingReservations || []).some(
      (p) => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === fullName,
    );

    // Check if already in pending payments
    const isAlreadyPendingPay = (game.pendingPayments || []).some(
      (p) => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === fullName,
    );

    if (isAlreadyReserved || isAlreadyPendingRes || isAlreadyPendingPay) {
      setReservationError(
        "A player with this name has already reserved or is pending confirmation for this game.",
      );
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    if (formData.paymentMethod === "GCash" && !formData.screenshotUrl) {
      setReservationError(
        "Please upload your GCash screenshot as proof of payment.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const newReservation = {
        id: Math.random().toString(36).substr(2, 9),
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: parseInt(formData.age),
        positions: formData.positions,
        paymentMethod: formData.paymentMethod,
        screenshotUrl: formData.screenshotUrl || null,
        timestamp: new Date().toISOString(),
      };

      const appDataRef = doc(db, "settings", "app_data");

      if (formData.paymentMethod === "GCash") {
        await updateDoc(appDataRef, {
          "upcomingGame.pendingPayments": arrayUnion(newReservation),
        });
      } else {
        await updateDoc(appDataRef, {
          "upcomingGame.pendingReservations": arrayUnion(newReservation),
        });
      }

      setIsSubmitting(false);
      setIsSuccess(true);
      onRefresh();

      // We don't auto-close immediately so they can read the message
      setTimeout(() => {
        setShowReserveModal(false);
        setIsSuccess(false);
        setReservationError(null);
        setStep(1);
        setFormData({
          firstName: "",
          lastName: "",
          age: "",
          positions: [],
          paymentMethod: "Cash",
          screenshotUrl: "",
        });
        setScreenshotFile(null);
      }, 8000); // 8 seconds to read the important message
    } catch (error) {
      console.error(error);
      setReservationError("Error reserving slot. Please try again.");
      setIsSubmitting(false);
    }
  };

  const actualFilledSlots = (game.reservedPlayers || []).length;
  const progress = (actualFilledSlots / (game.totalSlots || 1)) * 100;
  const gameDate = safeParseDate(game.date);

  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-4 pt-32 pb-40 sm:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-neon-blue/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-neon-red/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-4xl w-full pt-10"
      >
        {game.cashPrize && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{
              scale: 1,
              rotate: 0,
              y: [0, -10, 0],
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              y: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-amber-600 p-1 px-6 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.5)] mb-6 border-2 border-white/20"
          >
            <Trophy className="text-white" size={24} />
            <span className="text-black font-display text-2xl font-bold italic tracking-wider">
              CASH PRIZE: ₱{game.cashPrize}
            </span>
          </motion.div>
        )}
        <h1 className="text-4xl sm:text-6xl md:text-8xl mb-4 grungy-text italic leading-tight">
          Next Mabisa Run
        </h1>

        <div className="grid grid-cols-4 gap-2 md:gap-4 mb-8">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hrs", value: timeLeft.hours },
            { label: "Min", value: timeLeft.minutes },
            { label: "Sec", value: timeLeft.seconds },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-card-bg/80 border border-white/10 p-2 md:p-4 rounded-xl backdrop-blur-sm"
            >
              <div className="text-xl sm:text-3xl md:text-5xl font-mono font-bold text-neon-blue">
                {item.value.toString().padStart(2, "0")}
              </div>
              <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/50">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card-bg/90 border border-white/10 p-4 md:p-6 rounded-2xl mb-8 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-neon-blue/20 rounded-lg shrink-0">
                <MapPin className="text-neon-blue" size={20} />
              </div>
              <div>
                <div className="text-[10px] md:text-sm text-white/50 uppercase tracking-wider">
                  Location
                </div>
                <div className="text-sm md:text-lg font-semibold">
                  {game.location}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-neon-red/20 rounded-lg shrink-0">
                <Calendar className="text-neon-red" size={20} />
              </div>
              <div>
                <div className="text-[10px] md:text-sm text-white/50 uppercase tracking-wider">
                  Date & Time
                </div>
                <div className="text-sm md:text-lg font-semibold">
                  {format(gameDate, "EEEE, MMM dd")}
                  <br />
                  <span className="text-neon-blue">
                    {game.timeRange || format(gameDate, "hh:mm a")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg shrink-0">
                <Wallet className="text-yellow-500" size={20} />
              </div>
              <div>
                <div className="text-[10px] md:text-sm text-white/50 uppercase tracking-wider">
                  Entrance Fee
                </div>
                <div className="text-sm md:text-lg font-semibold">
                  ₱{game.entranceFee}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-green-500/20 rounded-lg shrink-0">
                <Users className="text-green-500" size={20} />
              </div>
              <div>
                <div className="text-[10px] md:text-sm text-white/50 uppercase tracking-wider">
                  Slots Left
                </div>
                <div className="text-sm md:text-lg font-semibold">
                  {(game.totalSlots || 0) - actualFilledSlots} /{" "}
                  {game.totalSlots}
                </div>
              </div>
            </div>
            {game.cashPrize && (
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg shrink-0">
                  <Trophy className="text-yellow-500" size={20} />
                </div>
                <div>
                  <div className="text-[10px] md:text-sm text-white/50 uppercase tracking-wider">
                    Cash Prize
                  </div>
                  <div className="text-sm md:text-lg font-semibold text-yellow-500">
                    ₱{game.cashPrize}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs uppercase tracking-widest font-bold">
                <span>Registration Progress</span>
                <span
                  className={cn(
                    progress > 80 ? "text-neon-red" : "text-neon-blue",
                  )}
                >
                  {Math.round(progress)}% Full
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={cn(
                    "h-full transition-colors duration-500",
                    progress > 80
                      ? "bg-neon-red shadow-[0_0_15px_rgba(255,0,68,0.5)]"
                      : "bg-neon-blue shadow-[0_0_15px_rgba(0,242,255,0.5)]",
                  )}
                />
              </div>
            </div>

            <button
              onClick={() => setShowPlayers(true)}
              className="w-full py-2 border border-white/10 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <Users size={14} />
              View Players List
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              setReservationError(null);
              setShowReserveModal(true);
            }}
            className="px-8 py-4 bg-neon-blue text-black font-display text-xl rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,242,255,0.4)]"
          >
            Reserve My Slot
          </button>
        </div>
      </motion.div>

      {/* Players List Modal */}
      <AnimatePresence>
        {showPlayers && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-28 sm:pb-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlayers(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-bg border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                <h3 className="text-2xl font-display">Reserved Players</h3>
                <button
                  onClick={() => setShowPlayers(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {(game.reservedPlayers || []).map((player, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-neon-blue/20 rounded-full flex items-center justify-center text-neon-blue font-mono text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="font-semibold">
                          {player.firstName} {player.lastName}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {(player.positions || []).map((pos) => (
                          <span
                            key={pos}
                            className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-white/60 uppercase border border-white/5"
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
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-white/10 bg-white/5 text-center">
                <div className="text-xs text-white/40 uppercase tracking-widest">
                  {(game.totalSlots || 0) - actualFilledSlots} Slots Remaining
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reservation Modal */}
      <AnimatePresence>
        {showReserveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-30 sm:pb-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmitting) {
                  setShowReserveModal(false);
                  setReservationError(null);
                }
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-bg border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[95vh]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                <h3 className="text-2xl font-display">Reserve Your Slot</h3>
                <button
                  onClick={() => {
                    setShowReserveModal(false);
                    setReservationError(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  disabled={isSubmitting}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 pb-10 sm:pb-6 overflow-y-auto flex-1 custom-scrollbar">
                {reservationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-neon-red/10 border border-neon-red/20 rounded-xl text-neon-red text-xs font-medium flex items-center gap-2"
                  >
                    <X size={14} className="shrink-0" />
                    {reservationError}
                  </motion.div>
                )}
                {isSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="py-12 text-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/50">
                      <Users size={40} />
                    </div>
                    <h4 className="text-2xl font-display text-green-500">
                      Reservation Received!
                    </h4>
                    <p className="text-white/80 font-medium">
                      We already received your reservation, {formData.firstName}
                      !
                    </p>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-white/60 space-y-2">
                      <p>
                        Make sure that you are already paid to see your name on
                        the list.
                      </p>
                      <p className="text-neon-blue font-bold uppercase tracking-wider">
                        Please contact the admins if not yet paid.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowReserveModal(false)}
                      className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors pt-4"
                    >
                      Close Window
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                              First Name
                            </label>
                            <input
                              required
                              type="text"
                              value={formData.firstName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  firstName: e.target.value,
                                })
                              }
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors"
                              placeholder="Juan"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                              Last Name
                            </label>
                            <input
                              required
                              type="text"
                              value={formData.lastName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  lastName: e.target.value,
                                })
                              }
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors"
                              placeholder="Dela Cruz"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                            Age
                          </label>
                          <input
                            required
                            type="number"
                            min="15"
                            max="60"
                            value={formData.age}
                            onChange={(e) =>
                              setFormData({ ...formData, age: e.target.value })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-blue transition-colors"
                            placeholder="25"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                            Positions (Select up to 2)
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((pos) => (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => togglePosition(pos)}
                                className={cn(
                                  "aspect-square rounded-xl border flex flex-col items-center justify-center transition-all",
                                  formData.positions.includes(pos)
                                    ? "bg-neon-blue border-neon-blue text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]"
                                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/20",
                                )}
                              >
                                <span className="text-lg font-display">
                                  {pos}
                                </span>
                                <span className="text-[8px] font-bold uppercase">
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
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                            Select Payment Method
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  paymentMethod: "Cash",
                                })
                              }
                              className={cn(
                                "py-2 px-3 rounded-xl border flex flex-row items-center justify-center gap-2 transition-all",
                                formData.paymentMethod === "Cash"
                                  ? "bg-neon-blue border-neon-blue text-black"
                                  : "bg-white/5 border-white/10 text-white/60 hover:border-white/20",
                              )}
                            >
                              <Wallet size={16} />
                              <span className="text-[10px] font-bold uppercase">
                                Cash
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  paymentMethod: "GCash",
                                })
                              }
                              className={cn(
                                "py-2 px-3 rounded-xl border flex flex-row items-center justify-center gap-2 transition-all",
                                formData.paymentMethod === "GCash"
                                  ? "bg-neon-blue border-neon-blue text-black"
                                  : "bg-white/5 border-white/10 text-white/60 hover:border-white/20",
                              )}
                            >
                              <QrCode size={16} />
                              <span className="text-[10px] font-bold uppercase">
                                GCash
                              </span>
                            </button>
                          </div>
                        </div>
                        {formData.paymentMethod === "GCash" && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10"
                          >
                            {/* Top Row: Two Equal Squares Side-by-Side */}
                            <div className="flex flex-row justify-center gap-4">
                              {/* LEFT SQUARE: QR CODE */}
                              <div
                                onClick={() => setShowZoomedQr(true)}
                                className="bg-white p-2 rounded-xl w-32 h-32 shrink-0 flex flex-col items-center justify-center overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform group relative"
                              >
                                {gcashQrCode ? (
                                  <>
                                    <img
                                      src={gcashQrCode}
                                      alt="GCash QR Code"
                                      className="w-full h-full object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                    {/* Overlay hint that appears on hover/always slightly visible */}
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="text-[10px] font-bold text-white uppercase text-center">
                                        Tap to
                                        <br />
                                        Enlarge
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white">
                                    <QrCode size={28} />
                                    <span className="text-[10px] font-bold mt-1">
                                      GCASH
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* RIGHT SQUARE: UPLOAD BOX */}
                              <label
                                className={cn(
                                  "w-32 h-32 shrink-0 rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg",
                                  formData.screenshotUrl
                                    ? "border-green-500/50 bg-green-500/10 text-green-500"
                                    : "border-white/20 hover:border-white/40 bg-white/5 text-white/40 hover:text-white/80",
                                )}
                              >
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleScreenshotUpload}
                                />
                                {uploadingScreenshot ? (
                                  <Loader2
                                    className="animate-spin text-neon-blue"
                                    size={28}
                                  />
                                ) : formData.screenshotUrl ? (
                                  <>
                                    <Check size={28} className="mb-2" />
                                    <span className="text-[10px] font-bold uppercase text-center leading-tight">
                                      Proof
                                      <br />
                                      Attached
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Camera size={28} className="mb-2" />
                                    <span className="text-[10px] font-bold uppercase text-center leading-tight">
                                      Tap to
                                      <br />
                                      Upload Proof
                                    </span>
                                  </>
                                )}
                              </label>
                            </div>

                            {/* Bottom Row: Centered Text */}
                            <div className="text-center bg-black/20 py-2 rounded-xl border border-white/5">
                              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                                Scan to Pay
                              </p>
                              <p className="text-sm font-bold text-neon-blue leading-none mb-1">
                                Mabisa Basketball
                              </p>
                              <p className="text-xs text-white/60 font-mono">
                                {gcashNumber || "0917-XXX-XXXX"}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {formData.paymentMethod === "Cash" && (
                          <div className="p-6 bg-neon-blue/5 rounded-2xl border border-neon-blue/20 text-center">
                            <p className="text-sm text-neon-blue font-medium">
                              You can pay the entrance fee directly at the
                              venue. Your reservation will be added to the list
                              immediately.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4">
                      {step === 2 && (
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          // Changed py-4 -> py-2.5, text-lg -> text-sm
                          className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl font-display text-sm hover:bg-white/5 transition-colors"
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          uploadingScreenshot ||
                          (step === 1 && formData.positions.length === 0)
                        }
                        className="flex-[2] px-8 py-4 bg-neon-blue text-black font-display text-xl rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,242,255,0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            RESERVING...
                          </>
                        ) : (
                          <>
                            {step === 1 ? "Next Step" : "Confirm Reservation"}
                            <ChevronRight size={20} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Zoomed QR Code Modal */}
      <AnimatePresence>
        {showZoomedQr && gcashQrCode && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowZoomedQr(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-zoom-out"
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-sm bg-white p-4 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center"
            >
              <button
                onClick={() => setShowZoomedQr(false)}
                className="absolute -top-4 -right-4 bg-neon-red text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <X size={20} />
              </button>

              <img
                src={gcashQrCode}
                alt="Enlarged GCash QR Code"
                className="w-full aspect-square object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />

              <div className="mt-4 text-center pb-2">
                <p className="text-black font-display text-xl leading-none">
                  Mabisa Basketball
                </p>
                <p className="text-gray-500 font-mono text-sm mt-1">
                  {gcashNumber || "0917-XXX-XXXX"}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
