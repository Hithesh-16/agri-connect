"use client";

import React from "react";
import { Phone, MapPin, Globe, ShieldCheck } from "lucide-react";
import type { User } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  farmer: "Farmer",
  trader: "Trader",
  dealer: "Dealer",
  corporate: "Corporate",
};

const roleColors: Record<string, string> = {
  farmer: "#22C55E",
  trader: "#3B82F6",
  dealer: "#F5A623",
  corporate: "#8B5CF6",
};

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const roleColor = roleColors[user.role] || "#22C55E";

  return (
    <div className="bg-gradient-to-br from-[#0D4A22] to-[#1B6B3A] rounded-2xl p-5 text-white space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="w-[72px] h-[72px] rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 flex-shrink-0">
          <span className="text-2xl font-bold">
            {(user.firstName?.[0] || "F").toUpperCase()}
            {(user.surname?.[0] || "").toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold truncate">
            {user.firstName} {user.surname}
          </p>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mt-1"
            style={{ backgroundColor: roleColor + "30" }}
          >
            <ShieldCheck size={13} style={{ color: roleColor }} />
            <span
              className="text-xs font-semibold"
              style={{ color: roleColor }}
            >
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {user.mobile && (
          <div className="flex items-center gap-2.5">
            <Phone size={14} className="text-white/60" />
            <span className="text-[13px] text-white/75">+91 {user.mobile}</span>
          </div>
        )}
        {user.village && (
          <div className="flex items-center gap-2.5">
            <MapPin size={14} className="text-white/60" />
            <span className="text-[13px] text-white/75">
              {user.village}, {user.district}
            </span>
          </div>
        )}
        {user.language && (
          <div className="flex items-center gap-2.5">
            <Globe size={14} className="text-white/60" />
            <span className="text-[13px] text-white/75">{user.language}</span>
          </div>
        )}
      </div>

      <div className="flex bg-white/10 rounded-2xl py-3.5">
        <div className="flex-1 text-center">
          <p className="text-[22px] font-bold">{user.selectedCropIds.length}</p>
          <p className="text-xs text-white/65">Crops</p>
        </div>
        <div className="w-px bg-white/20" />
        <div className="flex-1 text-center">
          <p className="text-[22px] font-bold">
            {user.selectedMandiIds.length}
          </p>
          <p className="text-xs text-white/65">Mandis</p>
        </div>
        <div className="w-px bg-white/20" />
        <div className="flex-1 text-center">
          <p className="text-[22px] font-bold">5</p>
          <p className="text-xs text-white/65">Alerts</p>
        </div>
      </div>
    </div>
  );
}
