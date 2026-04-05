"use client";

import React, { useState, useRef } from "react";
import { Upload, Camera, RotateCcw, AlertTriangle, Leaf, FlaskConical, Shield, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiseaseResult } from "@/types";

const MOCK_RESULTS: DiseaseResult[] = [
  {
    cropName: "Cotton",
    diseaseName: "Cotton Leaf Curl Disease",
    confidence: 91,
    severity: "Moderate",
    affectedArea: "35%",
    weatherNote: "High humidity (72%) is favorable for whitefly proliferation. Monitor closely.",
    treatments: [
      { type: "organic", action: "Apply neem oil spray (5ml/L) every 7 days. Use yellow sticky traps to monitor whitefly population." },
      { type: "chemical", action: "Spray imidacloprid 17.8% SL at 0.5ml/L or acetamiprid 20% SP at 0.2g/L. Rotate chemicals to prevent resistance." },
      { type: "preventive", action: "Use Bt cotton varieties (Bollgard-II). Remove and destroy infected plants immediately. Maintain field sanitation." },
    ],
    nearbyAdvisory: "Warangal APMC reports 15% increase in disease incidence this week. Early treatment recommended.",
  },
  {
    cropName: "Tomato",
    diseaseName: "Tomato Early Blight",
    confidence: 87,
    severity: "Mild",
    affectedArea: "15%",
    weatherNote: "Warm temperatures (28°C) with morning dew create favorable conditions for Alternaria solani.",
    treatments: [
      { type: "organic", action: "Apply Trichoderma viride (4g/L) as foliar spray. Use mulching to prevent soil splash." },
      { type: "chemical", action: "Spray mancozeb 75% WP (2.5g/L) or chlorothalonil (2g/L). Apply at 10-day intervals." },
      { type: "preventive", action: "Ensure proper spacing (60x45cm). Remove lower infected leaves. Avoid overhead irrigation." },
    ],
    nearbyAdvisory: "District agricultural officer advises all tomato growers to inspect crops and begin preventive spraying.",
  },
];

const ANALYSIS_STEPS = [
  "Detecting crop type...",
  "Identifying disease patterns...",
  "Checking weather conditions...",
  "Generating recommendations...",
];

const SEVERITY_COLORS = { Mild: "#22C55E", Moderate: "#F59E0B", Severe: "#EF4444" };
const TREATMENT_CONFIG = {
  organic: { label: "Organic", Icon: Leaf, color: "#22C55E", bg: "#22C55E15" },
  chemical: { label: "Chemical", Icon: FlaskConical, color: "#3B82F6", bg: "#3B82F615" },
  preventive: { label: "Preventive", Icon: Shield, color: "#8B5CF6", bg: "#8B5CF615" },
};

export default function ScannerPage() {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      startAnalysis();
    };
    reader.readAsDataURL(file);
  }

  function startAnalysis() {
    setScanning(true);
    setResult(null);
    setScanStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setScanStep(step);
      if (step >= ANALYSIS_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          setScanning(false);
          setResult(MOCK_RESULTS[Math.random() > 0.5 ? 0 : 1]);
        }, 500);
      }
    }, 750);
  }

  function reset() {
    setImage(null);
    setResult(null);
    setScanning(false);
    setScanStep(0);
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">Disease Scanner</h1>

      {!image ? (
        /* Upload Area */
        <div className="border-2 border-dashed border-kisan-border dark:border-gray-600 rounded-2xl p-10 text-center bg-white dark:bg-gray-800 hover:border-primary/40 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>
          <Upload size={48} className="text-kisan-text-light mx-auto mb-4" />
          <p className="text-lg font-semibold text-kisan-text dark:text-gray-100 mb-1">Upload crop image</p>
          <p className="text-sm text-kisan-text-secondary mb-5">Drag & drop or click to browse</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => fileRef.current?.click()}
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-light transition-colors shadow-md shadow-primary/25">
              <Upload size={16} className="inline mr-2" />Upload Image
            </button>
            <label className="px-6 py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent-light transition-colors shadow-md shadow-accent/25 cursor-pointer">
              <Camera size={16} className="inline mr-2" />Take Photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      ) : (
        /* Image Preview & Results */
        <div className="space-y-5">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <img src={image} alt="Crop" className="w-full max-h-80 object-contain" />
            {scanning && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                <div className="w-full h-1 bg-primary/30 absolute top-0">
                  <div className="h-full bg-primary animate-scan-line rounded-full" style={{ width: "60%" }} />
                </div>
                <div className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-4 max-w-xs w-full mx-4">
                  <p className="text-sm font-semibold text-kisan-text dark:text-gray-100 mb-3">Analyzing...</p>
                  {ANALYSIS_STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        i < scanStep ? "border-primary bg-primary" : i === scanStep ? "border-primary animate-pulse" : "border-kisan-border")}>
                        {i < scanStep && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className={cn("text-xs", i <= scanStep ? "text-kisan-text dark:text-gray-200" : "text-kisan-text-light")}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Disease Info */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-kisan-border dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-kisan-text-secondary">Detected on</p>
                    <p className="font-bold text-lg text-kisan-text dark:text-gray-100">{result.cropName}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: SEVERITY_COLORS[result.severity] }}>
                    {result.severity}
                  </span>
                </div>
                <p className="font-semibold text-primary text-lg mb-3">{result.diseaseName}</p>

                {/* Confidence Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-kisan-text-secondary">Confidence</span>
                    <span className="font-semibold text-primary">{result.confidence}%</span>
                  </div>
                  <div className="h-2 bg-kisan-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${result.confidence}%` }} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-kisan-bg dark:bg-gray-900 rounded-xl p-3">
                    <p className="text-xs text-kisan-text-secondary">Affected Area</p>
                    <p className="font-bold text-kisan-text dark:text-gray-100">{result.affectedArea}</p>
                  </div>
                  <div className="bg-kisan-bg dark:bg-gray-900 rounded-xl p-3">
                    <div className="flex items-center gap-1.5">
                      <CloudSun size={14} className="text-kisan-text-light" />
                      <p className="text-xs text-kisan-text-secondary">Weather Note</p>
                    </div>
                    <p className="text-xs text-kisan-text dark:text-gray-200 mt-1">{result.weatherNote}</p>
                  </div>
                </div>
              </div>

              {/* Treatments */}
              <div className="space-y-3">
                <p className="font-semibold text-kisan-text dark:text-gray-100">Treatment Recommendations</p>
                {result.treatments.map((t) => {
                  const config = TREATMENT_CONFIG[t.type];
                  return (
                    <div key={t.type} className="rounded-2xl p-4 border border-kisan-border dark:border-gray-700" style={{ backgroundColor: config.bg }}>
                      <div className="flex items-center gap-2 mb-2">
                        <config.Icon size={18} style={{ color: config.color }} />
                        <span className="font-semibold text-sm" style={{ color: config.color }}>{config.label}</span>
                      </div>
                      <p className="text-sm text-kisan-text dark:text-gray-200 leading-relaxed">{t.action}</p>
                    </div>
                  );
                })}
              </div>

              {/* Advisory */}
              <div className="bg-accent/10 rounded-2xl p-4 border border-accent/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle size={16} className="text-accent" />
                  <span className="text-sm font-semibold text-accent">Nearby Advisory</span>
                </div>
                <p className="text-sm text-kisan-text dark:text-gray-200">{result.nearbyAdvisory}</p>
              </div>
            </div>
          )}

          {/* Reset Button */}
          {!scanning && (
            <button onClick={reset}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-primary rounded-2xl py-4 font-semibold border-2 border-primary hover:bg-primary/5 transition-colors">
              <RotateCcw size={18} /> Scan Another
            </button>
          )}
        </div>
      )}
    </div>
  );
}
