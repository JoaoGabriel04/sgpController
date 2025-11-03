"use client";

import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import {
  Player,
  PLAYER_COLORS,
  PROPERTY_COLORS,
  Propriedade,
  SessionPropriedade,
} from "@/types/game";
import { useGameStore } from "@/stores/gameStore";
import MenuOptions from "../MenuOptions";
import Modal from "../Modal";
import { toast } from "react-toastify";

interface PlayerCardProps {
  player: Player;
  totalPropertyValue: number;
}

type ColorInfo = {
  value: string;
  label?: string;
  bg?: string;
  border?: string;
  text?: string;
  total?: number;
};

type Group = {
  color: ColorInfo;
  sessionPosses: SessionPropriedade[];
  properties: Propriedade[];
};

export default function PlayerCard({
  player,
  totalPropertyValue,
}: PlayerCardProps) {
  const {
    currentSession,
    getAluguel,
    loadSession,
    sellPropriedade,
    hipotecarProp,
    getPropertyById,
    buyHouse,
    sellHouse,
  } = useGameStore();

  // ===== Estados =====
  const [modalStack, setModalStack] = useState<("properties" | "options")[]>(
    []
  );
  const [propertiesByColor, setPropertiesByColor] = useState<
    Record<string, Group>
  >({});
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPropForAction, setSelectedPropForAction] =
    useState<Propriedade | null>(null);
  const [reqLoading, setReqLoading] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const playerColor = PLAYER_COLORS.find((color) => color.value === player.cor);
  const activeModal = modalStack[modalStack.length - 1] || null;

  // ===== Funções Auxiliares =====
  const resetModals = () => {
    setModalStack([]);
    setSelectedGroup(null);
    setSelectedPropForAction(null);
  };

  const handleGoBack = () => {
    setModalStack((prev) => prev.slice(0, -1));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // Agrupa propriedades por cor
  useEffect(() => {
    if (!currentSession) return;

    let isMounted = true;

    const groupProperties = async () => {
      const playerProperties = currentSession.sessionPosses.filter(
        (p) => p.playerId === player.id
      );

      const grouped: Record<string, Group> = {};

      for (const prop of playerProperties) {
        const propData: Propriedade | null = await getPropertyById(
          prop.possesId
        );
        if (!propData) continue;

        const colorInfo = PROPERTY_COLORS.find(
          (c) => c.value === propData.grupo_cor
        );
        if (!colorInfo) continue;

        if (!grouped[colorInfo.value]) {
          grouped[colorInfo.value] = {
            color: colorInfo,
            properties: [],
            sessionPosses: [],
          };
        }

        grouped[colorInfo.value].properties.push(propData);
        grouped[colorInfo.value].sessionPosses.push(prop);
      }

      if (isMounted) {
        setPropertiesByColor(grouped);
        setSelectedGroup((currentGroup) =>
          currentGroup ? grouped[currentGroup.color.value] || null : null
        );
      }
    };

    groupProperties();

    return () => {
      isMounted = false;
    };
  }, [currentSession, getPropertyById, player.id]);

  // Estatísticas
  const totalGroupsComplete = Object.values(propertiesByColor).filter(
    (group) => {
      const totalInGroup = group.color.total ?? 0;
      return totalInGroup > 0 && group.properties.length === totalInGroup;
    }
  ).length;

  // ===== Funções de venda/hipoteca =====
  const handleVenderPropriedade = async (
    propriedadeId: number,
    userId: number
  ) => {
    if (!currentSession) return;
    setReqLoading(true);
    try {
      await sellPropriedade(propriedadeId, currentSession.id, userId);
      toast.success("Propriedade vendida com sucesso!");
      await loadSession(currentSession.id);
      resetModals();
      handleGoBack();
    } catch (error) {
      console.error("Erro ao vender propriedade!", error);
      toast.error("Falha ao vender propriedade.");
    } finally {
      setReqLoading(false);
    }
  };

  const handleHipotecarPropriedade = async (
    propriedadeId: number,
    userId: number
  ) => {
    if (!currentSession) return;
    setReqLoading(true);
    try {
      await hipotecarProp(propriedadeId, currentSession.id, userId);
      toast.success("Propriedade hipotecada com sucesso!");
      await loadSession(currentSession.id);
      resetModals();
      handleGoBack();
    } catch (error) {
      console.error("Erro ao hipotecar propriedade!", error);
      toast.error("Falha ao hipotecar propriedade.");
    } finally {
      setReqLoading(false);
    }
  };

  async function handleComprarCasa(propriedadeId: number, userId: number) {
    if (!currentSession) return;
    setReqLoading(true);
    try {
      await buyHouse({ userId, sessionId: currentSession.id, propriedadeId });
      toast.success("Casa comprada com sucesso!");
      await loadSession(currentSession.id);
      handleGoBack();
    } catch (error) {
      console.error("Erro ao comprar casa!", error);
      toast.error("Falha ao comprar casa.");
    } finally {
      setReqLoading(false);
    }
  }

  async function handleVenderCasa(propriedadeId: number, userId: number) {
    if (!currentSession) return;
    setReqLoading(true);
    try {
      await sellHouse({ userId, sessionId: currentSession.id, propriedadeId });
      toast.success("Casa vendida com sucesso!");
      await loadSession(currentSession.id);
      handleGoBack();
    } catch (error) {
      console.error("Erro ao vender casa!", error);
      toast.error("Falha ao vender casa.");
    } finally {
      setReqLoading(false);
    }
  }

  return (
    <main
      className={`relative bg-white rounded-lg shadow-md border-2 ${
        playerColor?.bg?.replace("bg-", "border-") || "border-gray-300"
      } overflow-hidden`}
    >
      {/* Cabeçalho */}
      <div
        className={`${playerColor?.bg || "bg-gray-400"} px-4 py-3 text-white`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-bold">
                {player.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{player.nome}</h3>
          </div>
          <MenuOptions
            playerId={player.id}
            playerName={player.nome}
            show={showMenu}
            onToggle={() => setShowMenu(!showMenu)}
          />
        </div>
      </div>

      {/* Corpo */}
      <div className="p-4">
        {/* Saldo */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-600">Saldo</span>
          </div>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(player.saldo)}
          </span>
        </div>

        {/* Propriedades */}
        <div className="space-y-2">
          {Object.keys(propertiesByColor).length > 0 ? (
            <button
              onClick={() => setModalStack(["properties"])}
              className="w-full text-center p-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors cursor-pointer"
            >
              Ver Propriedades (
              {Object.values(propertiesByColor).reduce(
                (acc, group) => acc + group.properties.length,
                0
              )}
              )
            </button>
          ) : (
            <p className="text-xs text-gray-500 italic text-center py-2">
              Nenhuma propriedade
            </p>
          )}
        </div>

        {/* Estatísticas */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Valor Total</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatCurrency(totalPropertyValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Grupos Completos</p>
              <p className="text-sm font-semibold text-gray-800">
                {totalGroupsComplete}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}

      {/* Modal de propriedades */}
      <Modal
        size="lg"
        title={`Propriedades de ${player.nome}`}
        isOpen={activeModal === "properties"}
        onClose={resetModals}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {Object.entries(propertiesByColor)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([colorKey, group]) => (
              <div key={colorKey}>
                <h3
                  className={`text-lg font-semibold mb-2 flex items-center ${group.color.text}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full ${group.color.bg} mr-2`}
                  />
                  {group.color.label}
                </h3>

                <ul className="flex flex-col lg:flex-row lg:justify-between gap-4">
                  {group.properties?.map((prop: Propriedade) => {
                    const casas =
                      group.sessionPosses?.find((sp) => sp.possesId === prop.id)
                        ?.casas ?? 0;
                    const aluguel = getAluguel(prop, casas);

                    return (
                      <li
                        key={prop.id}
                        onClick={() => {
                          setSelectedPropForAction(prop);
                          setSelectedGroup(group);
                          setModalStack((prev) => [...prev, "options"]);
                        }}
                        className={`w-full lg:w-1/3 h-30 border border-t-4 ${group.color.border} rounded p-2 text-sm text-gray-700 flex flex-col gap-2 lg:items-center lg:justify-between cursor-pointer hover:bg-gray-100 transition-colors`}
                      >
                        <div className="flex flex-col lg:items-center">
                          <span>{prop.nome}</span>
                          <span className="text-xs text-gray-500">
                            Casas: {casas}
                          </span>
                          <span className="text-xs text-gray-500">
                            Aluguel: {aluguel}
                          </span>
                        </div>
                        <div className="flex flex-col lg:items-center">
                          <span className="font-bold text-green-500">
                            Valor casa: R$ {prop.custo_casa}
                          </span>
                          <span className="text-xs text-red-500">
                            Hipoteca: {prop.hipoteca}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </div>
      </Modal>

      {/* Modal de ações */}
      <Modal
        size="sm"
        title={`${selectedPropForAction?.nome}`}
        isOpen={activeModal === "options"}
        onClose={resetModals}
        onBack={handleGoBack}
      >
        <nav className="mt-4 flex flex-col gap-4">
          <button
            disabled={!selectedPropForAction || reqLoading}
            onClick={() => {
              if (!selectedPropForAction) return;

              const total = selectedGroup?.color?.total ?? 0;
              const qtd = selectedGroup?.properties?.length ?? 0;
              if (total === 0 || qtd !== total) {
                toast.warning(
                  "Você precisa ter todas as propriedades desse grupo para comprar casas!"
                );
                return;
              }

              const casas =
                selectedGroup?.sessionPosses.find(
                  (sp) => sp.possesId === selectedPropForAction.id
                )?.casas ?? 0;

              if (casas === 5) {
                toast.warning(
                  "Essa propriedade já atingiu o número máximo de casas!"
                );
                return;
              }

              if (
                confirm(
                  `Deseja comprar uma casa em "${selectedPropForAction.nome}"?`
                )
              ) {
                handleComprarCasa(selectedPropForAction.id, player.id);
              }
            }}
            className="w-full lg:w-auto py-2 lg:px-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reqLoading ? "Comprando..." : "Comprar Casa"}
          </button>

          <button
            disabled={!selectedPropForAction || reqLoading}
            onClick={() => {
              if (!selectedPropForAction) return;

              const casas =
                selectedGroup?.sessionPosses.find(
                  (sp) => sp.possesId === selectedPropForAction.id
                )?.casas ?? 0;

              if (casas === 0) {
                toast.error("Essa propriedade não possui casas para vender!");
                return;
              }

              if (
                confirm(
                  `Deseja vender uma casa de "${selectedPropForAction.nome}"?`
                )
              ) {
                handleVenderCasa(selectedPropForAction.id, player.id);
              }
            }}
            className="w-full lg:w-auto py-2 lg:px-2 bg-amber-500 text-white rounded cursor-pointer hover:bg-amber-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reqLoading ? "Vendendo..." : "Vender Casa"}
          </button>

          <button
            disabled={!selectedPropForAction || reqLoading}
            onClick={() => {
              if (!selectedPropForAction) return;
              const hasHouses = selectedGroup?.sessionPosses?.some(
                (p) => p.casas > 0
              );
              if (hasHouses) {
                toast.warning(
                  "Venda todas as casas do grupo antes de vender uma propriedade!"
                );
                return;
              }
              if (
                window.confirm(
                  `Tem certeza que deseja vender "${
                    selectedPropForAction.nome
                  }" por ${formatCurrency(selectedPropForAction.hipoteca)}?`
                )
              ) {
                handleVenderPropriedade(selectedPropForAction.id, player.id);
              }
            }}
            className="w-full lg:w-auto py-2 lg:px-2 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reqLoading ? "Vendendo..." : "Vender Propriedade"}
          </button>

          <button
            disabled={!selectedPropForAction || reqLoading}
            onClick={() => {
              if (!selectedPropForAction) return;
              const hasHouses = selectedGroup?.sessionPosses?.some(
                (p) => p.casas > 0
              );
              if (hasHouses) {
                toast.warning(
                  "Venda todas as casas do grupo antes de hipotecar uma propriedade!"
                );
                return;
              }
              if (
                window.confirm(
                  `Tem certeza que deseja hipotecar "${
                    selectedPropForAction.nome
                  }" por ${formatCurrency(selectedPropForAction.hipoteca)}?`
                )
              ) {
                handleHipotecarPropriedade(selectedPropForAction.id, player.id);
              }
            }}
            className="w-full lg:w-auto py-2 lg:px-2 bg-indigo-500 text-white rounded cursor-pointer hover:bg-indigo-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reqLoading ? "Hipotecando..." : "Hipotecar"}
          </button>
        </nav>
      </Modal>
    </main>
  );
}
