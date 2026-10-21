"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Alert, Spinner } from "@/components/ui";

const REGION_ID = "backbar-scan-region";

async function stopScannerInstance(
  scanner: Html5Qrcode | null
): Promise<void> {
  if (!scanner) return;

  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    // The camera may already have stopped or be shutting down.
  }

  try {
    scanner.clear();
  } catch {
    // The scanner's DOM may already have been cleared.
  }
}

export function Scanner({
  active,
  onScan,
}: {
  active: boolean;
  onScan: (code: string) => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);

  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) {
      const existing = scannerRef.current;
      scannerRef.current = null;
      void stopScannerInstance(existing);
      return;
    }

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    const boot = async () => {
      // Stop any previous camera before creating another instance.
      const previous = scannerRef.current;
      scannerRef.current = null;

      await stopScannerInstance(previous);

      if (cancelled) return;

      // Defer state updates until asynchronous startup begins.
      setError(null);
      setStarting(true);

      const target = document.getElementById(REGION_ID);

      if (!target) {
        if (!cancelled) {
          setStarting(false);
          setError("Scanner area could not be initialized. Close and reopen the scanner.");
        }
        return;
      }

      target.innerHTML = "";

      try {
        scanner = new Html5Qrcode(REGION_ID, {
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 240, height: 150 },
            aspectRatio: 4 / 3,
          },
          (decodedText) => {
            if (!cancelled) {
              onScanRef.current(decodedText);
            }
          },
          () => {
            // Ignore individual frames that do not contain a readable code.
          }
        );

        if (cancelled) {
          await stopScannerInstance(scanner);

          if (scannerRef.current === scanner) {
            scannerRef.current = null;
          }

          return;
        }

        setStarting(false);
      } catch {
        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }

        await stopScannerInstance(scanner);

        if (!cancelled) {
          setStarting(false);
          setError(
            "Unable to start the camera. Check browser camera permissions, ensure the site uses HTTPS, and close other apps using the camera. You can also enter the barcode manually."
          );
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;

      if (scanner && scannerRef.current === scanner) {
        scannerRef.current = null;
      }

      void stopScannerInstance(scanner);
    };
  }, [active]);

  return (
    <div>
      <div className="relative min-h-[280px] overflow-hidden rounded-xl bg-dark-900">
        <div
          id={REGION_ID}
          className="relative min-h-[280px] w-full overflow-hidden rounded-xl bg-dark-900 [&_video]:max-h-[420px] [&_video]:w-full [&_video]:object-cover"
        />

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-dark-300">
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
              Camera is off. Press “Start camera” and point it at a product’s
              barcode or QR label.
            </p>
          </div>
        )}

        {starting && active && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-900/70">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="border-dark-300 border-t-copper-500" />
              <p className="text-sm text-dark-300">
                Starting camera…
              </p>
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