"use client";

import React from "react";
import Link from "next/link";
import { Users, ShoppingBag, TrendingUp, Newspaper, Plus, RefreshCw, Eye } from "lucide-react";

const STATS = [
  { label: "Total Users", value: "1,247", change: "+12%", icon: Users, color: "#3B82F6", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { label: "Active Listings", value: "89", change: "+5", icon: ShoppingBag, color: "#F97316", bg: "bg-orange-50 dark:bg-orange-900/20" },
  { label: "Price Updates Today", value: "12", change: "Live", icon: TrendingUp, color: "#22C55E", bg: "bg-green-50 dark:bg-green-900/20" },
  { label: "News Articles", value: "6", change: "2 new", icon: Newspaper, color: "#8B5CF6", bg: "bg-purple-50 dark:bg-purple-900/20" },
];

const RECENT_ACTIVITY = [
  { id: 1, text: "Ramesh K. created a selling listing for Cotton (50 qtl)", time: "5 min ago", type: "listing" },
  { id: 2, text: "Price update received for Warangal APMC - 8 crops", time: "12 min ago", type: "price" },
  { id: 3, text: "New user registered: Lakshmi D. (Farmer, Khammam)", time: "25 min ago", type: "user" },
  { id: 4, text: "Suresh Traders posted a buying request for Wheat", time: "1 hr ago", type: "listing" },
  { id: 5, text: "News article published: Cotton prices surge", time: "2 hr ago", type: "news" },
  { id: 6, text: "New user registered: Venkat R. (Trader, Nalgonda)", time: "3 hr ago", type: "user" },
  { id: 7, text: "Price alert triggered for Chili > Rs. 10,000", time: "4 hr ago", type: "price" },
  { id: 8, text: "Soil Health Card scheme added to schemes list", time: "5 hr ago", type: "news" },
];

const TYPE_COLORS: Record<string, string> = {
  listing: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  price: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  user: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  news: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
};

const QUICK_ACTIONS = [
  { label: "Add News", href: "/admin/news", icon: Plus, color: "bg-purple-500" },
  { label: "Update Prices", href: "/prices", icon: RefreshCw, color: "bg-green-500" },
  { label: "View Users", href: "/admin/users", icon: Eye, color: "bg-blue-500" },
];

export default function AdminDashboard() {
  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-xs text-kisan-text-secondary">Overview of KisanConnect platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-kisan-text dark:text-gray-100">{stat.value}</p>
            <p className="text-xs text-kisan-text-secondary mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-kisan-text dark:text-gray-100 mb-3">Quick Actions</h2>
        <div className="flex gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-kisan-border dark:border-gray-700 rounded-xl hover:shadow-md transition-all"
            >
              <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-kisan-text dark:text-gray-200">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="font-semibold text-kisan-text dark:text-gray-100 mb-3">Recent Activity</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 divide-y divide-kisan-border dark:divide-gray-700">
          {RECENT_ACTIVITY.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-4">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap ${TYPE_COLORS[activity.type]}`}>
                {activity.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-kisan-text dark:text-gray-200 leading-snug">{activity.text}</p>
                <p className="text-[11px] text-kisan-text-light mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
