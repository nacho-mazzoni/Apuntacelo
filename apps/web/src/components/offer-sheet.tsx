"use client";

import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { encryptFile, arrayBufferToBase64 } from "@/lib/file-encryption";
import { uploadEncryptedFile } from "@/lib/ipfs";
import { FileText, Upload, Loader2, AlertTriangle } from "lucide-react";

interface OfferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bounty: {
    id: number;
    title: string;
    reward: number;
    requester: string;
  } | null;
  onSubmit: (
    bountyId: number,
    file: File,
    ipfsCID: string,
    encryptedKey: string
  ) => Promise<void>;
  xmtpClient: any;
}

export function OfferSheet({
  open,
  onOpenChange,
  bounty,
  onSubmit,
  xmtpClient,
}: OfferSheetProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Solo se permiten archivos PDF o DOC/DOCX");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert("El archivo no puede superar los 50MB");
        return;
      }

      setSelectedFile(file);
      setAccepted(false);
    },
    []
  );

  const handleSubmit = async () => {
    if (!selectedFile || !bounty || !accepted || !xmtpClient) return;

    setUploading(true);
    setProgress("Cifrando archivo...");

    try {
      const encrypted = await encryptFile(selectedFile);

      setProgress("Subiendo a IPFS...");

      const encryptedFile = new File(
        [new Blob([encrypted.encryptedData])],
        `${selectedFile.name}.enc`,
        { type: "application/octet-stream" }
      );

      const ipfsCID = await uploadEncryptedFile(
        encrypted.encryptedData,
        selectedFile.name
      );

      setProgress("Enviando clave al solicitante...");

      const keyBase64 = arrayBufferToBase64(encrypted.keyExported);

      const conversation = await xmtpClient.conversations.newConversation(
        bounty.requester
      );
      await conversation.send({
        type: "text",
        content: `OFFER_KEY:${bounty.id}:${keyBase64}:${selectedFile.name}:${selectedFile.type}`,
      });

      await onSubmit(bounty.id, selectedFile, ipfsCID, keyBase64);

      setSelectedFile(null);
      setAccepted(false);
      setProgress("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error al ofrecer apuntes:", error);
      alert("Error al procesar la oferta. Intenta de nuevo.");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setAccepted(false);
      setProgress("");
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-3/4">
        <SheetHeader className="mb-4">
          <SheetTitle>Ofrecer mis Apuntes</SheetTitle>
          <SheetDescription>
            {bounty && (
              <span>
                Para: <strong>{bounty.title}</strong> | Recompensa:{" "}
                <strong>{bounty.reward} CELO</strong>
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Al subir el archivo aceptas el precio de {bounty?.reward} CELO
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  El solicitante podra ver una vista previa sin descargar.
                  Cuando acepte, se ejecutara el smart contract y recibiras el
                  pago.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
            {selectedFile ? (
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-primary mb-2" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                >
                  Cambiar archivo
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  Subir archivo (PDF o DOC/DOCX)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximo 50MB
                </p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {selectedFile && (
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                disabled={uploading}
                className="mt-1"
              />
              <span className="text-sm">
                Acepto el precio de <strong>{bounty?.reward} CELO</strong> por
                este archivo. Entiendo que el pago se realizara automaticamente
                cuando el solicitante acepte mi oferta.
              </span>
            </label>
          )}

          {uploading && (
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">{progress}</span>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedFile || !accepted || uploading || !xmtpClient}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {progress}
              </>
            ) : (
              "Enviar Oferta"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
