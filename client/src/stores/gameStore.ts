import {
  buyHouseApi,
  buyPropApi,
  createSessionApi,
  editPlayerApi,
  endSessionApi,
  getPlayerByIdApi,
  getPropByIdApi,
  getSessionsApi,
  loadSessionApi,
  removePlayerApi,
  sellHouseApi,
  depositoApi,
  saqueApi,
  transferenciaApi,
  aluguelApi,
  trocaPropriedadeApi,
  sellPropriedadeApi,
  receberDeTodosApi,
  aluguelAcaoApi,
  hipotecarPropApi,
} from "@/services/api";
import {
  GameSession,
  Player,
  PLAYER_COLORS,
  PlayerColor,
  Propriedade,
} from "@/types/game";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { create } from "zustand";

interface GameStore {
  sessions: GameSession[];
  currentSession: GameSession | null;
  loading: boolean;
  networkError: boolean; // 1. Novo estado para controlar o erro de rede
  error: string | null;
  propertiesCache: Record<number, Propriedade>;

  createSession: (
    players: { nome: string; cor: PlayerColor }[]
  ) => Promise<number | undefined>;
  getSessions: () => Promise<void>;
  loadSession: (sessionId: number) => Promise<void>;
  endSession: (sessionId: number) => Promise<void>;

  getPlayerById: (playerId: number) => Promise<Player | undefined>;
  editPlayer: (
    playerId: number,
    nome: string,
    cor: PlayerColor
  ) => Promise<void>;
  removePlayer: (playerId: number) => Promise<void>;

  getPropertyById: (propriedadeId: number) => Promise<Propriedade | null>;
  buyProperty: (
    propriedadeId: number,
    sessionId: number,
    userId: number
  ) => Promise<void>;
  buyHouse: (params: {
    userId: number;
    sessionId: number;
    propriedadeId: number;
  }) => Promise<void>;
  sellHouse: (params: {
    userId: number;
    sessionId: number;
    propriedadeId: number;
  }) => Promise<void>;
  sellPropriedade: (
    propriedadeId: number,
    sessionId: number,
    userId: number
  ) => Promise<void>;
  hipotecarProp: (
    propriedadeId: number,
    sessionId: number,
    userId: number
  ) => Promise<void>;

  getAvailableColors: (excludePlayerId?: number) => PlayerColor[];
  getAluguel: (propriedade: Propriedade, casas: number) => number;

  deposito: (params: {
    userId: number;
    sessionId: number;
    valor: number;
  }) => Promise<void>;
  saque: (params: {
    userId: number;
    sessionId: number;
    valor: number;
  }) => Promise<void>;
  transferencia: (params: {
    pagadorId: number;
    recebedorId: number;
    sessionId: number;
    valor: number;
  }) => Promise<void>;
  aluguel: (params: {
    sessionId: number;
    pagadorId: number;
    sessionPossesId: number;
  }) => Promise<void>;
  aluguelAcao: (params: {
    sessionId: number;
    pagadorId: number;
    sessionPossesId: number;
    numDados: number;
  }) => Promise<void>;

  trocaPropriedades: (params: {
    propriedadeId: number;
    sessionId: number;
    userId: number;
  }) => Promise<void>;

  receberDeTodos: (params: {
    sessionId: number;
    userId: number;
  }) => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  loading: false,
  networkError: false, // 2. Inicializa como falso
  error: null,
  propertiesCache: {},

  createSession: async (players) => {
    set({ loading: true, error: null });
    try {
      const newSession = await createSessionApi(players);
      if (!newSession) return;

      set((state) => ({
        sessions: [...state.sessions, newSession],
        currentSession: newSession,
        propertiesCache: {}, // Limpa o cache para a nova sessão
        loading: false,
      }));
      return newSession.id;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      } else {
        set({ error: "Erro desconhecido", loading: false });
      }
    }
  },

  getSessions: async () => {
    set({ loading: true, error: null });
    try {
      const sessions = await getSessionsApi();
      set({ sessions, loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      } else {
        set({ error: "Erro desconhecido", loading: false });
      }
    }
  },

  loadSession: async (sessionId) => {
    set({ loading: true, error: null });
    const { networkError } = get();

    try {
      const session = await loadSessionApi(sessionId);
      // Não limpa o cache de propriedades aqui. Apenas atualiza a sessão.
      // O cache só será limpo se a sessão carregada for diferente da atual.
      if (get().currentSession?.id !== session.id) {
        set({
          currentSession: session,
          loading: false,
          propertiesCache: {},
          networkError: false,
        });
      } else {
        set({ currentSession: session, loading: false, networkError: false });
      }
      // 3. Se a chamada for bem-sucedida, reseta o estado de erro
      if (networkError) set({ networkError: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        // 4. Só mostra o toast se ainda não houver um erro de rede ativo
        if (!networkError) {
          toast.error("Erro de conexão. Tentando reconectar...");
        }
        set({ error: err.message, loading: false, networkError: true });
      } else {
        set({ error: "Erro desconhecido", loading: false });
      }
    }
  },

  endSession: async (sessionId: number) => {
    set({ loading: true, error: null });
    try {
      await endSessionApi(sessionId);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        currentSession: null,
        loading: false,
      }));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      } else {
        set({ error: "Erro desconhecido", loading: false });
      }
    }
  },

  getPlayerById: async (playerId: number) => {
    set({ loading: true, error: null });
    try {
      const player = await getPlayerByIdApi(playerId);
      return player;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  editPlayer: async (playerId: number, nome: string, cor: PlayerColor) => {
    set({ loading: true, error: null });
    try {
      await editPlayerApi(playerId, nome, cor);

      // Atualiza o jogador no estado local
      set((state) => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              jogadores: state.currentSession.jogadores.map((jogador) =>
                jogador.id === playerId
                  ? { ...jogador, nome, cor } // aplica as novas infos
                  : jogador
              ),
            }
          : state.currentSession,
        loading: false,
      }));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      } else {
        set({ error: "Erro desconhecido", loading: false });
      }
    }
  },

  removePlayer: async (playerId: number) => {
    set({ loading: true, error: null });
    try {
      // 🔹 Chamada da API para remover o jogador do backend
      await removePlayerApi(playerId);

      // 🔹 Atualiza o estado local (remove o jogador da sessão atual)
      set((state) => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              jogadores: state.currentSession.jogadores.filter(
                (jogador) => jogador.id !== playerId
              ),
            }
          : state.currentSession,
        loading: false,
      }));
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      } else {
        set({ error: "Erro desconhecido", loading: false });
      }
    }
  },

  getPropertyById: async (propriedadeId: number) => {
    const { propertiesCache } = get();
    // 1. Verifica se a propriedade já está no cache
    if (propertiesCache[propriedadeId]) {
      return propertiesCache[propriedadeId];
    }

    // 2. Se não estiver, busca na API
    try {
      set({ loading: true, error: null });
      const propriedade = await getPropByIdApi(propriedadeId);
      if (propriedade) {
        // 3. Armazena no cache e retorna
        set((state) => ({
          propertiesCache: {
            ...state.propertiesCache,
            [propriedadeId]: propriedade,
          },
          loading: false,
        }));
      }
      return propriedade;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
      }
      set({ error: (err as Error).message, loading: false });
      return null;
    }
  },

  buyProperty: async (
    propriedadeId: number,
    sessionId: number,
    userId: number
  ) => {
    set({ loading: true, error: null });
    try {
      await buyPropApi(propriedadeId, sessionId, userId);

      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  sellPropriedade: async (
    propriedadeId: number,
    sessionId: number,
    userId: number
  ) => {
    set({ loading: true, error: null });
    try {
      await sellPropriedadeApi(propriedadeId, sessionId, userId);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  hipotecarProp: async (
    propriedadeId: number,
    sessionId: number,
    userId: number
  ) => {
    set({ loading: true, error: null });
    try {
      await hipotecarPropApi(propriedadeId, sessionId, userId);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  buyHouse: async ({ userId, sessionId, propriedadeId }) => {
    set({ loading: true, error: null });
    try {
      await buyHouseApi(userId, sessionId, propriedadeId);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  sellHouse: async ({ userId, sessionId, propriedadeId }) => {
    set({ loading: true, error: null });
    try {
      await sellHouseApi(userId, sessionId, propriedadeId);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  getAvailableColors: (excludePlayerId?: number): PlayerColor[] => {
    const { currentSession } = get();
    // retorna todas as cores se não tiver sessão
    const all = PLAYER_COLORS.map((c) => c.value);

    if (!currentSession) return all;

    const usedColors = currentSession.jogadores
      .filter((j) => j.id !== excludePlayerId)
      .map((j) => j.cor as PlayerColor);

    return all.filter((color) => !usedColors.includes(color));
  },
  getAluguel: (propriedade: Propriedade, casas: number): number => {
    if (casas === 0) return propriedade.aluguel_base;
    if (casas === 1) return propriedade.aluguel_1c;
    if (casas === 2) return propriedade.aluguel_2c;
    if (casas === 3) return propriedade.aluguel_3c;
    if (casas === 4) return propriedade.aluguel_4c;
    return propriedade.aluguel_hotel;
  },

  deposito: async ({ userId, sessionId, valor }) => {
    set({ loading: true, error: null });
    try {
      await depositoApi(userId, sessionId, valor);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  saque: async ({ userId, sessionId, valor }) => {
    set({ loading: true, error: null });
    try {
      await saqueApi(userId, sessionId, valor);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  transferencia: async ({ pagadorId, recebedorId, sessionId, valor }) => {
    set({ loading: true, error: null });
    try {
      await transferenciaApi(pagadorId, recebedorId, sessionId, valor);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  aluguel: async ({ sessionId, pagadorId, sessionPossesId }) => {
    set({ loading: true, error: null });
    try {
      await aluguelApi(sessionId, pagadorId, sessionPossesId);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  aluguelAcao: async ({ sessionId, pagadorId, sessionPossesId, numDados }) => {
    set({ loading: true, error: null });
    try {
      await aluguelAcaoApi(sessionId, pagadorId, sessionPossesId, numDados);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  trocaPropriedades: async ({ propriedadeId, sessionId, userId }) => {
    set({ loading: true, error: null });
    try {
      await trocaPropriedadeApi(propriedadeId, sessionId, userId);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },

  receberDeTodos: async ({ sessionId, userId }) => {
    set({ loading: true, error: null });
    try {
      await receberDeTodosApi(sessionId, userId);
      await get().loadSession(sessionId);
      set({ loading: false });
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.message);
        set({ error: err.message, loading: false });
      }
    }
  },
}));
