"use client";
import ColorDropdown from "@/components/ColorDropdown";
import { useGameStore } from "@/stores/gameStore";
import {
  INITIAL_BALANCE,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PlayerColor,
} from "@/types/game";
import { ArrowLeft, GamepadIcon, Minus, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface PlayerForm {
  nome: string;
  cor: PlayerColor | null;
  saldo: number;
}

export default function NewSession() {
  const router = useRouter();
  const { createSession } = useGameStore();

  const [reqLoading, setReqLoading] = useState(false);

  const [numPlayers, setNumPlayers] = useState(2);
  const [players, setPlayers] = useState<PlayerForm[]>([
    { nome: "", cor: null, saldo: 0 },
    { nome: "", cor: null, saldo: 0 },
  ]);

  const handleNumPlayersChange = (newNum: number) => {
    if (newNum < MIN_PLAYERS || newNum > MAX_PLAYERS) return;

    setNumPlayers(newNum);

    if (newNum > players.length) {
      // Adicionar novos jogadores
      const newPlayers = [...players];
      for (let i = players.length; i < newNum; i++) {
        newPlayers.push({ nome: "", cor: null, saldo: 0});
      }
      setPlayers(newPlayers);
    } else if (newNum < players.length) {
      // Remover jogadores excedentes
      setPlayers(players.slice(0, newNum));
    }
  };

  const handlePlayerChange = (
    index: number,
    field: "nome" | "cor",
    value: string | PlayerColor
  ) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  const getAvailableColorsForPlayer = (playerIndex: number): PlayerColor[] => {
    const usedColors = players
      .filter((_, index) => index !== playerIndex)
      .map((p) => p.cor)
      .filter(Boolean) as PlayerColor[]; // <--- cast para PlayerColor[]

    const allColors: PlayerColor[] = [
      "red",
      "blue",
      "green",
      "yellow",
      "purple",
      "black",
      "orange",
      "pink",
      "emerald"
    ];

    return allColors.filter((color) => !usedColors.includes(color));
  };

  const validateForm = (): boolean => {
    // Verificar se todos os nomes estão preenchidos
    for (let i = 0; i < numPlayers; i++) {
      if (!players[i]?.nome.trim()) {
        toast.error(`Nome do jogador ${i + 1} é obrigatório`);
        return false;
      }
    }

    // Verificar se todas as cores estão selecionadas
    for (let i = 0; i < numPlayers; i++) {
      if (!players[i]?.cor) {
        toast.error(`Cor do jogador ${i + 1} é obrigatória`);
        return false;
      }
    }

    // Verificar se não há nomes duplicados
    const names = players
      .slice(0, numPlayers)
      .map((p) => p.nome.trim().toLowerCase());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      toast.error("Não pode haver nomes duplicados");
      return false;
    }

    // Verificar se não há cores duplicadas
    const colors = players
      .slice(0, numPlayers)
      .map((p) => p.cor)
      .filter(Boolean);
    const uniqueColors = new Set(colors);
    if (colors.length !== uniqueColors.size) {
      toast.error("Não pode haver cores duplicadas");
      return false;
    }

    return true;
  };

  const handleCreateSession = async () => {
    if (!validateForm()) return;

    const validPlayers = players.slice(0, numPlayers).map((p) => ({
      nome: p.nome.trim(),
      cor: p.cor!,
      saldo: 25000
    }));

    try {
      setReqLoading(true);
      const sessionId = await createSession(validPlayers); // ✅ await
      if (sessionId) {
        toast.success("Sessão criada com sucesso!");
        setReqLoading(false);
        router.push(`/game/${sessionId}`);
      } else {
        toast.error("Erro ao criar sessão");
      }
    } catch (error) {
      toast.error("Erro ao criar sessão");
      console.error("Erro ao criar sessão:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4">
            <button className="p-2 rounded-full hover:bg-white hover:shadow-md transition-all">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
          </Link>
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full mr-4">
              <GamepadIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nova Sessão</h1>
              <p className="text-gray-600">
                Configure os jogadores para começar uma nova partida
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Configuração do Número de Jogadores */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Número de Jogadores
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Escolha quantos jogadores participarão da partida
            </p>

            <div className="flex items-center justify-center space-x-4 mb-6">
              <button
                onClick={() => handleNumPlayersChange(numPlayers - 1)}
                disabled={numPlayers <= MIN_PLAYERS}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Minus className="w-5 h-5 text-gray-600" />
              </button>

              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  {numPlayers}
                </div>
                <div className="text-sm text-gray-500">
                  Mínimo: {MIN_PLAYERS} • Máximo: {MAX_PLAYERS}
                </div>
              </div>

              <button
                onClick={() => handleNumPlayersChange(numPlayers + 1)}
                disabled={numPlayers >= MAX_PLAYERS}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Configuração dos Jogadores */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Configuração dos Jogadores
            </h2>
            <p className="text-gray-600 mb-6">
              Defina o nome e a cor de cada jogador
            </p>

            <div className="space-y-6">
              {Array.from({ length: numPlayers }).map((_, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Jogador {index + 1}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={players[index]?.nome || ""}
                        onChange={(e) =>
                          handlePlayerChange(index, "nome", e.target.value)
                        }
                        className="w-full rounded-md text-zinc-800/60 border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Digite o nome do jogador"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cor
                      </label>
                      <ColorDropdown
                        value={players[index]?.cor || null}
                        onChange={(color: PlayerColor) =>
                          handlePlayerChange(index, "cor", color)
                        }
                        availableColors={getAvailableColorsForPlayer(index)}
                        placeholder="Selecione uma cor"
                      />
                    </div>
                  </div>

                  {/* Preview do jogador */}
                  {players[index]?.nome && players[index]?.cor && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full bg-${players[index].cor}-500 mr-3 flex items-center justify-center`}
                        >
                          <span className="text-white text-sm font-bold">
                            {players[index].nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {players[index].nome}
                          </p>
                          <p className="text-sm text-gray-600">
                            Saldo inicial:{" "}
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(INITIAL_BALANCE)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resumo da Sessão */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Resumo da Sessão
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Jogadores:</span>
                <span className="font-semibold">{numPlayers}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Saldo inicial:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(INITIAL_BALANCE)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Propriedades:</span>
                <span className="font-semibold">28 disponíveis</span>
              </div>
            </div>

            <button
              disabled={reqLoading}
              onClick={handleCreateSession}
              className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar Jogo
            </button>
          </div>
        </div>
      </div>
      {reqLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4 shadow-lg">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-8 w-8"></div>
            <span className="text-gray-900 font-medium">Criando sessão...</span>
          </div>
        </div>
      )}
    </div>
  );
}
