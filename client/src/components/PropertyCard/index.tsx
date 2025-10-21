'use client';
import { useEffect, useMemo } from "react";
import { useGameStore } from "@/stores/gameStore";
import { SessionPropriedade, PROPERTY_COLORS } from "@/types/game";

interface PropertyProps {
  property: SessionPropriedade;
}

export default function PropertyCard({ property }: PropertyProps) {
  const { getPropertyById } = useGameStore();
  const propertyData = useGameStore(
    (state) => state.propertiesCache[property.possesId]
  );

  useEffect(() => {
    if (!property?.possesId) return;

    // Se a propriedade não estiver no cache, a função getPropertyById a buscará.
    // O componente será re-renderizado quando o cache for atualizado.
    if (!propertyData) {
      getPropertyById(property.possesId);
    }
  }, [property?.possesId, getPropertyById, propertyData]);

  const colorInfo = useMemo(() => {
    if (!propertyData) return null;
    return PROPERTY_COLORS.find((c) => c.value === propertyData.grupo_cor);
  }, [propertyData]);

  if (!propertyData || !colorInfo) {
    return (
      <div className="p-4 border border-l-8 rounded shadow-sm bg-gray-100 border-gray-300 animate-pulse h-[98px]">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  const borderClass = colorInfo?.border ?? "border-gray-300";
  const bgClass = colorInfo?.bg ?? "bg-gray-100";

  return (
    <div className={`p-4 border border-l-8 rounded shadow-sm ${bgClass} ${borderClass}`}>
      <h3 className="font-semibold text-gray-800">{propertyData.nome}</h3>
      <p className="text-sm text-gray-500">Preço: {property.hipotecada ? propertyData.custo_compra + 20%(propertyData.custo_compra) : propertyData.custo_compra}</p>
      <p className="text-sm text-gray-500">
        Casas: {property.casas} • Hipotecada: {property.hipotecada ? "Sim" : "Não"}
      </p>
    </div>
  );
}