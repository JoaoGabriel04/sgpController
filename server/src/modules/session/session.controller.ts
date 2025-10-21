import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

const sessionController = {
  test: (req: Request, res: Response) => {
    res.send("Hello World!");
  },

  //===========================================
  // Criar uma Nova Sessão
  //===========================================

  new_session: async (req: Request, res: Response) => {
    try {
      const { nome, jogadores } = req.body;

      if (!jogadores || !Array.isArray(jogadores) || jogadores.length === 0) {
        return res
          .status(400)
          .json({ error: "É necessário enviar pelo menos um jogador." });
      }

      // 1️⃣ Criar a sessão
      const novaSessao = await prisma.session.create({
        data: { nome },
      });

      // 2️⃣ Criar os jogadores fictícios na sessão
      const sessionPlayers = await Promise.all(
        jogadores.map((j: { nome: string; cor: string; saldo: number }) =>
          prisma.sessionPlayer.create({
            data: {
              nome: j.nome,
              cor: j.cor,
              saldo: j.saldo,
              sessionId: novaSessao.id,
            },
          })
        )
      );

      // 3️⃣ Buscar todas as posses base do jogo
      const possesBase = await prisma.posses.findMany();

      // 4️⃣ Criar SessionPosses para esta sessão, inicialmente neutras
      const sessionPossesData = possesBase.map((p) => ({
        sessionId: novaSessao.id,
        possesId: p.id,
        playerId: null, // sem dono inicialmente
        casas: 0, // nenhuma casa
        hipotecada: false,
      }));

      await prisma.sessionPosses.createMany({
        data: sessionPossesData,
      });

      // 5️⃣ Retornar a sessão criada, jogadores e posses
      const sessionComDados = await prisma.session.findUnique({
        where: { id: novaSessao.id },
        include: {
          jogadores: true,
          sessionPosses: true,
        },
      });

      return res.status(201).json(sessionComDados);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao criar a sessão." });
    }
  },

  //===========================================
  // Carregar todas as sessões
  //===========================================

  get_sessions: async (req: Request, res: Response) => {
    try {
      const sessions = await prisma.session.findMany({
        include: {
          jogadores: true,
          sessionPosses: {
            include: {
              posses: {
                // relação de SessionPosses → Posses
                include: {
                  propriedade: true, // detalhe da propriedade base
                },
              },
              player: true, // jogador fictício dono da posse (se existir)
            },
          },
          historico: true,
        },
        orderBy: { id: "asc" },
      });

      res.json(sessions);
    } catch (error) {
      console.error("Erro ao buscar sessões:", error);
      res.status(500).json({ message: "Erro ao buscar sessões" });
    }
  },

  //===========================================
  // Carregar uma Sessão
  //===========================================

  load_session: async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    try {
      const session = await prisma.session.findUnique({
        where: { id: parseInt(sessionId) },
        include: {
          jogadores: true,
          sessionPosses: true,
          historico: true
        }
      });

      res.status(200).json(session);
    } catch (error) {
      console.error("Erro ao buscar sessão:", error);
      res.status(500).json({ message: "Erro ao buscar sessão" });
    }
  },

  //===========================================
  // Encerrar e Deletar uma Sessão
  //===========================================

  end_session: async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const sessionIdNum = Number(sessionId);
    if (isNaN(sessionIdNum)) {
      return res.status(400).json({ message: "ID de sessão inválido" });
    }

    try {
      // Apaga entidades relacionadas primeiro
      await prisma.sessionPlayer.deleteMany({
        where: { sessionId: sessionIdNum },
      });

      await prisma.sessionPosses.deleteMany({
        where: { sessionId: sessionIdNum },
      });

      await prisma.historico.deleteMany({
        where: { sessionId: sessionIdNum },
      });

      // Por fim, apaga a sessão
      await prisma.session.delete({
        where: { id: sessionIdNum },
      });

      res
        .status(200)
        .json({ message: "Sessão encerrada e removida com sucesso" });
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
      res.status(500).json({ message: "Erro ao encerrar sessão" });
    }
  },
};

export default sessionController;
