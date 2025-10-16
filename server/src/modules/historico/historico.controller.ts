import { Request, Response } from "express";
import {PrismaClient} from "@prisma/client"

const prisma = new PrismaClient();


const historicoController = {

  test: (req: Request, res: Response) => {
    res.send("Hello World! Esse é o histórico.")
  },

  all: async (req: Request, res: Response) =>{

    const {id} = req.params;

    try {

      const historico = await prisma.historico.findMany({
        where: {sessionId: parseInt(id)}
      })

      if(!historico) return res.status(404).json({message: "Sessão não encontrada!"});

      res.status(200).json(historico);

    } catch (error) {
      console.log("Erro ao buscar históricos!")
      res.status(500).json({message: "Erro ao buscar históricos"});
    }

  }

}

export default historicoController;
