'use client';
import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { SessionPropriedade, Propriedade, PROPERTY_COLORS } from "@/types/game";
import { toast } from "react-toastify";

interface PropertyProps {
  property: SessionPropriedade;
}

export default function PropertyCard({ property }: PropertyProps) {
  const { getPropertyById } = useGameStore();
  const [propertyData, setPropertyData] = useState<Propriedade | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!property?.possesId) return;

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPropertyById(property.possesId);
        setPropertyData(data ?? null);
      } catch (err: unknown) {
        console.log("Erro ao carregar propriedade: ", err);
        toast.error("Erro ao carregar propriedade")
        setError("Erro ao carregar propriedade");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [property?.possesId, getPropertyById]);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;
  if (!propertyData) return <div>Propriedade não encontrada</div>;

  const colorInfo = PROPERTY_COLORS.find(
    (c) => c.value === propertyData.grupo_cor
  );

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