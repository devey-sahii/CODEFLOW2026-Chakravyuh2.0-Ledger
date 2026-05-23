"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Smartphone,
} from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    setError(null);

    // Auto-advance
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (cleaned && index === OTP_LENGTH - 1 && newOtp.every((d) => d)) {
      verifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    if (pasted.length) {
      const newOtp = [...otp];
      pasted.split("").forEach((char, i) => { newOtp[i] = char; });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      if (pasted.length === OTP_LENGTH) verifyOtp(pasted);
    }
  };

  const verifyOtp = useCallback(async (code: string) => {
    setIsVerifying(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 1500));

    // Demo: any 6-digit code works
    if (code.length === 6) {
      setIsSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } else {
      setError("Invalid OTP. Please try again.");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
    setIsVerifying(false);
  }, [router]);

  const handleResend = () => {
    setCanResend(false);
    setCountdown(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(null);
    inputRefs.current[0]?.focus();
  };

  const filledCount = otp.filter(Boolean).length;

  return (
    <AnimatePresence mode="wait">
      {!isSuccess ? (
        <motion.div
          key="verify"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">Verify your identity</h1>
            <p className="text-slate-400 text-sm">
              Enter the 6-digit OTP sent to your registered email or phone.
            </p>
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center"
              >
                <Smartphone className="w-10 h-10 text-indigo-400" />
              </motion.div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* OTP boxes */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <motion.input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={otp[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={isVerifying}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`otp-input ${otp[i] ? "filled" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ width: 48, height: 60 }}
              />
            ))}
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-200 ${
                  i < filledCount ? "w-6 bg-indigo-500" : "w-3 bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verify button */}
          <button
            type="button"
            onClick={() => verifyOtp(otp.join(""))}
            disabled={isVerifying || filledCount < OTP_LENGTH}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Verify OTP
              </>
            )}
          </button>

          {/* Resend */}
          <div className="text-center space-y-1">
            <p className="text-sm text-slate-500">Didn&apos;t receive the code?</p>
            {canResend ? (
              <button
                onClick={handleResend}
                className="flex items-center gap-1.5 mx-auto text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resend OTP
              </button>
            ) : (
              <div className="text-sm text-slate-600">
                Resend in{" "}
                <span className="text-indigo-400 font-mono font-medium tabular-nums">
                  {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                  {String(countdown % 60).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </motion.div>
      ) : (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center space-y-6 py-8"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400" />
              </div>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-3xl border-2 border-emerald-500/20"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.2 + i * 0.15, opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Identity verified!</h2>
            <p className="text-slate-400 text-sm">
              You&apos;ve successfully verified your identity.
              <br />
              Redirecting to dashboard...
            </p>
          </div>

          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-indigo-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
