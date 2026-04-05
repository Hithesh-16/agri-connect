"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Smartphone, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (step === "otp" && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, timer]);

  function handleSendOtp() {
    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setError("Enter valid 10-digit mobile number");
      return;
    }
    setError("");
    setStep("otp");
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");
    if (digit && index < 5) {
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
    if (code.length !== 6) {
      setError("Enter complete 6-digit OTP");
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 1000));
    signIn({
      mobile,
      firstName: "Returning",
      surname: "User",
      role: "farmer",
      updatesConsent: true,
      selectedCropIds: ["wheat", "rice", "cotton", "chili", "tomato"],
      selectedMandiIds: ["m1", "m2", "m3"],
      lastActive: Date.now(),
    });
    router.replace("/home");
  }

  return (
    <div className="min-h-screen bg-kisan-bg dark:bg-gray-900">
      <div className="bg-primary px-4 py-4 flex items-center justify-between">
        <button onClick={() => (step === "otp" ? setStep("mobile") : router.back())} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Login</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-md mx-auto flex flex-col items-center px-7 py-12 gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
          {step === "mobile" ? (
            <Smartphone size={40} className="text-primary" />
          ) : (
            <ShieldCheck size={40} className="text-primary" />
          )}
        </div>

        {step === "mobile" ? (
          <>
            <h2 className="text-2xl font-bold text-kisan-text dark:text-gray-100 text-center">Welcome Back</h2>
            <p className="text-sm text-kisan-text-secondary text-center">Enter your registered mobile number</p>
            <div className={`w-full flex items-center gap-2.5 bg-white dark:bg-gray-800 border-[1.5px] rounded-xl px-3.5 py-3.5 ${error ? "border-kisan-red" : "border-kisan-border dark:border-gray-600"}`}>
              <span className="font-semibold text-[15px] text-kisan-text dark:text-gray-200">+91</span>
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "")); setError(""); }}
                placeholder="Enter 10-digit number"
                className="flex-1 bg-transparent outline-none text-base text-kisan-text dark:text-gray-100 placeholder:text-kisan-text-light"
              />
            </div>
            {error && <p className="text-xs text-kisan-red w-full">{error}</p>}
            <button onClick={handleSendOtp} className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-4 font-bold text-[17px] shadow-lg shadow-primary/25 hover:bg-primary-light transition-colors active:scale-[0.98]">
              Send OTP <ArrowRight size={20} />
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-kisan-text dark:text-gray-100 text-center">Enter OTP</h2>
            <p className="text-sm text-kisan-text-secondary text-center">
              Sent to <span className="font-semibold text-kisan-text dark:text-gray-200">+91 {mobile}</span>
            </p>
            <div className="flex gap-2.5">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(r) => { inputRefs.current[i] = r; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e.key)}
                  className={`w-12 h-14 rounded-xl border-2 text-center text-[22px] font-bold outline-none transition-colors bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 ${d ? "border-primary bg-primary/[0.04]" : error ? "border-kisan-red" : "border-kisan-border dark:border-gray-600"} focus:border-primary`}
                />
              ))}
            </div>
            {error && <p className="text-sm text-kisan-red text-center">{error}</p>}
            <button onClick={handleVerify} disabled={verifying} className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-4 font-bold text-[17px] shadow-lg shadow-primary/25 hover:bg-primary-light transition-colors disabled:opacity-70 active:scale-[0.98]">
              {verifying ? "Verifying..." : "Verify & Login"}
            </button>
            <p className="text-sm text-kisan-text-secondary">
              {timer > 0 ? <>Resend in <span className="text-primary font-medium">{timer}s</span></> : <button onClick={() => setTimer(30)} className="text-primary font-semibold">Resend OTP</button>}
            </p>
            <p className="text-[11px] text-kisan-text-light">Demo: any 6 digits work</p>
          </>
        )}
      </div>
    </div>
  );
}
