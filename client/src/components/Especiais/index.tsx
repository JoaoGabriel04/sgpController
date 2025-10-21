"use client";

import { useEffect, useState } from "react";
import Modal from "../Modal";
import {
  Player,
  PROPERTY_COLORS,
  Propriedade,
  SessionPropriedade,
} from "@/types/game";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useGameStore } from "@/stores/gameStore";
import { toast } from "react-toastify";

export default function Especiais() {
  const {
    currentSession,
    loadSession,
    trocaPropriedades,
    getAluguel,
    getPropertyById,
    receberDeTodos,
  } = useGameStore();

  const [modalTroca, setModalTroca] = useState(false);
  const [modalReceber, setModalReceber] = useState(false);

  const [reqLoading, setReqLoading] = useState(false);

  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);

  const [propsDetails, setPropsDetails] = useState<SessionPropriedade | null>(
    null
  );
  const [propsCache, setPropsCache] = useState<
    Record<number, Propriedade | null>
  >({});

  useEffect(() => {
    let mounted = true;
    async function loadProps() {
      if (!currentSession) return;
      const ids = Array.from(
        new Set(currentSession.sessionPosses.map((p) => p.possesId))
      );
      const cache: Record<number, Propriedade | null> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const prop = await getPropertyById(id);
            if (mounted) cache[id] = prop ?? null;
          } catch {
            if (mounted) cache[id] = null;
          }
        })
      );
      if (mounted) setPropsCache((prev) => ({ ...prev, ...cache }));
    }
    loadProps();
    return () => {
      mounted = false;
    };
  }, [currentSession, getPropertyById]);

  function resetarValores() {
    setSelectedPlayer1(null);
    setSelectedPlayer2(null);
  }

  function getBorderClass(grupo_cor?: string) {
    if (!grupo_cor) return "border-gray-300 border-2";
    const colorInfo = PROPERTY_COLORS.find((c) => c.value === grupo_cor);
    if (!colorInfo) return "border-gray-300 border-2";
    // usa border-t-4 para destaque superior (pode ajustar)
    return `${colorInfo.border} border-t-4 border-2`;
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  async function trocarPropriedade(
    userId: number | undefined,
    propriedadeId: number | undefined
  ) {
    if (userId == null || propriedadeId == null || userId === 0) return toast.warning("Campos Vazios!");
    if (!currentSession) return;

    try {
      const propSelected = await currentSession.sessionPosses.find(
        (p) => p.possesId === propriedadeId
      );

      if (propSelected?.casas)
        return toast.warning("Essa propriedade ainda possui casas!");

      setReqLoading(true);
      await trocaPropriedades({
        userId,
        sessionId: currentSession.id,
        propriedadeId,
      });

      toast.success("Transferência realizada com sucesso!");
      await loadSession(currentSession.id);
      setModalTroca(false);
      setReqLoading(false);
      resetarValores();
    } catch (error) {
      console.error("Erro ao trocar propriedade!", error);
      toast.error("Erro ao trocar propriedade!");
      setModalTroca(false);
    }
  }

  async function handleReceberDeTodos(userId: number | undefined) {
    
    if (userId == null) return toast.warning("Campos Vazios!");
    if (!currentSession) return;

    currentSession.jogadores.filter((p)=> p.id !== userId).map((player)=>{
      if (player.saldo < 500) return toast.error(`O Jogador ${player.nome} não tem saldo suficiente!`)
    })

    try {
      setReqLoading(true);
      await receberDeTodos({
        userId,
        sessionId: currentSession.id
      });

      toast.success("Transferências realizadas com sucesso!");
      await loadSession(currentSession.id);
      setModalReceber(false);
      setReqLoading(false);
      resetarValores();
    }catch (error){
      console.error("Erro ao trocar propriedade!", error);
      toast.error("Erro ao trocar propriedade!");
      setModalTroca(false);
    }

  }

  return (
    <main className="w-full px-10">
      <nav className="flex flex-col lg:flex-row items-center gap-4">
        <button
          onClick={() => setModalTroca(true)}
          className="w-full lg:w-[150px] h-30 lg:h-[200px] p-2 border-2 border-t-5 border-indigo-500 hover:bg-indigo-400/20 rounded-md transition-colors cursor-pointer flex flex-col justify-between items-center"
        >
          <span className="text-sm font-light text-zinc-500">
            Faça trocas de propriedades entre jogadores
          </span>
          <span className="text-indigo-500 font-bold">Trocar</span>
        </button>

        <button
          onClick={() => setModalReceber(true)}
          className="w-full lg:w-[150px] h-30 lg:h-[200px] p-2 border-2 border-t-5 border-fuchsia-500 hover:bg-fuchsia-400/20 rounded-md transition-colors cursor-pointer flex flex-col justify-between items-center"
        >
          <span className="text-sm font-light text-zinc-500">
            Um jogador receberá R$ 500,00 de todos os jogadores
          </span>
          <span className="text-fuchsia-500 font-bold">Receber</span>
        </button>
      </nav>

      <Modal
        size="md"
        title="Troca de Propriedades"
        isOpen={modalTroca}
        onClose={() => setModalTroca(false)}
      >
        <h1 className="mb-1">
          Selecione o jogador que vai receber a propriedade:
        </h1>
        <Select
          onValueChange={(value) => {
            const player = currentSession?.jogadores.find(
              (p) => p.id === Number(value)
            );
            setSelectedPlayer1(player ?? null);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o Jogador!" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Selecione</SelectItem>
            {currentSession?.jogadores
              .filter((p) => p.id !== selectedPlayer2?.id)
              .map((player) => (
                <SelectItem key={player.id} value={String(player.id)}>
                  {player.nome}
                </SelectItem>
              )).sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        <h1 className="mt-4 mb-1">
          Selecione o jogador que vai entregar a propriedade:
        </h1>
        <Select
          onValueChange={(value) => {
            const player = currentSession?.jogadores.find(
              (p) => p.id === Number(value)
            );
            setSelectedPlayer2(player ?? null);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o Jogador!" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Selecione</SelectItem>
            {currentSession?.jogadores
              .filter((p) => p.id !== selectedPlayer1?.id)
              .map((player) => (
                <SelectItem key={player.id} value={String(player.id)}>
                  {player.nome}
                </SelectItem>
              )).sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        <h1 className="mt-4 mb-2">
          Selecione a propriedade que o jogador quer trocar:
        </h1>
        <Select
          onValueChange={(value) => {
            const propriedade = currentSession?.sessionPosses.find(
              (p) => p.id === Number(value)
            );
            setPropsDetails(propriedade ?? null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a propriedade!" />
          </SelectTrigger>
          <SelectContent>
            {currentSession?.sessionPosses
              .filter((p) => !!p.playerId)
              .filter((p) => p.playerId !== selectedPlayer1?.id)
              .filter((p) => p.playerId === selectedPlayer2?.id)
              .map((poss) => {
                const propData = propsCache[poss.possesId];
                const label = propData?.nome ?? `Carregando...`;
                return (
                  <SelectItem key={poss.id} value={String(poss.id)}>
                    {label}
                  </SelectItem>
                );
              }).sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        {/* Card com informações da propriedade selecionada */}
        {propsDetails &&
          (() => {
            const propData = propsCache[propsDetails.possesId];
            const casas = propsDetails.casas ?? 0;
            const aluguelAtual = propData ? getAluguel(propData, casas) : 0;
            const borderClass = getBorderClass(propData?.grupo_cor);

            return (
              <div className={`mt-4 p-3 rounded-md bg-gray-50 ${borderClass}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {propData?.nome ??
                        `Propriedade #${propsDetails.possesId}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Cor: {propData?.grupo_cor ?? "—"}
                    </p>
                    <p className="text-sm text-gray-600">Casas: {casas}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Aluguel atual</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(aluguelAtual)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        <div className="w-full flex justify-center items-center mt-4">
          <button
            onClick={() => {
              trocarPropriedade(selectedPlayer1?.id, propsDetails?.possesId);
            }}
            disabled={reqLoading || !selectedPlayer1 || !propsDetails}
            className="px-16 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </Modal>

      <Modal
        size="md"
        title="Receber de Todos"
        isOpen={modalReceber}
        onClose={() => setModalReceber(false)}
      >
        <h1 className="mb-1">
          Selecione o jogador que vai receber o dinheiro:
        </h1>
        <Select
          onValueChange={(value) => {
            const player = currentSession?.jogadores.find(
              (p) => p.id === Number(value)
            );
            setSelectedPlayer1(player ?? null);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o Jogador!" />
          </SelectTrigger>
          <SelectContent>
            {currentSession?.jogadores
              .map((player) => (
                <SelectItem key={player.id} value={String(player.id)}>
                  {player.nome}
                </SelectItem>
              )).sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        <div className="w-full flex justify-center items-center mt-4">
          <button
            onClick={() => {
              handleReceberDeTodos(selectedPlayer1?.id);
            }}
            disabled={reqLoading || !selectedPlayer1}
            className="px-16 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </Modal>
    </main>
  );
}
