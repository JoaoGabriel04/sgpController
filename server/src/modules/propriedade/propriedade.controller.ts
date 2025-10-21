import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

const propsController = {
  getPropById: async (req: Request, res: Response) => {
    const { propriedadeId } = req.params;

    try {
      const propriedade = await prisma.propriedade.findUnique({
        where: { id: parseInt(propriedadeId) },
      });

      res.status(200).json(propriedade);
    } catch (error) {
      console.log("Erro ao buscar propriedade: ", error);
      res.status(500).json({ message: "Erro ao buscar propriedade" });
    }
  },

  buyProp: async (req: Request, res: Response) => {
    const { propriedadeId, sessionId, userId } = req.body;

    try {
      const player = await prisma.sessionPlayer.findUnique({
        where: { id: parseInt(userId) },
      });

      if (!player) {
        return res.status(404).json({ message: "Jogador não encontrado" });
      }

      const propriedade = await prisma.propriedade.findUnique({
        where: { id: parseInt(propriedadeId) },
      });

      if (!propriedade)
        return res.status(404).json({ message: "Propriedade não encontrada" });

      if (player.saldo < propriedade.custo_compra)
        return res.status(400).json({ message: "Saldo insuficiente" });

      // 1️⃣ Verifica se a propriedade já foi comprada
      const existing = await prisma.sessionPosses.findFirst({
        where: {
          sessionId: parseInt(sessionId),
          possesId: parseInt(propriedadeId),
        },
      });

      if (existing?.playerId) {
        return res.status(400).json({ message: "Propriedade já foi comprada" });
      }

      let valorCompra = 0;
      const hipotecada = await prisma.sessionPosses.findFirst({
        where: {
          hipotecada: true
        }
      })

      if (hipotecada) valorCompra = propriedade.custo_compra + 20%(propriedade.custo_compra)
      else valorCompra = propriedade.custo_compra

      // 2️⃣ Atualiza o dono da propriedade
      await prisma.$transaction([
        prisma.sessionPosses.updateMany({
          where: {
            sessionId: parseInt(sessionId),
            possesId: parseInt(propriedadeId),
          },
          data: {
            playerId: parseInt(userId),
          },
        }),
        prisma.sessionPlayer.update({
          where: { id: parseInt(userId) },
          data: {
            saldo: {
              decrement: valorCompra,
            },
          },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "COMPRA_PROPRIEDADE",
            detalhes: `${player.nome} comprou a propriedade em ${propriedade.nome} por R$ ${valorCompra}`,
          },
        })
      ]);

      // 3️⃣ Retorna os dados atualizados
      const propriedadeAtualizada = await prisma.sessionPosses.findFirst({
        where: {
          sessionId: parseInt(sessionId),
          possesId: parseInt(propriedadeId),
        },
        include: {
          player: true,
          posses: true,
        },
      });

      res.status(200).json(propriedadeAtualizada);
    } catch (error) {
      console.error("Erro ao comprar propriedade: ", error);
      res.status(500).json({ message: "Erro ao comprar propriedade" });
    }
  },

  buyHouse: async (req: Request, res: Response) => {

    const { sessionId, userId, propriedadeId } = req.body;

    if(!sessionId && !userId) return res.status(500).send("Campos vazios ou errados!")

    try {
      // 🔍 Busca a posse específica dentro da sessão,
      // incluindo a propriedade base (pra pegar custo_casa)
      const propriedade = await prisma.sessionPosses.findFirst({
        where: {
          sessionId: Number(sessionId),
          possesId: parseInt(propriedadeId),
        },
        include: {
          posses: {
            include: {
              propriedade: true, // aqui temos acesso a custo_casa, aluguel, etc.
            },
          },
          player: true,
        },
      });

      if (!propriedade) {
        return res.status(404).json({ message: "Propriedade não encontrada!" });
      }

      // 🔍 Busca o jogador
      const player = await prisma.sessionPlayer.findUnique({
        where: { id: Number(userId) },
      });

      if (!player) {
        return res.status(404).json({ message: "Jogador não encontrado!" });
      }

      // 💰 Verificar custo e saldo
      const custoCasa = propriedade.posses.propriedade.custo_casa;

      if (player.saldo < custoCasa) {
        return res
          .status(400)
          .json({ message: "Saldo insuficiente para comprar uma casa!" });
      }

      // 🏠 Verifica limite máximo de casas
      if (propriedade.casas >= 5) {
        return res.status(400).json({
          message: "Esta propriedade já possui o número máximo de casas!",
        });
      }

      // ✅ Transação segura: incrementa casa + debita saldo
      await prisma.$transaction([
        prisma.sessionPosses.update({
          where: { id: propriedade.id },
          data: { casas: { increment: 1 } },
        }),
        prisma.sessionPlayer.update({
          where: { id: player.id },
          data: { saldo: { decrement: custoCasa } },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "COMPRA_CASA",
            detalhes: `${player.nome} comprou uma casa em ${propriedade.posses.propriedade.nome} por R$ ${custoCasa}`,
          },
        }),
      ]);

      return res.status(200).json({ message: "Casa comprada com sucesso!" });
    } catch (error) {
      console.error("Erro ao comprar casa:", error);
      res.status(500).json({ message: "Erro interno ao comprar casa." });
    }
  },

  sellHouse: async (req: Request, res: Response) => {
    const { propriedadeId, sessionId, userId } = req.body;

    if(!sessionId && !userId) return res.status(500).send("Campos vazios ou errados!")

    try {

      // 🔍 Busca a posse específica dentro da sessão,
      // incluindo a propriedade base (pra pegar custo_casa)
      const propriedade = await prisma.sessionPosses.findFirst({
        where: {
          sessionId: Number(sessionId),
          possesId: parseInt(propriedadeId),
        },
        include: {
          posses: {
            include: {
              propriedade: true, // aqui temos acesso a custo_casa, aluguel, etc.
            },
          },
          player: true,
        },
      });

      if (!propriedade) {
        return res.status(404).json({ message: "Propriedade não encontrada!" });
      }

      // 🔍 Busca o jogador
      const player = await prisma.sessionPlayer.findUnique({
        where: { id: Number(userId) },
      });

      if (!player) {
        return res.status(404).json({ message: "Jogador não encontrado!" });
      }

      // 💰 Verificar custo e saldo
      const custoCasa = propriedade.posses.propriedade.custo_casa;

      if (propriedade.casas === 0) return res.status(400).json({ message: "Esta propriedade não possui casas!"})
      
      // ✅ Transação segura: incrementa casa + debita saldo
      await prisma.$transaction([
        prisma.sessionPosses.update({
          where: { id: propriedade.id },
          data: { casas: { decrement: 1 } },
        }),
        prisma.sessionPlayer.update({
          where: { id: player.id },
          data: { saldo: { increment: custoCasa } },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "VENDA_CASA",
            detalhes: `${player.nome} vendeu uma casa em ${propriedade.posses.propriedade.nome} por R$ ${custoCasa}`,
          },
        }),
      ]);

      return res.status(200).json({ message: "Casa comprada com sucesso!" });
    } catch (error) {
      console.error("Erro ao vender casa!")
    }
  },

  sellPropriedade: async (req: Request, res: Response) => {

    const { propriedadeId, sessionId, userId } = req.body;

    if(!sessionId && !userId) return res.status(500).send("Campos vazios ou errados!")

    try {

      // 🔍 Busca a posse específica dentro da sessão,
      // incluindo a propriedade base (pra pegar hipoteca, nome, etc.)
      const propriedade = await prisma.sessionPosses.findFirst({
        where: {
          sessionId: Number(sessionId),
          possesId: parseInt(propriedadeId),
        },
        include: {
          posses: {
            include: {
              propriedade: true,
            },
          },
          player: true,
        },
      });

      if(!propriedade) return res.status(404).json({message: "Propriedade não encontrada!"})

      // 🔍 Busca o jogador
      const player = await prisma.sessionPlayer.findUnique({
        where: { id: Number(userId) },
      });

      if (!player) {
        return res.status(404).json({ message: "Jogador não encontrado!" });
      }

      // ✅ Verifica se o jogador é o dono
      if (!propriedade.player || propriedade.player.id !== player.id) {
        return res.status(400).json({ message: "Você não é proprietário desta propriedade!" });
      }

      // ❌ Não permite vender com casas
      if (propriedade.casas > 0) return res.status(400).json({ message: "Esta propriedade ainda possui casas!"})

      // valor recebido pela venda (usa hipoteca como no seu código)
      const valorVenda = propriedade.posses.propriedade.hipoteca;

      // 🔒 Transação: remove dono da posse + credita jogador + registra histórico
      await prisma.$transaction([
        prisma.sessionPosses.update({
          where: { id: propriedade.id },
          data: {
            playerId: null,
            casas: 0
          },
        }),
        prisma.sessionPlayer.update({
          where: { id: player.id },
          data: {
            saldo: { increment: valorVenda },
          },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "VENDA_PROPRIEDADE",
            detalhes: `${player.nome} vendeu a propriedade ${propriedade.posses.propriedade.nome} por R$ ${valorVenda}`,
          },
        }),
      ]);

      const propriedadeAtualizada = await prisma.sessionPosses.findFirst({
        where: {
          sessionId: Number(sessionId),
          possesId: parseInt(propriedadeId),
        },
        include: {
          player: true,
          posses: true,
        },
      });

      return res.status(200).json({ message: "Propriedade vendida com sucesso!", propriedade: propriedadeAtualizada });
    } catch (error) {
      console.error("Erro ao vender propriedade!", error)
      return res.status(500).json({ message: "Erro interno ao vender propriedade." });
    }

  },

  hipotecarPropriedade: async (req: Request, res: Response) => {

    const { propriedadeId, sessionId, userId } = req.body;

    if(!sessionId && !userId) return res.status(500).send("Campos vazios ou errados!")

    try {

      // 🔍 Busca a posse específica dentro da sessão,
      // incluindo a propriedade base (pra pegar hipoteca, nome, etc.)
      const propriedade = await prisma.sessionPosses.findFirst({
        where: {
          sessionId: Number(sessionId),
          possesId: parseInt(propriedadeId),
        },
        include: {
          posses: {
            include: {
              propriedade: true,
            },
          },
          player: true,
        },
      });

      if(!propriedade) return res.status(404).json({message: "Propriedade não encontrada!"})

      // 🔍 Busca o jogador
      const player = await prisma.sessionPlayer.findUnique({
        where: { id: Number(userId) },
      });

      if (!player) {
        return res.status(404).json({ message: "Jogador não encontrado!" });
      }

      // ✅ Verifica se o jogador é o dono
      if (!propriedade.player || propriedade.player.id !== player.id) {
        return res.status(400).json({ message: "Você não é proprietário desta propriedade!" });
      }

      // ❌ Não permite vender com casas
      if (propriedade.casas > 0) return res.status(400).json({ message: "Esta propriedade ainda possui casas!"})

      // valor recebido pela venda (usa hipoteca como no seu código)
      const valorVenda = propriedade.posses.propriedade.hipoteca;

      // 🔒 Transação: remove dono da posse + credita jogador + registra histórico
      await prisma.$transaction([
        prisma.sessionPosses.update({
          where: { id: propriedade.id },
          data: {
            playerId: null,
            casas: 0,
            hipotecada: true
          },
        }),
        prisma.sessionPlayer.update({
          where: { id: player.id },
          data: {
            saldo: { increment: valorVenda },
          },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "HIPOTECA_PROPRIEDADE",
            detalhes: `${player.nome} hipotecou a propriedade ${propriedade.posses.propriedade.nome} por R$ ${valorVenda}`,
          },
        }),
      ]);

      const propriedadeAtualizada = await prisma.sessionPosses.findFirst({
        where: {
          sessionId: Number(sessionId),
          possesId: parseInt(propriedadeId),
        },
        include: {
          player: true,
          posses: true,
        },
      });

      return res.status(200).json({ message: "Propriedade vendida com sucesso!", propriedade: propriedadeAtualizada });
    } catch (error) {
      console.error("Erro ao vender propriedade!", error)
      return res.status(500).json({ message: "Erro interno ao vender propriedade." });
    }

  },

  trocarPropriedade: async (req: Request, res: Response) => {

    const { propriedadeId, sessionId, userId } = req.body;

    if (!propriedadeId || !sessionId || !userId) return res.status(400).send("Campos vazios")

    try {

      const propriedade = await prisma.sessionPosses.findFirst({
        where: {
          sessionId: Number(sessionId),
          possesId: parseInt(propriedadeId),
        },
        include: {
          posses: {
            include: {
              propriedade: true,
            },
          },
          player: true,
        },
      });
      if (!propriedade) return res.status(404).json({ message: "Propriedade não encontrada!" })

      const player = await prisma.sessionPlayer.findFirst({
        where: { id: Number(userId) },
      });
      if (!player) return res.status(404).json({ message: "Jogador não encontrado!" })

      await prisma.$transaction([
        prisma.sessionPosses.update({
          where: { id: propriedade.id },
          data: {
            playerId: player.id,
            casas: 0,
          },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "TROCA_PROPRIEDADE",
            detalhes: `${player.nome} adquiriu a propriedade ${propriedade.posses.propriedade.nome}`,
          },
        }),
      ])

      return res.status(200).json({ message: "Propriedade trocada com sucesso!" })
      
    } catch (error) {
      console.error("Erro ao trocar propriedade!", error);
    }

  }


};
export default propsController;
