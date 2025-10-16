"use client";

import { useGameStore } from "@/stores/gameStore";
import { Transacao } from "@/types/game";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export default function Historico() {
  const { currentSession, getHistorico } = useGameStore();

  const [historico, setHistorico] = useState<Transacao[] | null>(null);

  useEffect(() => {
    if (!currentSession) return;
    (async () => {
      const res = await getHistorico(currentSession.id);
      if (res) {
        // ordena crescente por id antes de salvar
        const ordered = res.slice().sort((a, b) => a.id - b.id);
        setHistorico(ordered);
      }
    })();
  }, [currentSession, getHistorico]);

  return (
    <main>
      {historico && historico.length > 0 ? (
        <Table>
          <TableCaption>Histórico de Transações</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead className="text-right">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historico.map((transacao) => (
              <TableRow key={transacao.id}>
                <TableCell className="font-medium">{transacao.id}</TableCell>
                <TableCell>{transacao.tipo}</TableCell>
                <TableCell>{transacao.detalhes}</TableCell>
                <TableCell className="text-right">{new Date(transacao.data).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>Nenhuma transação encontrada.</p>
      )}
    </main>
  );
}
