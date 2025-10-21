"use client";

import { useGameStore } from "@/stores/gameStore";
import { useMemo } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export default function Historico() {
  const { currentSession } = useGameStore();

  // Lê o histórico diretamente da sessão e memoriza a ordenação
  const historicoOrdenado = useMemo(() => {
    if (!currentSession?.historico) return [];
    // Cria uma cópia e ordena de forma decrescente para mostrar os mais recentes primeiro
    return [...currentSession.historico].sort((a, b) => b.id - a.id);
  }, [currentSession?.historico]);

  return (
    <main>
      {historicoOrdenado.length > 0 ? (
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
            {historicoOrdenado.map((transacao) => (
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
