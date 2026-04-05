"use client";

import React, { useState, useCallback } from "react";
import { Newspaper, Plus, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
}

const INITIAL_ARTICLES: NewsArticle[] = [
  { id: "a1", title: "Government raises MSP for Kharif crops by 5-7%", summary: "Cabinet approves minimum support price hike for 14 Kharif crops, benefiting over 11 crore farmers across India.", category: "policy", date: "2026-03-11" },
  { id: "a2", title: "Cotton prices surge as exports to China rise", summary: "Indian cotton exports see a 23% jump this quarter driven by high demand from Chinese textile mills.", category: "market", date: "2026-03-10" },
  { id: "a3", title: "Pre-monsoon showers expected in Telangana by March 20", summary: "IMD forecasts early pre-monsoon activity over Telangana and Andhra Pradesh. Farmers advised to complete rabi harvesting.", category: "weather", date: "2026-03-09" },
  { id: "a4", title: "eNAM integration now live in 1,361 mandis nationwide", summary: "National Agriculture Market now connects buyers and sellers across India with transparent pricing.", category: "policy", date: "2026-03-08" },
  { id: "a5", title: "Chili prices hit 3-year high on short supply", summary: "Poor rainfall in key chili growing regions has tightened supply. Prices in Guntur and Warangal mandis are up 28%.", category: "market", date: "2026-03-07" },
  { id: "a6", title: "Use drip irrigation to save 50% water — advisory", summary: "Agriculture department urges farmers to adopt drip and sprinkler irrigation to conserve water.", category: "advisory", date: "2026-03-06" },
];

const CATEGORIES = ["market", "policy", "weather", "advisory"];

const CATEGORY_COLORS: Record<string, string> = {
  market: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  policy: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  weather: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  advisory: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>(INITIAL_ARTICLES);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  const handleDelete = useCallback((id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleEdit = useCallback((article: NewsArticle) => {
    setEditingArticle(article);
    setShowModal(true);
  }, []);

  const handleSave = useCallback((article: NewsArticle) => {
    setArticles((prev) => {
      const exists = prev.find((a) => a.id === article.id);
      if (exists) {
        return prev.map((a) => (a.id === article.id ? article : a));
      }
      return [article, ...prev];
    });
    setShowModal(false);
    setEditingArticle(null);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingArticle(null);
    setShowModal(true);
  }, []);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">News Management</h1>
            <p className="text-xs text-kisan-text-secondary">{articles.length} articles</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Article
        </button>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {articles.map((article) => (
          <div
            key={article.id}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", CATEGORY_COLORS[article.category] || "bg-gray-100 text-gray-600")}>
                    {article.category}
                  </span>
                  <span className="text-[11px] text-kisan-text-light">{article.date}</span>
                </div>
                <h3 className="font-semibold text-sm text-kisan-text dark:text-gray-100 leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-kisan-text-secondary mt-1 line-clamp-2">{article.summary}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(article)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-kisan-text-secondary" />
                </button>
                <button
                  onClick={() => handleDelete(article.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {articles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-kisan-text-secondary text-sm">No articles. Add one to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ArticleModal
          article={editingArticle}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingArticle(null); }}
        />
      )}
    </div>
  );
}

function ArticleModal({
  article,
  onSave,
  onClose,
}: {
  article: NewsArticle | null;
  onSave: (article: NewsArticle) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(article?.title || "");
  const [summary, setSummary] = useState(article?.summary || "");
  const [category, setCategory] = useState(article?.category || "market");
  const [date, setDate] = useState(article?.date || new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    onSave({
      id: article?.id || `a_${Date.now()}`,
      title: title.trim(),
      summary: summary.trim(),
      category,
      date,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-kisan-border dark:border-gray-700">
          <h2 className="text-lg font-bold text-kisan-text dark:text-gray-100">
            {article ? "Edit Article" : "Add Article"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-kisan-text-secondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Article title"
              className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              rows={4}
              placeholder="Brief summary of the article"
              className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            {article ? "Save Changes" : "Add Article"}
          </button>
        </form>
      </div>
    </div>
  );
}
