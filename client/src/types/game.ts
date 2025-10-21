// ========================
// Tipos base do jogo
// ========================

export interface Propriedade {
  id: number;
  nome: string;
  grupo_cor: CorPropriedade;
  tipo: 'normal' | 'ação';
  custo_compra: number;
  aluguel_base: number;
  aluguel_1c: number;
  aluguel_2c: number;
  aluguel_3c: number;
  aluguel_4c: number;
  aluguel_hotel: number;
  custo_casa: number;
  hipoteca: number;
}

// ========================
// Estado da sessão
// ========================

export interface SessionPropriedade {
  id: number;
  sessionId: number;
  possesId: number;
  playerId: number | null; // corresponde ao backend
  casas: number;
  hipotecada: boolean;
}

// ========================
// Jogador na sessão
// ========================

export interface Player {
  id: number;                  // id da sessão
  nome: string;
  cor: PlayerColor;
  saldo: number;
  posses: SessionPropriedade[]; // posses/ações do jogador
}

// ========================
// Transações
// ========================

export interface Transacao {
  id: number;
  data: Date;
  tipo: string;
  detalhes: string;
  sessionId?: string;
}

// ========================
// Sessão do jogo
// ========================

export interface GameSession {
  id: number;
  nome?: string;
  jogadores: Player[];
  sessionPosses: SessionPropriedade[];
  historico: Transacao[];
  dataInicio: number;
}

// ========================
// Cores dos jogadores
// ========================

export type PlayerColor = 
  | 'red' 
  | 'blue' 
  | 'green' 
  | 'yellow' 
  | 'purple' 
  | 'black'
  | 'orange'
  | 'pink'
  | 'emerald'

export const PLAYER_COLORS: { value: PlayerColor; label: string; bg: string; border: string; text: string }[] = [
  { value: 'red', label: 'Vermelho', bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500' },
  { value: 'blue', label: 'Azul', bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
  { value: 'green', label: 'Verde', bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' },
  { value: 'yellow', label: 'Amarelo', bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500' },
  { value: 'purple', label: 'Roxo', bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500' },
  { value: 'black', label: 'Preto', bg: 'bg-black', border: 'border-black', text: 'text-black' },
  { value: 'orange', label: 'Laranja', bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500' },
  { value: 'pink', label: 'Rosa', bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-500' },
  { value: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500' },
];

// ========================
// Cores das propriedades
// ========================

export type CorPropriedade =
  | 'Verde-Claro'
  | 'Verde-Escuro'
  | 'Vermelho'
  | 'Azul'
  | 'Amarelo'
  | 'Laranja'
  | 'Rosa'
  | 'Roxo'
  | 'Preto'

export const PROPERTY_COLORS: { value: CorPropriedade; text: string; label: string; bg: string, border: string; total: number }[] = [
  { value: 'Verde-Claro', text: 'text-lime-500', label: 'Verde-Claro', bg: 'bg-lime-500/20', border: 'border-lime-500', total: 3 },
  { value: 'Verde-Escuro', text: 'text-green-700', label: 'Verde-Escuro', bg: 'bg-green-700/20', border: 'border-green-700', total: 3},
  { value: 'Vermelho', text: 'text-red-600', label: 'Vermelho', bg: 'bg-red-600/20', border: 'border-red-600', total: 3},
  { value: 'Azul', text: 'text-blue-600', label: 'Azul', bg: 'bg-blue-600/20', border: 'border-blue-600', total: 3},
  { value: 'Amarelo', text: 'text-amber-300', label: 'Amarelo', bg: 'bg-amber-300/20', border: 'border-amber-300', total: 3},
  { value: 'Laranja', text: 'text-orange-600', label: 'Laranja', bg: 'bg-orange-600/20', border: 'border-orange-600', total: 3},
  { value: 'Rosa', text: 'text-pink-600', label: 'Rosa', bg: 'bg-pink-600/20', border: 'border-pink-600', total: 2},
  { value: 'Roxo', text: "text-purple-700", label: 'Roxo', bg: 'bg-purple-700/20', border: 'border-purple-700', total: 2},
  { value: 'Preto', text: 'text-zinc-800', label: 'Preto', bg: 'bg-zinc-800/20', border: 'border-zinc-800', total: 6},
];

// ========================
// Configurações do jogo
// ========================

export const INITIAL_BALANCE = 25000;
export const MAX_PLAYERS = 6;
export const MIN_PLAYERS = 2;