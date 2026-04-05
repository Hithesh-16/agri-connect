"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200",
          "dark:bg-gray-800",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-kisan-text dark:text-gray-100">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-kisan-bg transition-colors"
            >
              <X className="w-5 h-5 text-kisan-text-secondary" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
