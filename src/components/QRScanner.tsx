import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onResult: (text: string) => void;
  onError?: (msg: string) => void;
};

export function QRScanner({ onResult, onError }: Props) {
  const containerId = useRef(`qr-${Math.random().toString(36).slice(2, 9)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = containerId.current;
    const scanner = new Html5Qrcode(id, { verbose: false });
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cancelled || cameras.length === 0) {
          onError?.("No se detectó cámara disponible");
          return;
        }
        const back = cameras.find((c) => /back|trasera|rear|environment/i.test(c.label)) ?? cameras[cameras.length - 1];
        scanner.start(
          back.id,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => onResult(decoded),
          () => {},
        ).catch((e) => onError?.(String(e?.message ?? e)));
      })
      .catch((e) => onError?.(String(e?.message ?? e)));

    return () => {
      cancelled = true;
      if (scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, []);

  return <div id={containerId.current} className="w-full max-w-sm mx-auto rounded-md overflow-hidden border bg-black/5" />;
}
