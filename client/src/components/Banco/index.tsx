"use client";

import { useEffect, useState } from "react";
import Modal from "../Modal";
import { useGameStore } from "@/stores/gameStore";
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
import { toast } from "react-toastify";

export default function Banco() {
  const {
    currentSession,
    getPropertyById,
    loadSession,
    deposito,
    saque,
    transferencia,
    aluguel,
    aluguelAcao,
    getAluguel,
  } = useGameStore();
  const [propsDetails, setPropsDetails] = useState<SessionPropriedade | null>(
    null
  );
  const [propsCache, setPropsCache] = useState<
    Record<number, Propriedade | null>
  >({});

  const [modalDeposito, setModalDeposito] = useState(false);
  const [modalSaque, setModalSaque] = useState(false);
  const [modalTransferencia, setModalTransferencia] = useState(false);
  const [modalAlguel, setModalAluguel] = useState(false);

  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);
  const [valorOperacao, setValorOperacao] = useState(0);
  const [numeroDados, setNumeroDados] = useState(0);

  const [reqLoading, setReqLoading] = useState(false);

  useEffect(() => {
    console.log(selectedPlayer1, valorOperacao);
  }, [selectedPlayer1, valorOperacao]);

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
    setValorOperacao(0);
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

  async function depositar(userId: number | undefined, valor: number) {
    if (userId == null || valor <= 0)
      return toast.error("Campos vazios ou valor inválido!");
    if (!currentSession) return;

    if (valor >= 10000000) return toast.warning("Valor muito alto!");

    try {
      setReqLoading(true);
      await deposito({ userId, sessionId: currentSession.id, valor });

      toast.success("Depósito realizado com sucesso!");
      await loadSession(currentSession.id);
      setModalDeposito(false);
      setReqLoading(false);
      resetarValores();
    } catch (error) {
      console.error("Erro no depósito!", error);
      toast.error("Erro no depósito!");
      setModalDeposito(false);
      resetarValores();
    }
  }

  async function retirar(userId: number | undefined, valor: number) {
    if (userId == null || valor <= 0)
      return toast.error("Campos vazios ou valor inválido!");
    if (!currentSession) return;

    try {
      const player = currentSession.jogadores.find((p) => p.id === userId);
      if (!player) return toast.error("Jogador não encontrado!");
      if (player?.saldo < valor) return toast.error("Saldo insuficiente!");

      setReqLoading(true);
      await saque({ userId, sessionId: currentSession.id, valor });

      toast.success("Saque realizado com sucesso!");
      await loadSession(currentSession.id);
      setModalSaque(false);
      setReqLoading(false);
      resetarValores();
    } catch (error) {
      console.error("Erro no saque!", error);
      toast.error("Erro no saque!");
      setModalSaque(false);
      resetarValores();
    }
  }

  async function transferir(
    pagador: number | undefined,
    recebedor: number | undefined,
    valor: number
  ) {
    if (
      pagador == null ||
      recebedor == null ||
      valor <= 0 ||
      pagador === 0 ||
      recebedor === 0
    )
      return toast.error("Campos vazios ou valor inválido!");
    if (!currentSession) return;

    try {
      const player = currentSession.jogadores.find((p) => p.id === pagador);
      if (!player) return toast.error("Jogador não encontrado!");
      if (player.saldo < valor) return toast.error("Saldo insuficiente!");

      setReqLoading(true);
      await transferencia({
        recebedorId: recebedor,
        pagadorId: pagador,
        sessionId: currentSession.id,
        valor,
      });

      toast.success("Transferência realizada com sucesso!");
      await loadSession(currentSession.id);
      setModalTransferencia(false);
      setReqLoading(false);
      resetarValores();
    } catch (error) {
      console.error("Erro na transferencia!", error);
      toast.error("Erro na transferência!");
      setModalTransferencia(false);
      resetarValores();
    }
  }

  async function pagarAluguel(
    pagadorId: number | undefined,
    propriedadeId: number | undefined
  ) {
    if (!pagadorId || !propriedadeId) return toast.error("Campos vazios!");
    if (!currentSession) return;

    try {
      if (propsDetails && propsCache[propsDetails.possesId]?.tipo === "ação") {
        setReqLoading(true);
        await aluguelAcao({
          sessionId: currentSession.id,
          pagadorId,
          sessionPossesId: propriedadeId,
          numDados: numeroDados,
        });
        toast.success("Aluguel pago com sucesso!");
        await loadSession(currentSession.id);
        setModalAluguel(false);
        resetarValores();
        return;
      }

      setReqLoading(true);
      await aluguel({
        sessionId: currentSession.id,
        pagadorId,
        sessionPossesId: propriedadeId,
      });
      toast.success("Aluguel pago com sucesso!");
      await loadSession(currentSession.id);
      setModalAluguel(false);
      setReqLoading(false);
      resetarValores();
    } catch (error) {
      console.error("Erro ao pagar o aluguel.", error);
      toast.error("Erro ao pagar o aluguel.");
      setModalAluguel(false);
      resetarValores();
    }
  }

  return (
    <main className="w-full px-10">
      <nav className="flex flex-col lg:flex-row items-center gap-4">
        <button
          onClick={() => setModalDeposito(true)}
          className="w-full lg:w-[150px] h-30 lg:h-[200px] p-2 border-2 border-t-5 border-green-500 hover:bg-green-400/20 rounded-md transition-colors cursor-pointer flex flex-col justify-between items-center"
        >
          <span className="text-sm font-light text-zinc-500">
            Deposite um determinado valor para o jogador selecionado
          </span>
          <span className="text-green-500 font-bold">Depositar</span>
        </button>
        <button
          onClick={() => setModalSaque(true)}
          className="w-full lg:w-[150px] h-30 lg:h-[200px] p-2 border-2 border-t-5 border-red-500 hover:bg-red-400/20 rounded-md transition-colors cursor-pointer flex flex-col justify-between items-center"
        >
          <span className="text-sm font-light text-zinc-500">
            Retire um determinado valor para o jogador selecionado
          </span>
          <span className="text-red-500 font-bold">Retirar</span>
        </button>
        <button
          onClick={() => setModalTransferencia(true)}
          className="w-full lg:w-[150px] h-30 lg:h-[200px] p-2 border-2 border-t-5 border-sky-600 hover:bg-sky-500/20 rounded-md transition-colors cursor-pointer flex flex-col justify-between items-center"
        >
          <span className="text-sm font-light text-zinc-500">
            Transfira um determinado valor de um jogador para outro
          </span>
          <span className="text-sky-600 font-bold">Transferir</span>
        </button>
        <button
          onClick={() => setModalAluguel(true)}
          className="w-full lg:w-[150px] h-30 lg:h-[200px] p-2 border-2 border-t-5 border-amber-500 hover:bg-amber-400/20 rounded-md transition-colors cursor-pointer flex flex-col justify-between items-center"
        >
          <span className="text-sm font-light text-zinc-500">
            Permita que um jogador pague o aluguel de uma determinada
            propriedade
          </span>
          <span className="text-amber-500 font-bold">Pagar Aluguel</span>
        </button>
      </nav>

      <Modal
        size="md"
        title="Deposito"
        isOpen={modalDeposito}
        onClose={() => setModalDeposito(false)}
      >
        <h1 className="mb-3">
          Escolha o Jogador que vai realizar a transação:
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
              ))
              .sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        <h1 className="mt-4 mb-1">Digite o valor que ele irá receber:</h1>
        <input
          type="number"
          value={valorOperacao}
          onChange={(e) => setValorOperacao(Number(e.target.value))}
          className="bg-zinc-400/20 py-1 px-2 rounded"
        />

        <div className="w-full flex justify-center items-center">
          <button
            disabled={reqLoading || !selectedPlayer1 || valorOperacao <= 0}
            onClick={() => depositar(selectedPlayer1?.id, valorOperacao)}
            className="px-16 py-1 mt-5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </Modal>

      <Modal
        size="md"
        title="Saque"
        isOpen={modalSaque}
        onClose={() => setModalSaque(false)}
      >
        <h1 className="mb-3">
          Escolha o Jogador que vai realizar a transação:
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
              ))
              .sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        <h1 className="mt-4 mb-1">Digite o valor que ele irá pagar:</h1>
        <input
          type="number"
          value={valorOperacao}
          onChange={(e) => setValorOperacao(Number(e.target.value))}
          className="bg-zinc-400/20 py-1 px-2 rounded"
        />

        <div className="w-full flex justify-center items-center">
          <button
            disabled={reqLoading || !selectedPlayer1 || valorOperacao <= 0}
            onClick={() => retirar(selectedPlayer1?.id, valorOperacao)}
            className="px-16 py-1 mt-5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </Modal>

      <Modal
        size="md"
        title="Transferencia"
        isOpen={modalTransferencia}
        onClose={() => setModalTransferencia(false)}
      >
        <h1 className="mb-1">Esolha o jogador que vai pagar:</h1>
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
              ))
              .sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        <h1 className="mt-4 mb-1">Esolha o jogador que vai receber:</h1>
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
              ))
              .sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        <h1 className="mt-4 mb-1">Digite o valor que ele irá pagar:</h1>
        <input
          type="number"
          value={valorOperacao}
          onChange={(e) => setValorOperacao(Number(e.target.value))}
          className="bg-zinc-400/20 py-1 px-2 rounded"
        />

        <div className="w-full flex justify-center items-center">
          <button
            disabled={
              reqLoading ||
              !selectedPlayer1 ||
              !selectedPlayer2 ||
              valorOperacao <= 0
            }
            onClick={() =>
              transferir(
                selectedPlayer1?.id,
                selectedPlayer2?.id,
                valorOperacao
              )
            }
            className="px-16 py-1 mt-5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </Modal>

      <Modal
        size="md"
        title="Pagar aluguel"
        isOpen={modalAlguel}
        onClose={() => {
          setModalAluguel(false);
          resetarValores();
          setPropsDetails(null);
        }}
      >
        <h1 className="mb-2">Escolha o jogador que vai pagar:</h1>

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
              ))
              .sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        <h1 className="mt-4 mb-2">
          Selecione a propriedade que o jogador caiu:
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
              .map((poss) => {
                const propData = propsCache[poss.possesId];
                const label = propData?.nome ?? `Carregando...`;
                return (
                  <SelectItem key={poss.id} value={String(poss.id)}>
                    {label}
                  </SelectItem>
                );
              })
              .sort((a, b) => a.props.children.localeCompare(b.props.children))}
          </SelectContent>
        </Select>

        {/* Verifica se é Ação ou não */}
        {propsDetails && propsCache[propsDetails.possesId]?.tipo === "ação" && (
          <div>
            <h1 className="mt-4 mb-1">
              Digite o número que o jogador tirou nos dados:
            </h1>
            <input
              type="number"
              value={numeroDados}
              onChange={(e) => setNumeroDados(Number(e.target.value))}
              className="bg-zinc-400/20 py-1 px-2 rounded"
            />
          </div>
        )}

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
              pagarAluguel(selectedPlayer1?.id, propsDetails?.id);
            }}
            disabled={reqLoading || !selectedPlayer1 || !propsDetails}
            className="px-16 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </Modal>
    </main>
  );
}
