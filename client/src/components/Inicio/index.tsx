import { useGameStore } from "@/stores/gameStore";
import PlayerCard from "../PlayerCard";

export default function Inicio() {

  const {currentSession} = useGameStore();

  if(process.env.NODE_ENV === "development"){
    console.log("Sessão atual:", currentSession);
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {currentSession && (
        [...currentSession.jogadores] // Cria uma cópia para não mutar o estado original
          .sort((a, b) => b.saldo - a.saldo) // Ordena os dados
          .map((player) => (
            <PlayerCard key={player.id} player={player} /> // Renderiza os componentes
          ))
      )}
    </div>
  );
}