import type {Request, Response} from "express"
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient();

const bancoController = {
  test: (req: Request, res: Response) => {
    res.send("Hello World! Você está na área de banco!")
  },

  deposito: async (req: Request, res: Response) => {

    const {userId, sessionId, valor} = req.body;
    if (!userId && !sessionId && !valor) return res.status(500).send("Campos vazios ou errados!");

    try {

      const player = await prisma.sessionPlayer.findUnique({
        where: { id: Number(userId) },
      });

      if (!player) return res.status(404).json({ message: "Jogador não encontrado!" });

      await prisma.$transaction([
        prisma.sessionPlayer.update({
          where: { id: Number(userId) },
          data: { saldo: { increment: Number(valor) } },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "DEPOSITO",
            detalhes: `${player.nome} depositou R$ ${valor}`,
          },
        })
      ])

      return res.status(200).json({ message: `Depósito de R$ ${valor} para o jogador ${player.nome} realizado com sucesso!` });
      
    } catch (error) {
      console.error("Erro no depósito!")
    }  

  },

  saque: async (req: Request, res: Response) => {

    const {userId, sessionId, valor} = req.body;
    if (!userId && !sessionId && !valor) return res.status(500).send("Campos vazios ou errados!");

    try {

      const player = await prisma.sessionPlayer.findUnique({
        where: { id: Number(userId) },
      });

      if (!player) return res.status(404).json({ message: "Jogador não encontrado!" });

      await prisma.$transaction([
        prisma.sessionPlayer.update({
          where: { id: Number(userId) },
          data: { saldo: { decrement: Number(valor) } },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "SAQUE",
            detalhes: `${player.nome} retirou R$ ${valor}`,
          },
        })
      ])

      return res.status(200).json({ message: `Saque de R$ ${valor} para o jogador ${player.nome} realizado com sucesso!` });
      
    } catch (error) {
      console.error("Erro no saque!")
    }

  },

  transferencia: async (req: Request, res: Response) => {

    const {pagadorId, recebedorId, sessionId, valor} = req.body;

    if (!pagadorId && !recebedorId && !sessionId && !valor) return res.status(500).send("Campos vazios ou errados!");

    try {
      
      const pagador = await prisma.sessionPlayer.findUnique({
        where: { id: Number(pagadorId) },
      });

      if (!pagador) return res.status(404).json({ message: "Jogador pagador não encontrado!" });

      const recebedor = await prisma.sessionPlayer.findUnique({
        where: { id: Number(recebedorId) },
      });

      if (!recebedor) return res.status(404).json({ message: "Jogador recebedor não encontrado!" });

      await prisma.$transaction([
        prisma.sessionPlayer.update({
          where: { id: Number(pagadorId) },
          data: { saldo: { decrement: Number(valor) } },
        }),
        prisma.sessionPlayer.update({
          where: { id: Number(recebedorId) },
          data: { saldo: { increment: Number(valor) } },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "TRANSFERENCIA",
            detalhes: `${pagador.nome} transferiu R$ ${valor} para ${recebedor.nome}`,
          },
        })
      ])

      return res.status(200).json({ message: `Transferência de R$ ${valor} para o jogador ${recebedor.nome} realizada com sucesso!` });

    } catch (error) {
      console.error("Erro na transferência!")
    }

  },

  pagarAluguel: async (req: Request, res: Response) => {
    const { sessionId, pagadorId, sessionPossesId } = req.body;
    if (!sessionId || !pagadorId || !sessionPossesId) return res.status(400).json({ message: "Campos faltando" });

    try {
      const poss = await prisma.sessionPosses.findUnique({
        where: { id: Number(sessionPossesId) },
        include: {
          posses: { include: { propriedade: true } },
          player: true,
        },
      });

      if (!poss) return res.status(404).json({ message: "Posse não encontrada" });
      if (!poss.player) return res.status(400).json({ message: "Propriedade sem dono" });
      if (poss.player.id === Number(pagadorId)) return res.status(400).json({ message: "Você já é o proprietário" });

      const pagador = await prisma.sessionPlayer.findUnique({ where: { id: Number(pagadorId) } });
      if (!pagador) return res.status(404).json({ message: "Pagador não encontrado" });

      // agora usamos os campos específicos da propriedade para escolher o aluguel correto
      const prop = poss.posses.propriedade;
      if (!prop) return res.status(500).json({ message: "Dados da propriedade indisponíveis" });

      const casas = Number(poss.casas ?? 0);
      let valorAluguel = 0;

      switch (casas) {
        case 0:
          valorAluguel = prop.aluguel_base ?? 0;
          break;
        case 1:
          valorAluguel = prop.aluguel_1c ?? prop.aluguel_base ?? 0;
          break;
        case 2:
          valorAluguel = prop.aluguel_2c ?? prop.aluguel_1c ?? prop.aluguel_base ?? 0;
          break;
        case 3:
          valorAluguel = prop.aluguel_3c ?? prop.aluguel_2c ?? prop.aluguel_1c ?? prop.aluguel_base ?? 0;
          break;
        case 4:
          valorAluguel = prop.aluguel_4c ?? prop.aluguel_3c ?? prop.aluguel_3c ?? prop.aluguel_base ?? 0;
          break;
        default: // 5 ou mais -> hotel
          valorAluguel = prop.aluguel_hotel ?? prop.aluguel_4c ?? prop.aluguel_base ?? 0;
          break;
      }

      if (pagador.saldo < valorAluguel) return res.status(400).json({ message: "Saldo insuficiente" });

      await prisma.$transaction([
        prisma.sessionPlayer.update({
          where: { id: Number(pagadorId) },
          data: { saldo: { decrement: valorAluguel } },
        }),
        prisma.sessionPlayer.update({
          where: { id: poss.player.id },
          data: { saldo: { increment: valorAluguel } },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "PAGAMENTO_ALUGUEL",
            detalhes: `${pagador.nome} pagou R$ ${valorAluguel} para ${poss.player.nome} em ${prop.nome}`,
          },
        }),
      ]);

      return res.status(200).json({ message: "Aluguel pago", valor: valorAluguel });
    } catch (error) {
      console.error("Erro ao pagar aluguel:", error);
      return res.status(500).json({ message: "Erro interno" });
    }
  },

  aluguelAcao: async (req: Request, res: Response) => {

    const { sessionId, pagadorId, sessionPossesId, numDados } = req.body;
    if (!sessionId || !pagadorId || !sessionPossesId || !numDados) return res.status(400).json({ message: "Campos faltando" });

    try {

      const poss = await prisma.sessionPosses.findUnique({
        where: { id: Number(sessionPossesId) },
        include: {
          posses: { include: { propriedade: true } },
          player: true,
        },
      });

      if (!poss) return res.status(404).json({ message: "Posse não encontrada" });
      if (!poss.player) return res.status(400).json({ message: "Propriedade sem dono" });
      if (poss.player.id === Number(pagadorId)) return res.status(400).json({ message: "Você já é o proprietário" });

      const pagador = await prisma.sessionPlayer.findUnique({ where: { id: Number(pagadorId) } });
      if (!pagador) return res.status(404).json({ message: "Pagador não encontrado" });

      // agora usamos os campos específicos da propriedade para escolher o aluguel correto
      const prop = poss.posses.propriedade;
      if (!prop) return res.status(500).json({ message: "Dados da propriedade indisponíveis" });

      let valorAluguel = 500 * Number(numDados);

      if (pagador.saldo < valorAluguel) return res.status(400).json({ message: "Saldo insuficiente" });

      await prisma.$transaction([
        prisma.sessionPlayer.update({
          where: { id: Number(pagadorId) },
          data: { saldo: { decrement: valorAluguel } },
        }),
        prisma.sessionPlayer.update({
          where: { id: poss.player.id },
          data: { saldo: { increment: valorAluguel } },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "PAGAMENTO_ALUGUEL",
            detalhes: `${pagador.nome} pagou R$ ${valorAluguel} para ${poss.player.nome} em ${prop.nome}`,
          },
        }),
      ]);

      return res.status(200).json({ message: `${pagador.nome} pagou R$ ${valorAluguel} para ${poss.player.nome} em ${prop.nome}`})
      
    } catch (error) {
      console.error("Erro ao pagar aluguel de ação:", error);
      return res.status(500).json({ message: "Erro interno" });
    }
  },

  receberDeTodos: async (req: Request, res: Response) => {

    const {sessionId, userId} = req.body;

    if (!sessionId || !userId) return res.status(404).json({ message: "Campos faltando" });

    try {

      const player = await prisma.sessionPlayer.findUnique({
        where: { id: Number(userId) },
      });

      if (!player) return res.status(404).json({ message: "Jogador não encontrado!" });

      const outrosJogadores = await prisma.sessionPlayer.findMany({
        where: {
          sessionId: Number(sessionId),
          id: { not: Number(userId) } // Filtra para pegar todos, MENOS o recebedor
        }
      });

      await prisma.$transaction([
        ...outrosJogadores.map((jogador) => prisma.sessionPlayer.update({
          where: { id: jogador.id },
          data: { saldo: { decrement: 500 } },
        })),
        prisma.sessionPlayer.update({
          where: { id: Number(userId) },
          data: { saldo: { increment: 500*outrosJogadores.length } },
        }),
        prisma.historico.create({
          data: {
            sessionId: Number(sessionId),
            data: new Date(),
            tipo: "RECEBER_DE_TODOS",
            detalhes: `O jogador ${player.nome} recebeu R$ 500 de todos os jogadores, um total de ${500*outrosJogadores.length}!`,
          },
        })
      ])

      return res.status(200).json({message: `O jogador ${player.nome} recebeu R$ 500 de todos os jogadores, um total de ${500*outrosJogadores.length}!`})
      
    } catch (error) {
      console.error("Erro na transferência!", error);
      return res.status(500).json({ message: "Erro interno" });
    }

  }

}

export default bancoController