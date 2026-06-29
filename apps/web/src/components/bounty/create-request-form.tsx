"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { TokenInfo } from "@/lib/tokens";

interface CreateRequestFormProps {
  formData: { title: string; description: string; reward: string };
  selectedToken: TokenInfo | null;
  tokens: TokenInfo[];
  isWriting: boolean;
  insufficientGas: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onTokenChange: (token: TokenInfo | null) => void;
}

export function CreateRequestForm({
  formData,
  selectedToken,
  tokens,
  isWriting,
  insufficientGas,
  onSubmit,
  onInputChange,
  onTokenChange,
}: CreateRequestFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {insufficientGas && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            No dispones de Celo en este momento... carga para poder realizar un
            pedido
          </p>
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Al crear tu pedido, tu mensajería se activa automáticamente y los
          vendedores podrán enviarte ofertas.
        </p>
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">Título</label>
        <input
          type="text"
          name="title"
          required
          value={formData.title}
          onChange={onInputChange}
          className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">Descripción</label>
        <textarea
          name="description"
          required
          rows={3}
          value={formData.description}
          onChange={onInputChange}
          className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">Moneda</label>
        <select
          name="token"
          value={selectedToken?.address || ""}
          onChange={(e) => {
            const token = tokens.find(
              (t) => t.address === e.target.value
            );
            onTokenChange(token || null);
          }}
          className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {tokens.map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol} - {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">
          Recompensa ({selectedToken?.symbol || "USD"})
        </label>
        <input
          type="number"
          name="reward"
          required
          min="0"
          step="0.01"
          value={formData.reward}
          onChange={onInputChange}
          className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isWriting || insufficientGas}
      >
        {isWriting ? "Enviando..." : "Crear Pedido"}
      </Button>
    </form>
  );
}
