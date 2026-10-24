import { useEffect, useRef, useState } from "react";
import { CameraOff } from "lucide-react";

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type DetectorCtor = new (options: { formats: string[] }) => Detector;

type State = "starting" | "scanning" | "denied" | "no-camera" | "error";

// Opens the back camera and reads QR codes. Uses the phone's own reader when it has one (fast, saves battery),
// otherwise a small reader library loaded on demand. Calls onResult once for each new code.
export function QrScanner({
  onResult,
  everyMs = 200,
}: {
  onResult: (text: string) => void;
  everyMs?: number;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<State>("starting");
  const resultRef = useRef(onResult);

  useEffect(() => {
    resultRef.current = onResult;
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let last = { text: "", at: 0 };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setState("no-camera");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (e) {
        const name = (e as DOMException).name;
        return setState(
          name === "NotAllowedError" || name === "SecurityError"
            ? "denied"
            : name === "NotFoundError"
              ? "no-camera"
              : "error",
        );
      }
      if (cancelled || !video.current)
        return stream.getTracks().forEach((t) => t.stop());
      video.current.srcObject = stream;
      await video.current.play().catch(() => undefined);
      setState("scanning");

      const Native = (window as unknown as { BarcodeDetector?: DetectorCtor })
        .BarcodeDetector;
      const detector = Native ? new Native({ formats: ["qr_code"] }) : null;
      const jsQR = detector ? null : (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const seen = (text: string) => {
        const now = Date.now();
        if (text === last.text && now - last.at < 2500) return; // the same code stays in view for a while
        last = { text, at: now };
        resultRef.current(text);
      };

      const scan = async () => {
        const v = video.current;
        if (cancelled || !v) return;
        if (v.readyState >= 2 && v.videoWidth > 0) {
          try {
            if (detector) {
              const found = await detector.detect(v);
              if (found[0]) seen(found[0].rawValue);
            } else if (jsQR && ctx) {
              const scale = Math.min(1, 640 / v.videoWidth);
              canvas.width = Math.round(v.videoWidth * scale);
              canvas.height = Math.round(v.videoHeight * scale);
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(img.data, img.width, img.height, {
                inversionAttempts: "dontInvert",
              });
              if (code) seen(code.data);
            }
          } catch {
            /* a frame that cannot be read is skipped */
          }
        }
        timer = setTimeout(() => void scan(), everyMs);
      };
      void scan();
    };

    void start();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop()); // switch the camera off
    };
  }, [everyMs]);

  if (state === "denied" || state === "no-camera" || state === "error") {
    return (
      <div
        role="alert"
        className="space-y-2 rounded-2xl border-2 border-line bg-white p-4"
      >
        <p className="flex items-center gap-2 font-semibold">
          <CameraOff size={20} /> The camera is not available.
        </p>
        <p className="text-subtext">
          {state === "denied"
            ? "Allow the camera for Prima in the browser's site settings, then open this page again."
            : state === "no-camera"
              ? "This device has no usable camera."
              : "The camera could not start."}{" "}
          You can type the card number below instead.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-line bg-black">
      <video
        ref={video}
        playsInline
        muted
        className="aspect-square w-full object-cover md:aspect-video"
      />
      <div
        className="pointer-events-none absolute inset-[18%] rounded-2xl border-4 border-white/80"
        aria-hidden
      />
      {state === "starting" && (
        <p className="absolute inset-x-0 bottom-3 text-center text-sm font-medium text-white">
          Starting the camera…
        </p>
      )}
    </div>
  );
}
