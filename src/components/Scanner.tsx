"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Alert, Spinner } from "@/components/ui";

const REGION_ID = "backbar-scan-region";

export function Scanner({
  active,
  onScan,
}: {
  active: boolean;
  onScan: (code: string) => void;
}) {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopIfNeeded = async () => {
    const s = scannerRef.current;
    if (s) {
      try {
        if (s.isScanning) {
          await s.stop();
          s.clear();
        }
      } catch {
        /* already stopped */
      }
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    if (!active) {
      void stopIfNeeded();
      return;
    }
    let cancelled = false;
    setError(null);
    setStarting(true);

    const boot = async () => {
      await stopIfNeeded();
      if (cancelled) return;
      const el = regionRef.current;
      if (!el) return;
      el.innerHTML = "";
      const scanner = new Html5Qrcode(REGION_ID, { verbose: false });
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 150 } },
          (text) => onScanRef.current(text),
          () => {
            /* per-frame decode miss — ignore */
          }
        );
        if (!cancelled) setStarting(false);
      } catch {
        if (cancelled) return;
        setStarting(false);
        setError(
          "Camera unavailable. Allow camera access for this site (or use a secure connection), then try again — or check a code with the manual entry box below."
        );
      }
    };
    void boot();

    return () => {
      cancelled = true;
      void stopIfNeeded();
    };
  }, [active]);

  return (
    <div>
      <div
        ref={regionRef}
        className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl bg-dark-900"
      >
        <div id={REGION_ID} className="w-full" />
        {!active && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-dark-300">
            <div className="grid h-16 w-16 place-items-center rounded-xl border border-dark-700">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8.5a2 2 0 0 1 2-2h1.5L9 4.5h6l1.5 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z" />
                <circle cx="12" cy="12.5" r="3.4" />
              </svg>
            </div>
            <p className="px-8 text-center text-sm">
              Camera is off. Press “Start camera” and point it at a product’s barcode or QR label.
            </p>
          </div>
        )}
        {starting && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/70">
            <Spinner className="border-dark-300 border-t-copper-500" />
          </div>
        )}
      </div>
      {error && (
        <div className="mt-3">
          <Alert tone="warn">{error}</Alert>
        </div>
      )}
    </div>
  );
}
