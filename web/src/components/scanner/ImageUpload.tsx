"use client";

import React, { useCallback } from "react";
import { Camera, Upload, Leaf } from "lucide-react";

interface ImageUploadProps {
  onImageSelected: (url: string) => void;
}

export function ImageUpload({ onImageSelected }: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        onImageSelected(url);
      }
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        onImageSelected(url);
      }
    },
    [onImageSelected]
  );

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="h-60 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="absolute inset-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-primary rounded-tl" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-primary rounded-tr" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-primary rounded-bl" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-primary rounded-br" />
        </div>
        <Leaf size={64} className="text-primary/30" />
        <p className="text-sm text-kisan-text-secondary">
          Point camera at affected plant
        </p>
        <p className="text-xs text-kisan-text-light">
          or drag and drop an image here
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex flex-col items-center gap-2 py-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Camera size={26} className="text-white" />
          </div>
          <span className="text-[13px] font-medium text-kisan-text dark:text-gray-200">
            Take Photo
          </span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex flex-col items-center gap-2 py-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload size={26} className="text-primary" />
          </div>
          <span className="text-[13px] font-medium text-kisan-text dark:text-gray-200">
            Upload Image
          </span>
        </button>
      </div>

      <div className="flex items-start gap-2.5 bg-kisan-blue/10 rounded-xl p-3">
        <span className="text-kisan-blue text-lg">i</span>
        <p className="text-xs text-kisan-text-secondary leading-[17px]">
          For best results, take a close-up photo of the affected leaves in good
          lighting.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
