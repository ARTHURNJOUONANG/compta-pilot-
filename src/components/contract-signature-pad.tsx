"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  label: string;
  required?: boolean;
  defaultDataUrl?: string;
};

export function ContractSignaturePad({
  name,
  label,
  required = true,
  defaultDataUrl,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dataUrl, setDataUrl] = useState(defaultDataUrl ?? "");

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }, []);

  const fillWhite = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [getCtx]);

  const loadImage = useCallback(
    (url: string) => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;
      const img = new Image();
      img.onload = () => {
        fillWhite();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setDataUrl(url);
      };
      img.src = url;
    },
    [fillWhite, getCtx],
  );

  useEffect(() => {
    fillWhite();
    if (defaultDataUrl) loadImage(defaultDataUrl);
  }, [defaultDataUrl, fillWhite, loadImage]);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    const me = e as React.MouseEvent;
    return {
      x: (me.clientX - rect.left) * scaleX,
      y: (me.clientY - rect.top) * scaleY,
    };
  };

  const syncDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDataUrl(canvas.toDataURL("image/png"));
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = getCtx();
    const { x, y } = pos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = getCtx();
    const { x, y } = pos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const end = () => {
    if (drawing.current) syncDataUrl();
    drawing.current = false;
  };

  const clear = () => {
    fillWhite();
    setDataUrl("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Effacer
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className="h-28 w-full touch-none cursor-crosshair"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <input type="hidden" name={name} value={dataUrl} required={required && !dataUrl} readOnly />
      <p className="text-xs text-slate-500">Signez avec la souris ou le doigt sur tablette.</p>
    </div>
  );
}
