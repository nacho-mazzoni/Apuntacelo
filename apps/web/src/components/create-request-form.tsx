"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { parseUnits } from "viem";
import { getTokensForChain, getTokenByAddress } from "@/lib/tokens";
import type { TokenInfo } from "@/lib/tokens";

interface CreateRequestFormProps {
  chainId: number;
  isWriting: boolean;
  insufficientGas: boolean;
  onSubmit: (
    title: string,
    description: string,
    tokenAddress: `0x${string}`,
    amount: bigint
  ) => Promise<void>;
}

export function CreateRequestForm({
  chainId,
  isWriting,
  insufficientGas,
  onSubmit,
}: CreateRequestFormProps) {
  const tokens = getTokensForChain(chainId);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward: "",
  });

  useEffect(() => {
    if (tokens.length > 0 && !selectedToken) {
      setSelectedToken(tokens[0]);
    }
  }, [chainId, tokens, selectedToken]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken) return;
    const amount = parseUnits(formData.reward, selectedToken.decimals);
    await onSubmit(
      formData.title,
      formData.description,
      selectedToken.address as `0x${string}`,
      amount
    );
    setFormData({ title: "", description: "", reward: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {insufficientGas && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            No dispones de Celo en este momento... carga para poder realizar un
            pedido
          </p>
        </div>
      )}

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium">Título</label>
        <input
          type="text"
          name="title"
          required
          value={formData.title}
          onChange={handleInputChange}
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
          onChange={handleInputChange}
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
            setSelectedToken(token || null);
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
          onChange={handleInputChange}
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
