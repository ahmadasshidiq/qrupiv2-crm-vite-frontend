import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "@/lib/icons";
import { Button } from "@/components/ui/button";

type UserQrCardProps = {
  code: string;
  name?: string;
};

export function UserQrCard({ code, name }: UserQrCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const downloadQr = () => {
    const canvas = wrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qr-${name ?? code}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wrapperRef}
        className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10"
      >
        <QRCodeCanvas value={code} size={144} marginSize={1} />
      </div>
      <p className="max-w-[180px] break-all text-center font-mono text-xs text-zinc-500">
        {code}
      </p>
      <Button variant="outline" size="sm" onClick={downloadQr}>
        <Download /> Unduh QR
      </Button>
    </div>
  );
}
