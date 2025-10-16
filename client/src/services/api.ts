import { GameSession, Player, PlayerColor } from "@/types/game";
import axios from "axios";

const baseURL = "http://localhost:7000/api"

const api = axios.create({
  baseURL: baseURL
})

export const createSessionApi = (jogadores: { nome: string; cor: PlayerColor }[]): Promise<GameSession> =>
  api.post("/sessions/new-session", { jogadores }).then(res => res.data as GameSession);

export const getSessionsApi = () => 
  api.get("/sessions/all-sessions").then(res => res.data as GameSession[]);

export const loadSessionApi = (sessionId: number) => 
  api.post(`/sessions/load-session/${sessionId}`).then(res => res.data as GameSession);

export const endSessionApi = (sessionId: number) => 
  api.delete(`/sessions/delete/${sessionId}`).then(res => res.data as GameSession)

export const getPlayerByIdApi = (playerId: number) => 
  api.get(`/user/getById/${playerId}`).then(res => res.data as Player)

export const getPropByIdApi = (propriedadeId: number) => 
  api.get(`/propriedades/getById/${propriedadeId}`).then(res => res.data)

export const buyPropApi = (propriedadeId: number, sessionId: number, userId: number) => 
  api.put("/propriedades/buyProp", { propriedadeId, sessionId, userId }).then(res => res.data)

export const removePlayerApi = (playerId: number) => 
  api.delete(`/user/removePlayer/${playerId}`).then(res => res.data)

export const editPlayerApi = (playerId: number, nome: string, cor: PlayerColor) => 
  api.put(`/user/editPlayer/${playerId}`, {nome, cor}).then(res => res.data)

export const buyHouseApi = (userId: number, sessionId: number, propriedadeId: number) => 
  api.put("/propriedades/buyHouse", {userId, sessionId, propriedadeId}).then(res => res.data)

export const sellHouseApi = (userId: number, sessionId: number, propriedadeId: number) => 
  api.put("/propriedades/sellHouse", {userId, sessionId, propriedadeId}).then(res => res.data)

export const sellPropriedadeApi = (propriedadeId: number, sessionId: number, userId: number) => 
  api.put("/propriedades/sellProp", {propriedadeId, sessionId, userId}).then(res => res.data)

export const hipotecarPropApi = (propriedadeId: number, sessionId: number, userId: number) => 
  api.put("/propriedades/hipotecar", {propriedadeId, sessionId, userId}).then(res => res.data)

export const getHistoricoApi = (sessionId: number) => 
  api.get(`/historico/all/${sessionId}`).then(res => res.data)

export const depositoApi = (userId: number, sessionId: number, valor: number) => 
  api.put("/banco/deposito", {userId, sessionId, valor}).then(res => res.data)

export const saqueApi = (userId: number, sessionId: number, valor: number) => 
  api.put("/banco/saque", {userId, sessionId, valor}).then(res => res.data)

export const transferenciaApi = (pagadorId: number, recebedorId: number, sessionId: number, valor: number) => 
  api.put("/banco/transferencia", {pagadorId, recebedorId, sessionId, valor}).then(res => res.data)

export const aluguelApi = (sessionId: number, pagadorId: number, sessionPossesId: number) => 
  api.put("/banco/aluguel", {sessionId, pagadorId, sessionPossesId}).then(res => res.data)

export const aluguelAcaoApi = (sessionId: number, pagadorId: number, sessionPossesId: number, numDados: number) => 
  api.put("/banco/aluguelAcao", {sessionId, pagadorId, sessionPossesId, numDados}).then(res => res.data)

export const trocaPropriedadeApi = (propriedadeId: number, sessionId: number, userId: number) => 
  api.put("/propriedades/trocar", {propriedadeId, sessionId, userId}).then(res => res.data)

export const receberDeTodosApi = (sessionId: number, userId: number) => 
  api.put("/banco/receberDeTodos", {sessionId, userId}).then(res => res.data)

export default api;