"use client";

import Cropper, { type Area } from "react-easy-crop";
import { useCallback, useRef, useState } from "react";
import { Check, Maximize, X, ZoomIn, ZoomOut } from "lucide-react";
import { getCroppedFile, type CropArea } from "@/lib/crop";

type Props = {
  src: string;
  fileName: string;
  mime: string;
  aspect?: number;
  onDone: (file: File) => void;
  onCancel: () => void;
};

export function ImageCropper({ src, fileName, mime, aspect, onDone, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropArea | null>(null);
  const [fullArea, setFullArea] = useState<CropArea | null>(null);
  const [fullImage, setFullImage] = useState(false);
  const fullRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    // react-easy-crop recalculates after we set zoom/position for "full image".
    // Ignore that recalculation so it can't overwrite the full-image area.
    if (fullRef.current) return;
    setArea(pixels);
  }, []);

  function handleCropChange(next: { x: number; y: number }) {
    if (fullRef.current) {
      fullRef.current = false;
      setFullImage(false);
    }
    setCrop(next);
  }

  function handleZoomChange(next: number) {
    if (fullRef.current) {
      fullRef.current = false;
      setFullImage(false);
    }
    setZoom(next);
  }

  async function selectFullImage() {
    const image = new Image();
    image.src = src;
    try {
      await image.decode();
    } catch {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not read image"));
      });
    }
    const complete: CropArea = {
      x: 0,
      y: 0,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
    setFullArea(complete);
    setArea(complete);
    fullRef.current = true;
    setFullImage(true);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }

  async function apply() {
    const finalArea = fullRef.current && fullArea ? fullArea : area;
    if (!finalArea) return;
    setBusy(true);
    try {
      const file = await getCroppedFile(src, finalArea, fileName, mime);
      onDone(file);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="fade-in w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Choose the visible area</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Drag to move, scroll or use the slider to zoom.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel crop"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative mt-4 h-64 w-full overflow-hidden rounded-xl bg-slate-900 sm:h-80">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={handleCropChange}
            onZoomChange={handleZoomChange}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomOut size={16} className="shrink-0 text-slate-400" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => handleZoomChange(Number(event.target.value))}
            aria-label="Zoom"
            className="h-1.5 w-full cursor-pointer accent-indigo-600"
          />
          <ZoomIn size={16} className="shrink-0 text-slate-400" />
        </div>

        <button
          type="button"
          onClick={selectFullImage}
          className={`btn-soft mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${
            fullImage
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-200 text-slate-600"
          }`}
        >
          <Maximize size={15} />
          {fullImage ? "Full image selected" : "Use full image (no cropping)"}
        </button>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-soft rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={busy || !area}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          >
            {busy ? "Applying…" : <Check size={16} />}
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}
