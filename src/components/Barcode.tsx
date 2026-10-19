"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { cn } from "@/lib/api-client";

export function BarcodeSvg({ value, className }: { value: string; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: "CODE128",
          displayValue: true,
          margin: 4,
          height: 38,
          width: 1.4,
          fontSize: 11,
          font: "Manrope",
          lineColor: "#211a13",
          background: "transparent",
          textMargin: 2,
        });
      } catch {
        /* invalid value */
      }
    }
  }, [value]);
  return <svg ref={ref} className={cn("text-ink-900", className)} />;
}

export function QrImage({
  value,
  size = 96,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#211a13", light: "#fffdf8" },
    })
      .then((s) => live && setSrc(s))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [value, size]);
  if (!src) {
    return (
      <div style={{ width: size, height: size }} className={cn("animate-pulse rounded bg-paper-100", className)} />
    );
  }
  return <img src={src} width={size} height={size} alt={`Code ${value}`} className={className} />;
}

export function LabelCard({
  name,
  sku,
  unit,
  quantity,
}: {
  name: string;
  sku: string;
  unit: string;
  quantity: number;
}) {
  return (
    <div className="label-card flex w-[300px] flex-col gap-1.5 rounded-lg border border-line bg-cream p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-ink-900">{name}</div>
          <div className="text-[11px] text-ink-500">
            {Math.round(quantity * 100) / 100} {unit} on hand
          </div>
        </div>
        <QrImage value={sku} size={54} className="shrink-0 rounded border border-line bg-cream" />
      </div>
      <BarcodeSvg value={sku} className="h-auto w-full" />
    </div>
  );
}
