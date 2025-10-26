"use client";

import Banco from "@/components/Banco";
import Especiais from "@/components/Especiais";
import Inicio from "@/components/Inicio";
import Propriedades from "@/components/Propriedades";
import { useGameStore } from "@/stores/gameStore";
import { Menu, Power } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Historico from "@/components/Historico";
import Modal from "@/components/Modal";
import Link from "next/link";
import Loading from "@/components/Loading";

const linksNav = ["Início", "Banco", "Propriedades", "Especiais", "Histórico"];

export default function Game() {
  const [abaAtual, setAbaAtual] = useState("Início");
  const [fetched, setFetched] = useState(false);
  const [endLoading, setEndLoading] = useState(false);

  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as number | undefined;

  const { currentSession, loadSession, endSession } = useGameStore();

  const [menuModal, setMenuModal] = useState(false);

  // Efeito para Polling: Atualiza a sessão a cada 3 segundos
  useEffect(() => {
    if (!sessionId) return;

    const intervalId = setInterval(() => {
      // silenciosamente recarrega a sessão sem mostrar o loading spinner
      loadSession(Number(sessionId));
    }, 3000); // a cada 3 segundos

    // Limpa o intervalo quando o componente é desmontado
    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId, loadSession]);

  // Define qual aba abrir ao carregar
  useEffect(() => {
    setAbaAtual(localStorage.getItem("abaAtual") || "Início");
  }, []);

  // Carrega a sessão do backend
  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      await loadSession(sessionId);
      setFetched(true);
    };
    fetchSession();
  }, [sessionId, loadSession]);

  // Redireciona se a sessão não existir após fetch
  useEffect(() => {
    if (!fetched) return; // espera o fetch terminar
    if (!currentSession) {
      if (endLoading) return;
      toast.error("Sessão não encontrada");
      router.push("/");
    }
  }, [fetched, currentSession, router, endLoading]);

  const handleEndGame = async () => {
    if (!currentSession) return;
    if (
      !window.confirm(
        "Tem certeza que deseja finalizar este jogo? Esta ação não pode ser desfeita."
      )
    )
      return;
    setEndLoading(true);
    await endSession(currentSession.id);
    toast.success("Jogo finalizado!");
    setEndLoading(false);
    router.push("/");
  };

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const renderConteudo = () => {
    switch (abaAtual) {
      case "Início":
        return <Inicio />;
      case "Banco":
        return <Banco />;
      case "Propriedades":
        return <Propriedades />;
      case "Especiais":
        return <Especiais />;
      case "Histórico":
        return <Historico />;
      default:
        return <Inicio />;
    }
  };

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full flex flex-col px-4 pb-6">
      <header className="w-full py-2 flex flex-col items-center">
        <Link
          href={"/"}
          className="mt-4 text-4xl font-bold bg-linear-to-r from-blue-800 to-purple-700 bg-clip-text text-transparent"
        >
          Super Gerenciador de Partidas
        </Link>

        <div className="w-full flex lg:flex-col justify-between items-center mt-4 lg:mt-1">
          <div className="w-full flex lg:justify-end items-center space-x-3">
            <button
              onClick={handleEndGame}
              className="flex items-center px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Power className="w-4 h-4 mr-2" />
              Finalizar
            </button>
          </div>

          {/* Navegação */}
          <nav className="w-full mt-10 hidden lg:flex">
            <ul className="w-full grid grid-cols-5 justify-center">
              {linksNav.map((link, index) => (
                <li
                  key={index}
                  onClick={() => {
                    localStorage.setItem("abaAtual", link);
                    setAbaAtual(link);
                  }}
                  className={`h-10 flex justify-center items-center hover:bg-zinc-500/20 transition-colors cursor-pointer ${
                    abaAtual === link
                      ? "border-b border-zinc-500/40 font-bold text-zinc-800/80"
                      : "text-zinc-800/50"
                  }`}
                >
                  {link}
                </li>
              ))}
            </ul>
          </nav>

          <button onClick={() => setMenuModal(true)} className="lg:hidden">
            <Menu className="w-8 h-8" />
          </button>
        </div>
      </header>

      {/* Seção Principal */}
      <section className="mt-8">
        {/* Informações da sessão */}

        <div className="w-full flex flex-col my-4 border-b border-zinc-800/10 pb-4">
          <h1 className="text-2xl font-semibold text-zinc-800/80">
            {currentSession.nome}
          </h1>
          <p className="text-zinc-800/50">
            {formatDate(currentSession.dataInicio)} - Jogadores:{" "}
            {currentSession.jogadores.length}
          </p>
        </div>

        {/* Conteúdo da sessão */}
        {renderConteudo()}
      </section>

      <Modal
        size="md"
        title="Menu"
        isOpen={menuModal}
        onClose={() => setMenuModal(false)}
      >
        <ul className="w-full grid grid-rows-5 justify-center">
          {linksNav.map((link, index) => (
            <li
              key={index}
              onClick={() => {
                localStorage.setItem("abaAtual", link);
                setAbaAtual(link);
                setMenuModal(false);
              }}
              className={`h-10 flex justify-center items-center hover:bg-zinc-500/20 transition-colors cursor-pointer ${
                abaAtual === link
                  ? "border-b border-zinc-500/40 font-bold text-zinc-800/80"
                  : "text-zinc-800/50"
              }`}
            >
              {link}
            </li>
          ))}
        </ul>
      </Modal>

      {endLoading && <Loading label="Finalizando..." />}
    </main>
  );
}
