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

export default function PlayerCard({ player }: PlayerCardProps) {
  const {
    currentSession,
    getPropertyById,
    buyHouse,
    sellHouse,
    getAluguel,
    loadSession,
    sellPropriedade,
    hipotecarProp,
  } = useGameStore();
  const [showMenu, setShowMenu] = useState(false);
  const [modalProps, setModalProps] = useState(false);
  const [optionsModal, setOptionsModal] = useState(false);
  const [propertiesByColor, setPropertiesByColor] = useState<{
    [key: string]: Group;
  }>({});
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPropForAction, setSelectedPropForAction] =
    useState<Propriedade | null>(null);

  const [reqLoading, setReqLoading] = useState(false);

  const playerColor = PLAYER_COLORS.find((color) => color.value === player.cor);
  
  // 🔁 Atualiza propriedades do jogador
  const atualizarPropriedadesDoJogador = async () => {
    if (!currentSession) return;
  
    const playerProperties = currentSession.sessionPosses.filter(
      (p) => p.playerId === player.id
    );
  
    const grouped: Record<string, Group> = {};
  
    for (const prop of playerProperties) { 
      const propData: Propriedade | null = await getPropertyById(prop.possesId);
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
  
    setPropertiesByColor(grouped);
  
    // Se um grupo estiver selecionado, atualiza seus dados para refletir no modal aberto.
    if (selectedGroup) {
      setSelectedGroup(grouped[selectedGroup.color.value] || null);
    }
  };
  
  // 🔄 Recarrega sempre que a sessão mudar
  useEffect(() => {
    if (!currentSession) return;
    atualizarPropriedadesDoJogador();
  }, [currentSession]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const totalPropertyValue = Object.values(propertiesByColor)
    .flatMap((g) => g.properties)
    .reduce((acc, p) => acc + p.custo_compra, 0);

  const totalGroupsComplete = Object.values(propertiesByColor).filter(
    (group) => {
      const totalInGroup = group.color.total ?? 0;
      return totalInGroup > 0 && group.properties.length === totalInGroup;
    }
  ).length;

  function handleConfigPropriedades(color: string) {
    const group = propertiesByColor[color];
    if (!group) return;

    setSelectedGroup(group);
    setModalProps(true);
  }

  async function handleComprarCasa(propriedadeId: number, userId: number) {
    if (!propriedadeId || !userId || !selectedGroup?.color) return;
    if (!currentSession) return;

    try {
      setReqLoading(true);
      await buyHouse({ userId, sessionId: currentSession.id, propriedadeId });

      toast.success("Casa comprada com sucesso!");
      setReqLoading(false);
      loadSession(currentSession.id);
      setOptionsModal(false); // Fecha o modal de opções
      setSelectedPropForAction(null); // Fecha o modal de propriedades
    } catch (error) {
      console.error("Erro ao comprar casa!", error);
      toast.error("Erro ao comprar casa!");
    }
  }

  async function handleVenderCasa(propriedadeId: number, userId: number) {
    if (!propriedadeId || !userId || !selectedGroup?.color) return;
    if (!currentSession) return;

    try {
      setReqLoading(true);
      await sellHouse({ userId, sessionId: currentSession.id, propriedadeId });

      toast.success("Casa vendida com sucesso!");
      setReqLoading(false);
      loadSession(currentSession.id);
      setOptionsModal(false); // Fecha o modal de opções
      setSelectedPropForAction(null); // Fecha o modal de propriedades
    } catch (error) {
      console.error("Erro ao comprar casa!", error);
      toast.error("Erro ao comprar casa!");
    }
  }

  async function handleVenderPropriedade(
    propriedadeId: number,
    userId: number
  ) {
    if (!currentSession) return;

    try {
      setReqLoading(true);
      await sellPropriedade(propriedadeId, currentSession.id, userId);
  
      toast.success("Propriedade vendida com sucesso!");
      await loadSession(currentSession.id);
      // A atualização será reativa via `useEffect` que depende de `currentSession`

      // Fecha todos os modais relevantes
      setOptionsModal(false);
      setModalProps(false);
      setSelectedGroup(null);
      setSelectedPropForAction(null); // Fecha o modal de propriedades
    } catch (error) {
      console.error("Erro ao vender propriedade!", error);
      // A mensagem de erro pode já ser exibida pelo gameStore
    }
  }

  async function handleHipotecarPropriedade(
    propriedadeId: number,
    userId: number
  ) {
    if (!currentSession) return;

    try {
      setReqLoading(true);
      await hipotecarProp(propriedadeId, currentSession.id, userId);
  
      toast.success("Propriedade hipotecada com sucesso!");
      await loadSession(currentSession.id);
      // A atualização será reativa via `useEffect` que depende de `currentSession`

      // Fecha todos os modais relevantes
      setOptionsModal(false);
      setModalProps(false);
      setSelectedGroup(null);
      setSelectedPropForAction(null); // Fecha o modal de propriedades
    } catch (error) {
      console.error("Erro ao vender propriedade!", error);
      // A mensagem de erro pode já ser exibida pelo gameStore
    }
  }

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md border-2 ${playerColor?.bg.replace(
        "bg-",
        "border-"
      )} overflow-hidden`}
    >
      {/* Cabeçalho */}
      <div className={`${playerColor?.bg} px-4 py-3 text-white`}>
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

        {/* Propriedades agrupadas */}
        <div className="space-y-2">
          {Object.keys(propertiesByColor).length > 0 ? (
            Object.entries(propertiesByColor).map(([colorKey, group]) => (
              <div
                onClick={() => handleConfigPropriedades(colorKey)}
                key={colorKey}
                className={`flex items-center justify-between p-2 bg-gray-50 border ${group.color.border} rounded cursor-pointer hover:bg-gray-100`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${group.color.bg} mr-2`}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {group.color.label}
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  {group.properties.length}
                </span>
              </div>
            ))
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

      {/* Modal de propriedades */}
      <Modal
        size="lg"
        title="Propriedades"
        isOpen={modalProps}
        onClose={() => {
          setModalProps(false);
          setSelectedGroup(null);
        }}
      >
        <div>
          <h3
            className={`text-lg font-semibold mb-2 flex items-center ${selectedGroup?.color?.text}`}
          >
            <div
              className={`w-4 h-4 rounded-full ${selectedGroup?.color?.bg} mr-2`}
            />
            {selectedGroup?.color?.label}
          </h3>

          <ul className="flex flex-col lg:flex-row lg:justify-between gap-4">
            {selectedGroup?.properties?.map((prop: Propriedade) => {
              const casas =
                selectedGroup.sessionPosses?.find(
                  (sp) => sp.possesId === prop.id
                )?.casas ?? 0;

              const aluguel = getAluguel(prop, casas);

              return (
                <li
                  key={prop.id}
                  onClick={() => {
                    setSelectedPropForAction(prop);
                    setOptionsModal(true);
                  }}
                  className={`w-full lg:w-1/3 h-30 border border-t-4 ${selectedGroup?.color?.border} rounded p-2 text-sm text-gray-700 flex flex-col gap-2 lg:items-center lg:justify-between cursor-pointer hover:bg-gray-100 transition-colors`}
                >
                  <div className="flex flex-col lg:items-center">
                    <span>{prop.nome}</span>
                    <span className="text-xs text-gray-500">
                      Casas: {casas}
                    </span>
                    <span className="text-xs text-gray-500">
                      Alguel: {aluguel}
                    </span>
                  </div>
                  <div className="flex flex-col lg:items-center">
                    <span className={`font-bold text-green-500`}>
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
      </Modal>

      <Modal
        size="sm"
        title={`Opções para "${selectedPropForAction?.nome}"`}
        isOpen={optionsModal}
        onClose={() => {
          setOptionsModal(false);
          setSelectedPropForAction(null);
        }}
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
            className={`w-full lg:w-auto py-2 lg:px-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
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
            className={`w-full lg:w-auto py-2 lg:px-2 bg-amber-500 text-white rounded cursor-pointer hover:bg-amber-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
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
                confirm(
                  `Tem certeza que deseja vender "${
                    selectedPropForAction.nome
                  }" por ${formatCurrency(selectedPropForAction.hipoteca)}?`
                )
              ) {
                handleVenderPropriedade(selectedPropForAction.id, player.id);
              }
            }}
            className={`w-full lg:w-auto py-2 lg:px-2 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
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
                  "Venda todas as casas do grupo antes de vender uma propriedade!"
                );
                return;
              }

              if (
                confirm(
                  `Tem certeza que deseja hipotecar "${
                    selectedPropForAction.nome
                  }" por ${formatCurrency(selectedPropForAction.hipoteca)}?`
                )
              ) {
                handleHipotecarPropriedade(selectedPropForAction.id, player.id);
              }
            }}
            className={`w-full lg:w-auto py-2 lg:px-2 bg-indigo-500 text-white rounded cursor-pointer hover:bg-indigo-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {reqLoading ? "Hipotecando..." : "Hipotecar"}
          </button>
        </nav>
      </Modal>
    </div>
  );
}
