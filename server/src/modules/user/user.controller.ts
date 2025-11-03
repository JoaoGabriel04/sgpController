import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

const userController = {
  getById: async (req: Request, res: Response) => {
    const { playerId } = req.params;

    try {
      const player = await prisma.sessionPlayer.findUnique({
        where: { id: parseInt(playerId) },
        include: {
          sessionPosses: true,
        },
      });

      res.status(200).json(player);
    } catch (error) {
      console.error("Erro ao buscar jogador:", error);
      res.status(500).json({ message: "Erro ao buscar jogador" });
    }
  },

  editPlayer: async (req: Request, res: Response) => {
    const { playerId } = req.params;
    const { nome, cor } = req.body;

    try {
      const player = await prisma.sessionPlayer.update({
        where: { id: parseInt(playerId) },
        data: {
          nome,
          cor,
        },
      });

      res.status(200).json(player);
    } catch (error) {
      console.error("Erro ao buscar jogador:", error);
      res.status(500).json({ message: "Erro ao buscar jogador" });
    }
  },

  removePlayer: async (req: Request, res: Response) => {
    const { playerId } = req.params;

    try {

      const selectPlayer = await prisma.sessionPlayer.findUnique({
        where: { id: parseInt(playerId) },
        include: {
          sessionPosses: true,
        },
      });

      if (!selectPlayer) return res.status(404).json({ message: "Jogador não encontrado" })
      
      if (selectPlayer.sessionPosses.length > 0) {
        // Excluir posses associadas ao jogador
        await prisma.sessionPosses.updateMany({
          where: { playerId: selectPlayer.id },
          data: {
            playerId: null,
            casas: 0,
          },
        });
      }

      const player = await prisma.sessionPlayer.delete({
        where: { id: parseInt(playerId) },
        include: {
          session: true,
          sessionPosses: true,
        },
      });

      res.status(200).json({ message: "Jogador removido com sucesso", player });
    } catch (error) {
      console.error("Erro ao buscar jogador:", error);
      res.status(500).json({ message: "Erro ao buscar jogador" });
    }
  },
};

export default userController;
