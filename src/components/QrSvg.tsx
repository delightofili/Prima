import { useEffect, useState } from "react";
import { qrPath } from "../lib/qrPath";
import { useI18n } from "../i18n";

// Draws a QR code as an SVG. The QR library is loaded only when a code is first needed.
export function QrSvg({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState<{ d: string; n: number } | null>(null);

  useEffect(() => {
    let alive = true;
    void import("qrcode").then((mod) => {
      if (!alive) return;
      const qr = mod.create(text, { errorCorrectionLevel: "M" });
      setCode({
        d: qrPath(qr.modules.size, (r, c) => qr.modules.get(r, c) === 1),
        n: qr.modules.size,
      });
    });
    return () => {
      alive = false;
    };
  }, [text]);

  if (!code) return <div className={className} aria-hidden />;
  return (
    <svg
      viewBox={`-4 -4 ${code.n + 8} ${code.n + 8}`}
      role="img"
      aria-label={t("scan.qrAria")}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect x="-4" y="-4" width={code.n + 8} height={code.n + 8} fill="#fff" />
      <path d={code.d} fill="#000" />
    </svg>
  );
}
