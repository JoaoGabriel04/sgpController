"use client";
import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import PropertyCard from "../PropertyCard";
import { LoaderCircle, ShoppingCart } from "lucide-react";
import Modal from "../Modal";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function Propriedades() {
  const { currentSession, loadSession, buyProperty } = useGameStore();

  const allProperties = currentSession?.sessionPosses ?? [];
  const availableProperties = allProperties
    .filter((prop) => prop.playerId === null)
    .filter((prop) => prop.hipotecada === false)
    .sort((a, b) => a.possesId - b.possesId);

  const hipotecadaProperties = allProperties
    .filter((prop) => prop.playerId === null)
    .filter((prop) => prop.hipotecada === true)
    .sort((a, b) => a.possesId - b.possesId);

  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [loadingBuy, setLoadingBuy] = useState(false);

  async function handleBuyProperty(
    propertyId: number,
    playerId: number,
    sessionId: number
  ) {
    setLoadingBuy(true);
    try {
      await buyProperty(propertyId, sessionId, playerId);
      await loadSession(sessionId);
      toast.success("Propriedade comprada com sucesso!");
      setShowBuyModal(false);
      setSelectedPlayer(null);
      setSelectedProperty(null);
    } catch (error) {
      console.error("Erro ao comprar propriedade: ", error);
      toast.error("Erro ao comprar propriedade");
    } finally {
      setLoadingBuy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Propriedades Disponíveis ({availableProperties.length})
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
          {availableProperties?.length > 0 &&
            availableProperties.map((property) => (
              <div key={property.id} className="relative">
                <PropertyCard property={property} />
                <button
                  onClick={() => {
                    setSelectedProperty(property.possesId);
                    setShowBuyModal(true);
                  }}
                  className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {loadingBuy ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
        </div>

        {hipotecadaProperties.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Propriedades Hipotecadas ({hipotecadaProperties.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
              {hipotecadaProperties?.length > 0 &&
                hipotecadaProperties.map((property) => (
                  <div key={property.id} className="relative">
                    <PropertyCard property={property} />
                    <button
                      onClick={() => {
                        setSelectedProperty(property.possesId);
                        setShowBuyModal(true);
                      }}
                      className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      {loadingBuy ? (
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        size="md"
        title="Comprar Propriedade"
      >
        <div className="flex flex-col gap-4">
          <p>Selecione o jogador que irá comprar esta propriedade:</p>

          <Select
            onValueChange={(value) => setSelectedPlayer(Number(value))}
            value={selectedPlayer?.toString()}
          >
            <SelectTrigger>
              <SelectValue placeholder="-- Selecione um jogador --" />
            </SelectTrigger>
            <SelectContent>
              {currentSession?.jogadores.map((player) => (
                <SelectItem key={player.id} value={player.id.toString()}>
                  {player.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowBuyModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              disabled={
                loadingBuy ||
                !selectedPlayer ||
                !selectedProperty ||
                !currentSession
              }
              onClick={() => {
                if (!selectedProperty || !selectedPlayer || !currentSession)
                  return;
                handleBuyProperty(
                  selectedProperty,
                  selectedPlayer,
                  currentSession.id
                );
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {loadingBuy ? "Comprando..." : "Confirmar Compra"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
