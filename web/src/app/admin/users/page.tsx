"use client";

import React, { useState, useMemo } from "react";
import { Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface MockUser {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  district: string;
  joinedDate: string;
}

const MOCK_USERS: MockUser[] = [
  { id: "u1", name: "Ramesh Kumar", mobile: "9876543210", role: "farmer", district: "Warangal", joinedDate: "2025-11-15" },
  { id: "u2", name: "Lakshmi Devi", mobile: "9876543211", role: "farmer", district: "Khammam", joinedDate: "2025-12-01" },
  { id: "u3", name: "Suresh Reddy", mobile: "9876543212", role: "trader", district: "Nizamabad", joinedDate: "2025-12-10" },
  { id: "u4", name: "Venkat Rao", mobile: "9876543213", role: "farmer", district: "Nalgonda", joinedDate: "2026-01-05" },
  { id: "u5", name: "Priya Sharma", mobile: "9876543214", role: "dealer", district: "Hyderabad", joinedDate: "2026-01-12" },
  { id: "u6", name: "Rajesh Patel", mobile: "9876543215", role: "trader", district: "Karimnagar", joinedDate: "2026-01-20" },
  { id: "u7", name: "Anitha Reddy", mobile: "9876543216", role: "farmer", district: "Medak", joinedDate: "2026-02-03" },
  { id: "u8", name: "Mahesh Goud", mobile: "9876543217", role: "farmer", district: "Adilabad", joinedDate: "2026-02-15" },
  { id: "u9", name: "Deccan Corp Ltd.", mobile: "9876543218", role: "corporate", district: "Hyderabad", joinedDate: "2026-02-20" },
  { id: "u10", name: "Srinivas Yadav", mobile: "9876543219", role: "farmer", district: "Suryapet", joinedDate: "2026-03-01" },
];

const ROLE_FILTERS: { id: "all" | UserRole; label: string }[] = [
  { id: "all", label: "All" },
  { id: "farmer", label: "Farmer" },
  { id: "trader", label: "Trader" },
  { id: "dealer", label: "Dealer" },
  { id: "corporate", label: "Corporate" },
];

const ROLE_COLORS: Record<UserRole, string> = {
  farmer: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  trader: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  dealer: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  corporate: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    let result = MOCK_USERS;
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.mobile.includes(q)
      );
    }
    return result;
  }, [roleFilter, search]);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">User Management</h1>
          <p className="text-xs text-kisan-text-secondary">{MOCK_USERS.length} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kisan-text-light" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Role Filter */}
      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setRoleFilter(filter.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all border",
              roleFilter === filter.id
                ? "bg-primary text-white border-primary"
                : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-700 hover:border-primary/40"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-kisan-border dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-kisan-text-secondary uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-kisan-text-secondary uppercase tracking-wider">Mobile</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-kisan-text-secondary uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-kisan-text-secondary uppercase tracking-wider">District</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-kisan-text-secondary uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kisan-border dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-kisan-text dark:text-gray-100">{user.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-kisan-text-secondary font-mono">{user.mobile}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-bold uppercase px-2.5 py-1 rounded-full", ROLE_COLORS[user.role])}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-kisan-text-secondary">{user.district}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-kisan-text-secondary">{user.joinedDate}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-kisan-border dark:divide-gray-700">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-kisan-text dark:text-gray-100">{user.name}</p>
                <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", ROLE_COLORS[user.role])}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-kisan-text-secondary font-mono">{user.mobile}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-kisan-text-light">{user.district}</span>
                <span className="text-xs text-kisan-text-light">Joined {user.joinedDate}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-kisan-text-secondary">No users found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
