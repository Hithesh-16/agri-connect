"use client";

import React, { useState } from "react";
import {
  Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Wifi,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAlerts, useCreateAlert, useToggleAlert, useDeleteAlert } from "@/hooks/useAlerts";
import type { PriceAlert } from "@/hooks/useAlerts";
import { CROPS } from "@/hooks/useCrops";
import { MANDIS } from "@/hooks/useMandis";
import { useAuthStore } from "@/store/authStore";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#22C55E", bg: "#22C55E18" },
  triggered: { label: "Triggered", color: "#F59E0B", bg: "#F59E0B18" },
  inactive: { label: "Inactive", color: "#9CA3AF", bg: "#9CA3AF18" },
};

export default function AlertsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: alerts, isLoading, error } = useAlerts();
  const createAlert = useCreateAlert();
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();

  const [showCreate, setShowCreate] = useState(false);
  const [formCropId, setFormCropId] = useState("");
  const [formMandiId, setFormMandiId] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDirection, setFormDirection] = useState<"above" | "below">("above");

  const userCropIds = user?.selectedCropIds || [];
  const userCrops = CROPS.filter((c) => userCropIds.includes(c.id));
  const cropOptions = userCrops.length > 0 ? userCrops : CROPS.slice(0, 8);

  const backendUnavailable = !!error;

  function handleCreate() {
    const crop = CROPS.find((c) => c.id === formCropId);
    if (!crop || !formPrice) return;

    const mandi = formMandiId ? MANDIS.find((m) => m.id === formMandiId) : undefined;

    createAlert.mutate(
      {
        cropId: crop.id,
        cropName: crop.name,
        mandiId: mandi?.id,
        mandiName: mandi?.name,
        targetPrice: Number(formPrice),
        direction: formDirection,
        unit: crop.unit,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setFormCropId("");
          setFormMandiId("");
          setFormPrice("");
          setFormDirection("above");
        },
      }
    );
  }

  function handleToggle(alert: PriceAlert) {
    const newStatus = alert.status === "active" ? "inactive" : "active";
    toggleAlert.mutate({ id: alert.id, status: newStatus });
  }

  function handleDelete(id: string) {
    deleteAlert.mutate(id);
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">Price Alerts</h1>
        <button
          onClick={() => setShowCreate(true)}
          disabled={backendUnavailable}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
            backendUnavailable
              ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
              : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          <Plus size={16} /> Create Alert
        </button>
      </div>

      {/* Backend unavailable notice */}
      {backendUnavailable && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 flex items-start gap-3 border border-amber-200 dark:border-amber-800">
          <Wifi size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Backend Unavailable
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
              Alerts require backend connection. Please ensure the server is running.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && !backendUnavailable && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Alert List */}
      {!isLoading && !backendUnavailable && alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = STATUS_CONFIG[alert.status] || STATUS_CONFIG.inactive;
            return (
              <div
                key={alert.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-kisan-border dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-kisan-text dark:text-gray-100">
                        {alert.cropName}
                      </p>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{ backgroundColor: config.bg, color: config.color }}
                      >
                        {config.label}
                      </span>
                    </div>
                    {alert.mandiName && (
                      <p className="text-xs text-kisan-text-secondary mb-1">{alert.mandiName}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-kisan-text-secondary">
                      {alert.direction === "above" ? (
                        <TrendingUp size={14} className="text-kisan-green" />
                      ) : (
                        <TrendingDown size={14} className="text-kisan-red" />
                      )}
                      <span>
                        Alert when price goes {alert.direction}{" "}
                        <span className="font-semibold text-kisan-text dark:text-gray-200">
                          {formatCurrency(alert.targetPrice)}/{alert.unit}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(alert)}
                      className={cn(
                        "relative w-10 h-6 rounded-full transition-colors",
                        alert.status === "active" ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                          alert.status === "active" ? "left-[18px]" : "left-0.5"
                        )}
                      />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-kisan-text-light hover:text-kisan-red"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !backendUnavailable && (!alerts || alerts.length === 0) && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <BellOff size={28} className="text-primary/50" />
          </div>
          <p className="text-kisan-text-secondary text-sm mb-1">No alerts yet</p>
          <p className="text-xs text-kisan-text-light">
            Create a price alert to get notified when prices hit your target
          </p>
        </div>
      )}

      {/* Empty state when backend down */}
      {!isLoading && backendUnavailable && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <AlertTriangle size={28} className="text-amber-500" />
          </div>
          <p className="text-kisan-text-secondary text-sm mb-1">Alerts require backend connection</p>
          <p className="text-xs text-kisan-text-light">
            Start the backend server and refresh to manage your price alerts
          </p>
        </div>
      )}

      {/* Create Alert Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Price Alert">
        <div className="space-y-4">
          {/* Crop */}
          <div>
            <label className="block text-xs font-medium text-kisan-text-secondary mb-1.5">
              Crop
            </label>
            <select
              value={formCropId}
              onChange={(e) => setFormCropId(e.target.value)}
              className="w-full bg-kisan-bg dark:bg-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-kisan-text dark:text-gray-100 border border-kisan-border dark:border-gray-600 outline-none focus:border-primary"
            >
              <option value="">Select a crop</option>
              {cropOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Mandi (optional) */}
          <div>
            <label className="block text-xs font-medium text-kisan-text-secondary mb-1.5">
              Mandi (optional)
            </label>
            <select
              value={formMandiId}
              onChange={(e) => setFormMandiId(e.target.value)}
              className="w-full bg-kisan-bg dark:bg-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-kisan-text dark:text-gray-100 border border-kisan-border dark:border-gray-600 outline-none focus:border-primary"
            >
              <option value="">Any mandi</option>
              {MANDIS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Target Price */}
          <div>
            <label className="block text-xs font-medium text-kisan-text-secondary mb-1.5">
              Target Price (per quintal)
            </label>
            <input
              type="number"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              placeholder="e.g. 2500"
              className="w-full bg-kisan-bg dark:bg-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-kisan-text dark:text-gray-100 border border-kisan-border dark:border-gray-600 outline-none focus:border-primary"
            />
          </div>

          {/* Direction */}
          <div>
            <label className="block text-xs font-medium text-kisan-text-secondary mb-1.5">
              Alert when price goes
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormDirection("above")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all",
                  formDirection === "above"
                    ? "bg-kisan-green/10 text-kisan-green border-kisan-green/30"
                    : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-600"
                )}
              >
                <TrendingUp size={16} /> Above
              </button>
              <button
                onClick={() => setFormDirection("below")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all",
                  formDirection === "below"
                    ? "bg-kisan-red/10 text-kisan-red border-kisan-red/30"
                    : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-600"
                )}
              >
                <TrendingDown size={16} /> Below
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 py-3 rounded-xl border-2 border-kisan-border dark:border-gray-600 text-kisan-text-secondary font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formCropId || !formPrice || createAlert.isPending}
              className={cn(
                "flex-1 py-3 rounded-xl font-semibold text-sm transition-all",
                formCropId && formPrice
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
              )}
            >
              {createAlert.isPending ? "Creating..." : "Create Alert"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
