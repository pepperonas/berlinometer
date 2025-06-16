export interface Task {
  id: string;
  category: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Player {
  name: string;
  score: number;
}

export interface GameState {
  currentPlayer: number;
  players: Player[];
  currentTask: Task | null;
  timeLeft: number;
  isRunning: boolean;
  round: number;
}
