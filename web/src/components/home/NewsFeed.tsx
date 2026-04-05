"use client";

import React from "react";
import type { NewsItem } from "@/types";

const categoryColors: Record<string, string> = {
  market: "#F5A623",
  policy: "#3B82F6",
  weather: "#60A5FA",
  advisory: "#22C55E",
};

interface NewsFeedProps {
  news: NewsItem[];
}

export function NewsFeed({ news }: NewsFeedProps) {
  return (
    <div>
      <h2 className="font-semibold text-kisan-text dark:text-gray-100 mb-3">
        Agricultural News
      </h2>
      <div className="space-y-3">
        {news.slice(0, 4).map((n) => {
          const color = categoryColors[n.category] || "#F5A623";
          return (
            <div
              key={n.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700 space-y-2 hover:border-primary/20 transition-colors cursor-pointer"
            >
              <span
                className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                style={{ backgroundColor: color + "20", color }}
              >
                {n.category.charAt(0).toUpperCase() + n.category.slice(1)}
              </span>
              <h3 className="font-semibold text-sm text-kisan-text dark:text-gray-100 leading-5 line-clamp-2">
                {n.title}
              </h3>
              <p className="text-xs text-kisan-text-secondary leading-[18px] line-clamp-2">
                {n.summary}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-kisan-text-light">
                  {n.date}
                </span>
                <span className="text-[11px] text-kisan-text-light">
                  {n.readTime} min read
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
