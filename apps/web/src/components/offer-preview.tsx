"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Download } from "lucide-react";
import { decryptFile } from "@/lib/file-encryption";
import { downloadFromIPFS } from "@/lib/ipfs";

interface OfferPreviewProps {
  ipfsCID: string;
  fileName: string;
  mimeType: string;
  keyBase64: string;
  onAccept?: () => void;
  isOwner: boolean;
  isDecrypted?: boolean;
}

export function OfferPreview({
  ipfsCID,
  fileName,
  mimeType,
  keyBase64,
  onAccept,
  isOwner,
  isDecrypted = false,
}: OfferPreviewProps) {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderPDFPages = useCallback(
    async (pdfData: ArrayBuffer) => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const images: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport }).promise;

          const ctxWatermark = canvas.getContext("2d");
          if (ctxWatermark) {
            ctxWatermark.save();
            ctxWatermark.font = "bold 48px sans-serif";
            ctxWatermark.fillStyle = "rgba(255, 0, 0, 0.15)";
            ctxWatermark.textAlign = "center";
            ctxWatermark.textBaseline = "middle";

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            ctxWatermark.translate(centerX, centerY);
            ctxWatermark.rotate(-Math.PI / 6);

            for (let y = -canvas.height; y < canvas.height; y += 120) {
              for (let x = -canvas.width; x < canvas.width; x += 300) {
                ctxWatermark.fillText("PREVIEW", x, y);
              }
            }

            ctxWatermark.restore();
          }

          const imgData = canvas.toDataURL("image/jpeg", 0.85);
          images.push(imgData);
        }

        setPageImages(images);
        setLoading(false);
      } catch (err) {
        console.error("Error renderizando PDF:", err);
        setError("No se pudo renderizar la vista previa");
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        const encryptedData = await downloadFromIPFS(ipfsCID);

        const keyBytes = new Uint8Array(
          atob(keyBase64)
            .split("")
            .map((c) => c.charCodeAt(0))
        );

        const iv = new Uint8Array(12);

        const decrypted = await decryptFile(
          encryptedData,
          keyBytes.buffer,
          iv,
          fileName,
          mimeType
        );

        setDecryptedBlob(decrypted.blob);

        if (mimeType === "application/pdf") {
          await renderPDFPages(await decrypted.blob.arrayBuffer());
        } else {
          setError(
            "Vista previa no disponible para este tipo de archivo. Se podra ver al aceptar."
          );
          setLoading(false);
        }
      } catch (err) {
        console.error("Error cargando preview:", err);
        setError("Error al cargar la vista previa");
        setLoading(false);
      }
    }

    if (ipfsCID && keyBase64) {
      loadAndRender();
    }
  }, [ipfsCID, keyBase64, fileName, mimeType, renderPDFPages]);

  const handleDownload = () => {
    if (!decryptedBlob) return;
    const url = URL.createObjectURL(decryptedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Cargando vista previa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative border rounded-lg overflow-hidden bg-white"
        onContextMenu={handleContextMenu}
        onCopy={(e) => e.preventDefault()}
        style={{ userSelect: "none" }}
      >
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center opacity-20 select-none">
              <Shield className="h-16 w-16 mx-auto mb-2" />
              <p className="text-2xl font-bold">PREVIEW</p>
              <p className="text-sm">No descargado</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 p-2">
          {pageImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Pagina ${idx + 1}`}
              className="w-full select-none"
              draggable={false}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground truncate">
          {fileName}
        </p>

        <div className="flex gap-2">
          {isDecrypted && (
            <Button size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Descargar
            </Button>
          )}

          {isOwner && onAccept && (
            <Button size="sm" onClick={onAccept}>
              Aceptar y Pagar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
