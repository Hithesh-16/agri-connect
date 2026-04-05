"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";

const OTP_LENGTH = 6;

function OTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mobile = searchParams.get("mobile") || "";
  const aadhaar = searchParams.get("aadhaar") || "";
  const role = searchParams.get("role") || "farmer";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, key: string) {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter complete 6-digit OTP");
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 1000));
    setVerifying(false);
    const params = new URLSearchParams({ mobile, aadhaar, role });
    router.push(`/personal-info?${params.toString()}`);
  }

  function handleResend() {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }

  const displayNumber = mobile
    ? `+91 ${mobile}`
    : aadhaar
      ? `Aadhaar ${aadhaar.slice(0, 4)}XXXX${aadhaar.slice(-4)}`
      : "your number";

  return (
    <div className="min-h-screen bg-kisan-bg dark:bg-gray-900">
      <div className="bg-primary px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Verify OTP</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-md mx-auto flex flex-col items-center justify-center px-7 py-16 gap-5">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
          <ShieldCheck size={40} className="text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-kisan-text dark:text-gray-100 text-center">
          Enter Verification Code
        </h2>
        <p className="text-sm text-kisan-text-secondary text-center leading-[22px]">
          We sent a 6-digit OTP to
          <br />
          <span className="font-semibold text-kisan-text dark:text-gray-200">
            {displayNumber}
          </span>
        </p>

        <div className="flex gap-2.5">
          {Array(OTP_LENGTH)
            .fill(0)
            .map((_, i) => (
              <input
                key={i}
                ref={(r) => {
                  inputRefs.current[i] = r;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i]}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e.key)}
                className={`w-12 h-14 rounded-xl border-2 text-center text-[22px] font-bold outline-none transition-colors bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 ${
                  otp[i]
                    ? "border-primary bg-primary/[0.04]"
                    : error
                      ? "border-kisan-red"
                      : "border-kisan-border dark:border-gray-600"
                } focus:border-primary`}
              />
            ))}
        </div>

        {error && (
          <p className="text-sm text-kisan-red text-center">{error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-4 font-bold text-[17px] shadow-lg shadow-primary/25 hover:bg-primary-light transition-colors disabled:opacity-70 active:scale-[0.98]"
        >
          {verifying ? (
            "Verifying..."
          ) : (
            <>
              Verify &amp; Continue
              <Check size={20} />
            </>
          )}
        </button>

        <div className="text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-sm font-semibold text-primary"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-sm text-kisan-text-secondary">
              Resend in{" "}
              <span className="text-primary font-medium">{timer}s</span>
            </p>
          )}
        </div>

        <p className="text-[11px] text-kisan-text-light">
          Demo: any 6 digits work
        </p>
      </div>
    </div>
  );
}

export default function OTPPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-kisan-bg flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OTPContent />
    </Suspense>
  );
}
