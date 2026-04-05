"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

const LANGUAGES = ["English", "Hindi", "Telugu", "Marathi", "Kannada", "Tamil", "Gujarati"];
const GENDERS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
] as const;

function PersonalInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mobile = searchParams.get("mobile") || "";
  const aadhaar = searchParams.get("aadhaar") || "";
  const role = searchParams.get("role") || "farmer";

  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    houseNo: "",
    street: "",
    village: "",
    post: "",
    mandal: "",
    district: "",
    state: "Telangana",
    country: "India",
    altMobile: "",
    dob: "",
    gender: "" as string,
    language: "English",
    updatesConsent: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.surname.trim()) e.surname = "Required";
    if (!form.village.trim()) e.village = "Required";
    if (!form.district.trim()) e.district = "Required";
    if (!form.state.trim()) e.state = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;
    const params = new URLSearchParams({
      mobile, aadhaar, role,
      firstName: form.firstName,
      surname: form.surname,
      village: form.village,
      district: form.district,
      state: form.state,
      gender: form.gender,
      language: form.language,
      consent: form.updatesConsent ? "1" : "0",
    });
    router.push(`/crop-selection?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-kisan-bg dark:bg-gray-900">
      <div className="bg-primary px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Personal Info</h1>
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="max-w-lg mx-auto px-5 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-2 bg-kisan-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: "40%" }} />
          </div>
          <span className="text-xs font-medium text-primary">40%</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">First Name *</label>
            <input value={form.firstName} onChange={(e) => update("firstName", e.target.value)}
              className={`w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none ${errors.firstName ? "border-kisan-red" : "border-kisan-border dark:border-gray-600"} focus:border-primary`}
              placeholder="First name" />
            {errors.firstName && <p className="text-xs text-kisan-red mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">Surname *</label>
            <input value={form.surname} onChange={(e) => update("surname", e.target.value)}
              className={`w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none ${errors.surname ? "border-kisan-red" : "border-kisan-border dark:border-gray-600"} focus:border-primary`}
              placeholder="Surname" />
            {errors.surname && <p className="text-xs text-kisan-red mt-1">{errors.surname}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">House No</label>
            <input value={form.houseNo} onChange={(e) => update("houseNo", e.target.value)}
              className="w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] border-kisan-border dark:border-gray-600 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none focus:border-primary"
              placeholder="House No" />
          </div>
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">Street</label>
            <input value={form.street} onChange={(e) => update("street", e.target.value)}
              className="w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] border-kisan-border dark:border-gray-600 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none focus:border-primary"
              placeholder="Street" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-kisan-text dark:text-gray-200">Village *</label>
          <input value={form.village} onChange={(e) => update("village", e.target.value)}
            className={`w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none ${errors.village ? "border-kisan-red" : "border-kisan-border dark:border-gray-600"} focus:border-primary`}
            placeholder="Village name" />
          {errors.village && <p className="text-xs text-kisan-red mt-1">{errors.village}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">Post</label>
            <input value={form.post} onChange={(e) => update("post", e.target.value)}
              className="w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] border-kisan-border dark:border-gray-600 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none focus:border-primary"
              placeholder="Post" />
          </div>
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">Mandal</label>
            <input value={form.mandal} onChange={(e) => update("mandal", e.target.value)}
              className="w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] border-kisan-border dark:border-gray-600 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none focus:border-primary"
              placeholder="Mandal" />
          </div>
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">District *</label>
            <input value={form.district} onChange={(e) => update("district", e.target.value)}
              className={`w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none ${errors.district ? "border-kisan-red" : "border-kisan-border dark:border-gray-600"} focus:border-primary`}
              placeholder="District" />
            {errors.district && <p className="text-xs text-kisan-red mt-1">{errors.district}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">State *</label>
            <input value={form.state} onChange={(e) => update("state", e.target.value)}
              className={`w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none ${errors.state ? "border-kisan-red" : "border-kisan-border dark:border-gray-600"} focus:border-primary`}
              placeholder="State" />
          </div>
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">Country</label>
            <input value={form.country} onChange={(e) => update("country", e.target.value)}
              className="w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] border-kisan-border dark:border-gray-600 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none focus:border-primary"
              placeholder="Country" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">Alt. Mobile</label>
            <input type="tel" maxLength={10} value={form.altMobile} onChange={(e) => update("altMobile", e.target.value.replace(/\D/g, ""))}
              className="w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] border-kisan-border dark:border-gray-600 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none focus:border-primary"
              placeholder="Alt. mobile" />
          </div>
          <div>
            <label className="text-sm font-medium text-kisan-text dark:text-gray-200">Date of Birth</label>
            <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)}
              className="w-full mt-1 px-3.5 py-3 rounded-xl border-[1.5px] border-kisan-border dark:border-gray-600 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-kisan-text dark:text-gray-200 block mb-2">Gender</label>
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <button key={g.id} onClick={() => update("gender", g.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${form.gender === g.id ? "border-primary bg-primary/[0.06] text-primary" : "border-kisan-border bg-white dark:bg-gray-800 dark:border-gray-600 text-kisan-text-secondary"}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-kisan-text dark:text-gray-200 block mb-2">Preferred Language</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button key={lang} onClick={() => update("language", lang)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium border-2 transition-all ${form.language === lang ? "border-primary bg-primary/[0.06] text-primary" : "border-kisan-border bg-white dark:bg-gray-800 dark:border-gray-600 text-kisan-text-secondary"}`}>
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border border-kisan-border dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-kisan-text dark:text-gray-100">SMS / WhatsApp Updates</p>
            <p className="text-xs text-kisan-text-light">Receive price alerts and advisories</p>
          </div>
          <button onClick={() => update("updatesConsent", !form.updatesConsent)}
            className={`w-12 h-7 rounded-full transition-colors ${form.updatesConsent ? "bg-primary" : "bg-kisan-border"}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${form.updatesConsent ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <button onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-4 font-bold text-[17px] shadow-lg shadow-primary/25 hover:bg-primary-light transition-colors active:scale-[0.98]">
          Continue <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default function PersonalInfoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-kisan-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <PersonalInfoContent />
    </Suspense>
  );
}
