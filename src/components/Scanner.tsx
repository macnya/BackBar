"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Alert, Spinner } from "@/components/ui";

const REGION_ID = "backbar-scan-region";

// Formats that cover virtually every product label in a bar/restaurant.
const FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
];

async function shutdown(s: Html5Qrcode | null) {
  if (!s) return;
  try {
    if (s.isScanning) await s.stop();
  } catch {
    /* already stopped */
  }
  try {
    s.clear();
  } catch {
    /* DOM already gone */
  }
}

export function Scanner({
  active,
  onScan,
}: {
  active: boolean;
  onScan: (code: string) => void;
}) {
  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

    useEffect(() => {
    let cancelled = false;

    if (!active) {
      const prev = scannerRef.current;
      scannerRef.current = null;
      void shutdown(prev);
      // Defer the transient-UI reset so it does not run synchronously in the
      // effect body (react-hooks/set-state-in-effect).
      queueMicrotask(() => {
        if (cancelled) return;
        setStarting(false);
        setError(null);
      });
      return;
    }

    const boot = async () => {
      const prev = scannerRef.current;
      scannerRef.current = null;
      await shutdown(prev);
      if (cancelled) return;

      setError(null);
      setStarting(true);

      const target = document.getElementById(REGION_ID);
      if (!target) {
        if (!cancelled) {
          setStarting(false);
          setError("Scanner region missing — close and reopen this page.");
        }
        return;
      }
      target.innerHTML = "";

      const instance = new Html5Qrcode(REGION_ID, {
        verbose: false,
        formatsToSupport: FORMATS,
        // Uses the browser's native BarcodeDetector when available (much faster
        // and more reliable on Android Chrome / recent iOS Safari).
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      });
      scannerRef.current = instance;

      try {
        await instance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            // `qrbox` doubles as the visible viewport; keep it wide enough
            // for EAN-13 labels. Pass a function so the box adapts to
            // portrait phones.
            qrbox: (vw, vh) => {
              const edge = Math.floor(Math.min(vw, vh) * 0.7);
              return { width: edge, height: Math.floor(edge * 0.6) };
            },
            // IMPORTANT: do NOT set aspectRatio here. Setting it forces a crop
            // that makes portrait previews look black above/below the box.
          },
          (text) => {
            if (!cancelled) onScanRef.current(text);
          },
          () => {
            /* per-frame miss */
          }
        );

        if (cancelled) {
          await shutdown(instance);
          if (scannerRef.current === instance) scannerRef.current = null;
          return;
        }
        setStarting(false);
      } catch (err) {
        if (scannerRef.current === instance) scannerRef.current = null;
        await shutdown(instance);
        if (cancelled) return;
        setStarting(false);

        const name = err instanceof Error ? err.name : "";
        const msg =
          name === "NotAllowedError"
            ? "Camera permission was blocked. Tap the lock icon in the address bar → Site settings → Camera → Allow, then reload."
            : name === "NotFoundError"
            ? "No camera found on this device. Use manual entry below."
            : name === "NotReadableError"
            ? "Camera is in use by another app or tab. Close other camera apps and try again."
            : name === "OverconstrainedError"
            ? "This device's rear camera could not satisfy the requested settings. Try again or use manual entry."
            : "Camera could not start. Make sure the page is served over HTTPS and camera access is allowed.";
        setError(msg);
        console.warn("[Scanner] start failed:", name, err);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      if (inst) {
        scannerRef.current = null;
        void shutdown(inst);
      }
    };
  }, [active]);

  return (
    <div>
      <div className="relative min-h-[280px] overflow-hidden rounded-xl bg-dark-900">
        {/* The element Html5Qrcode owns. Do not conditionally unmount it. */}
        <div
          id={REGION_ID}
          className="relative min-h-[280px] w-full overflow-hidden rounded-xl bg-dark-900 [&_video]:w-full [&_video]:h-auto"
        />

        {!active && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-dark-300">
            <div className="grid h-16 w-16 place-items-center rounded-xl border border-dark-700">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 8.5a2 2 0 0 1 2-2h1.5L9 4.5h6l1.5 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z" />
                <circle cx="12" cy="12.5" r="3.4" />
              </svg>
            </div>
            <p className="px-8 text-center text-sm">
              Camera is off. Press “Start camera” and point it at a barcode or QR label.
            </p>
          </div>
        )}

        {starting && active && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-dark-900/70">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="border-dark-300 border-t-copper-500" />
              <p className="text-sm text-dark-300">Starting camera…</p>
            </div>
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