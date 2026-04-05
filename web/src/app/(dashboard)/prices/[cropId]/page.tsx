"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceLine,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { usePrediction } from "@/hooks/usePredictions";
import { ALL_FULL_PRICES } from "@/hooks/usePrices";
import { ShareButton } from "@/components/ui/ShareButton";
import { useI18n } from "@/lib/i18n";

const PERIODS = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
];

const PREDICTION_PERIODS = [
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
];

const TIER_CONFIG = [
  { key: "farmGate" as const, label: "Farm Gate", color: "#22C55E" },
  { key: "dealer" as const, label: "Dealer", color: "#3B82F6" },
  { key: "mandi" as const, label: "Mandi", color: "#F59E0B" },
  { key: "retail" as const, label: "Retail", color: "#EF4444" },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || !label) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-kisan-border dark:border-gray-700 p-3 text-xs">
      <p className="font-semibold text-kisan-text dark:text-gray-100 mb-1.5">
        {formatDate(label)}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PredictionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || !label) return null;
  const filtered = payload.filter(
    (e) => e.dataKey !== "upperBound" && e.dataKey !== "lowerBound"
  );
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-kisan-border dark:border-gray-700 p-3 text-xs">
      <p className="font-semibold text-kisan-text dark:text-gray-100 mb-1.5">
        {formatDate(label)}
      </p>
      {filtered.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function CropDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const cropId = params.cropId as string;
  const [period, setPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<"history" | "prediction">("history");
  const [predictionDays, setPredictionDays] = useState(14);

  const entry = ALL_FULL_PRICES.find((p) => p.cropId === cropId);
  const { data: history, isLoading } = usePriceHistory(cropId, period);
  const { data: prediction, isLoading: predLoading } = usePrediction(cropId, predictionDays);

  // Build combined chart data for prediction view
  const predictionChartData = useMemo(() => {
    if (!history || !prediction) return [];

    // Last 7 days of history
    const recentHistory = history.slice(-7);
    const todayStr = new Date().toISOString().split("T")[0];

    const historyPoints = recentHistory.map((h) => ({
      date: h.date,
      historical: h.mandi,
      predicted: null as number | null,
      upperBound: null as number | null,
      lowerBound: null as number | null,
    }));

    // Add a bridge point (today) connecting history to prediction
    const lastHistPrice = recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].mandi : prediction.currentPrice;

    const bridgePoint = {
      date: todayStr,
      historical: lastHistPrice,
      predicted: lastHistPrice,
      upperBound: lastHistPrice,
      lowerBound: lastHistPrice,
    };

    const predictionPoints = prediction.predictions.map((p) => ({
      date: p.date,
      historical: null as number | null,
      predicted: p.predicted,
      upperBound: p.upperBound,
      lowerBound: p.lowerBound,
    }));

    return [...historyPoints, bridgePoint, ...predictionPoints];
  }, [history, prediction]);

  const todayStr = new Date().toISOString().split("T")[0];

  if (!entry) {
    return (
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <button onClick={() => router.push("/prices")} className="flex items-center gap-2 text-sm text-primary font-medium mb-4">
          <ArrowLeft size={18} /> Back to Prices
        </button>
        <p className="text-kisan-text-secondary text-center py-12">Crop not found</p>
      </div>
    );
  }

  const isUp = entry.change >= 0;

  // Compute stats from history
  const stats = history && history.length > 0
    ? {
        highFarmGate: Math.max(...history.map((h) => h.farmGate)),
        lowFarmGate: Math.min(...history.map((h) => h.farmGate)),
        highDealer: Math.max(...history.map((h) => h.dealer)),
        lowDealer: Math.min(...history.map((h) => h.dealer)),
        highMandi: Math.max(...history.map((h) => h.mandi)),
        lowMandi: Math.min(...history.map((h) => h.mandi)),
        highRetail: Math.max(...history.map((h) => h.retail)),
        lowRetail: Math.min(...history.map((h) => h.retail)),
      }
    : null;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/prices")}
          className="p-2 rounded-xl hover:bg-kisan-bg dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-kisan-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">
            {entry.cropName}
          </h1>
          <p className="text-xs text-kisan-text-secondary">{entry.mandiName} &middot; per {entry.unit}</p>
        </div>
        <div className="text-right mr-1">
          <p className="text-lg font-bold text-primary">{formatCurrency(entry.mandiPrice)}</p>
          <div className="inline-flex items-center gap-1">
            {isUp ? <TrendingUp size={14} className="text-kisan-green" /> : <TrendingDown size={14} className="text-kisan-red" />}
            <span className={cn("text-xs font-semibold", isUp ? "text-kisan-green" : "text-kisan-red")}>
              {isUp ? "+" : ""}{entry.changePercent.toFixed(1)}%
            </span>
          </div>
        </div>
        <ShareButton
          cropName={entry.cropName}
          mandiName={entry.mandiName}
          price={entry.mandiPrice}
          change={entry.change}
          changePercent={entry.changePercent}
          unit={entry.unit}
        />
      </div>

      {/* Tab Selector */}
      <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-kisan-border dark:border-gray-700 max-w-sm">
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "history"
              ? "bg-primary text-white shadow-sm"
              : "text-kisan-text-secondary hover:text-kisan-text"
          )}
        >
          {t("prices.history")}
        </button>
        <button
          onClick={() => setActiveTab("prediction")}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "prediction"
              ? "bg-primary text-white shadow-sm"
              : "text-kisan-text-secondary hover:text-kisan-text"
          )}
        >
          {t("prediction.title")}
        </button>
      </div>

      {activeTab === "history" && (
        <>
          {/* Period Selector */}
          <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-kisan-border dark:border-gray-700 max-w-xs">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  period === p.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-kisan-text-secondary hover:text-kisan-text"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 p-4 lg:p-6">
            <p className="text-sm font-semibold text-kisan-text dark:text-gray-100 mb-4">
              Price History ({period} days)
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={history} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    interval={period <= 7 ? 0 : period <= 30 ? 4 : 13}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `\u20B9${v}`}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    width={65}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  />
                  {TIER_CONFIG.map((tier) => (
                    <Line
                      key={tier.key}
                      type="monotone"
                      dataKey={tier.key}
                      name={tier.label}
                      stroke={tier.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Price Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {TIER_CONFIG.map((tier) => {
              const currentPrice =
                tier.key === "farmGate" ? entry.farmGatePrice :
                tier.key === "dealer" ? entry.dealerPrice :
                tier.key === "mandi" ? entry.mandiPrice :
                entry.retailPrice;
              const highKey = `high${tier.key.charAt(0).toUpperCase() + tier.key.slice(1)}` as keyof NonNullable<typeof stats>;
              const lowKey = `low${tier.key.charAt(0).toUpperCase() + tier.key.slice(1)}` as keyof NonNullable<typeof stats>;

              return (
                <div
                  key={tier.key}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                    <span className="text-xs font-medium text-kisan-text-secondary">{tier.label}</span>
                  </div>
                  <p className="text-lg font-bold text-kisan-text dark:text-gray-100">
                    {formatCurrency(currentPrice)}
                  </p>
                  {stats && (
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-kisan-text-light">
                      <span>H: {formatCurrency(stats[highKey] as number)}</span>
                      <span>L: {formatCurrency(stats[lowKey] as number)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "prediction" && (
        <>
          {/* Prediction Period Selector */}
          <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 border border-kisan-border dark:border-gray-700 max-w-xs">
            {PREDICTION_PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPredictionDays(p.value)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  predictionDays === p.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-kisan-text-secondary hover:text-kisan-text"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Trend Indicator */}
          {prediction && (
            <div className="flex items-center gap-4 flex-wrap">
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold",
                  prediction.trend === "rising"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : prediction.trend === "falling"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                )}
              >
                {prediction.trend === "rising" ? (
                  <TrendingUp size={16} />
                ) : prediction.trend === "falling" ? (
                  <TrendingDown size={16} />
                ) : (
                  <Minus size={16} />
                )}
                {t(`prediction.${prediction.trend}`)}{" "}
                {prediction.trend !== "stable" && (
                  <span>
                    {prediction.trendPercent > 0 ? "+" : ""}
                    {prediction.trendPercent}%
                  </span>
                )}
              </div>
              <span className="text-xs text-kisan-text-secondary">
                {t("prediction.confidence")}: {prediction.predictions[0]?.confidence ?? 0}% for next {predictionDays} days
              </span>
            </div>
          )}

          {/* Prediction Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 p-4 lg:p-6">
            <p className="text-sm font-semibold text-kisan-text dark:text-gray-100 mb-4">
              {t("prediction.title")} ({predictionDays} days)
            </p>
            {predLoading || isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart
                  data={predictionChartData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    interval={predictionChartData.length <= 14 ? 1 : 3}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `\u20B9${v}`}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    width={65}
                  />
                  <Tooltip content={<PredictionTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  />
                  {/* Confidence band */}
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="#22C55E"
                    fillOpacity={0.1}
                    name="Upper Bound"
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="none"
                    fill="#FFFFFF"
                    fillOpacity={1}
                    name="Lower Bound"
                    connectNulls={false}
                  />
                  {/* Today reference line */}
                  <ReferenceLine
                    x={todayStr}
                    stroke="#9CA3AF"
                    strokeDasharray="5 5"
                    label={{ value: "Today", position: "top", fontSize: 11, fill: "#9CA3AF" }}
                  />
                  {/* Historical line */}
                  <Line
                    type="monotone"
                    dataKey="historical"
                    name="Historical"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                  />
                  {/* Predicted line */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    name="Predicted"
                    stroke="#22C55E"
                    strokeWidth={2.5}
                    strokeDasharray="8 4"
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              {t("prediction.disclaimer")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
