import { useState, useEffect } from "react";
import "./App.css";

import {
  TeamOutlined ,
  RobotOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  HomeOutlined
} from "@ant-design/icons";

import clickSound from "./sounds/click.wav";
import winSound from "./sounds/win.wav";

// ===== ЗВУКИ (стабильно) =====
function playClick() {
  const audio = new Audio(clickSound);
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

function playWin() {
  const audio = new Audio(winSound);
  audio.volume = 0.7;
  audio.play().catch(() => {});
}

function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [mode, setMode] = useState(null); // "friend" | "bot"
  const [difficulty, setDifficulty] = useState(null); // "easy" | "medium" | "hard"
  const [score, setScore] = useState({ X: 0, O: 0 });

  // ===== ХОД БОТА =====
 useEffect(() => {
  if (mode === "bot" && !isXNext && !winnerInfo) {
    const timeout = setTimeout(botMove, 400);
    return () => clearTimeout(timeout);
  }
}, [isXNext, winnerInfo, board, mode, difficulty]);

 function handleClick(index) {
  if (board[index] || winnerInfo) return;

  // если игра с ботом и сейчас ход бота — нельзя кликать
  if (mode === "bot" && !isXNext) return;

  const newBoard = [...board];

  if (mode === "friend") {
    // 👥 два игрока
    newBoard[index] = isXNext ? "X" : "O";
    setIsXNext(!isXNext);
  } else {
    // 🤖 игра с ботом (человек всегда X)
    newBoard[index] = "X";
    setIsXNext(false); // передаём ход боту
  }

  playClick();
  setBoard(newBoard);
  checkWinner(newBoard);
}

  function botMove() {
  let move;

  if (difficulty === "easy") {
    move = getRandomMove(board);
  } else if (difficulty === "medium") {
    move = Math.random() < 0.5
      ? getRandomMove(board)
      : minimax(board, "O").index;
  } else {
    move = minimax(board, "O").index;
  }

  if (move === undefined) return;

  const newBoard = [...board];
  newBoard[move] = "O"; // бот всегда O

  playClick();
  setBoard(newBoard);
  checkWinner(newBoard);

  setIsXNext(true); // возвращаем ход человеку
}

  function getRandomMove(board) {
    const empty = board
      .map((v, i) => (v === null ? i : null))
      .filter(v => v !== null);

    return empty[Math.floor(Math.random() * empty.length)];
  }

  function checkWinner(newBoard) {
    const result = calculateWinner(newBoard);
    if (result) {
      playWin();
      setWinnerInfo(result);
      setScore(prev => ({
        ...prev,
        [result.winner]: prev[result.winner] + 1
      }));
    }
  }

  function resetGame() {
    setBoard(Array(9).fill(null));
    setWinnerInfo(null);
    setIsXNext(true);
  }

  function goMenu() {
    setMode(null);
    setDifficulty(null);
    resetGame();
  }

  // ===== МЕНЮ =====
  if (!mode) {
    return (
      <div className="menu">
        <h1>Крестики-нолики</h1>

        <button onClick={() => setMode("friend")}>
          <TeamOutlined /> Играть с другом
        </button>

        <button onClick={() => setMode("bot")}>
          <RobotOutlined /> Играть с ботом
        </button>
      </div>
    );
  }

  // ===== ВЫБОР СЛОЖНОСТИ =====
  if (mode === "bot" && !difficulty) {
    return (
      <div className="menu">
        <h2>Выбери сложность</h2>

        <button onClick={() => setDifficulty("easy")}>Лёгкий</button>
        <button onClick={() => setDifficulty("medium")}>Средний</button>
        <button onClick={() => setDifficulty("hard")}>Сложный</button>

        <button onClick={goMenu}>
          <HomeOutlined /> Назад
        </button>
      </div>
    );
  }

  return (
    <div className="game">
      <h1>Крестики-нолики</h1>

      <div className="score">
        <CloseOutlined style={{ color: "red" }} /> {score.X}
        <span style={{ marginLeft: 20 }}>
          <QuestionCircleOutlined style={{ color: "deepskyblue" }} /> {score.O}
        </span>
      </div>

      <div className="status">
        {winnerInfo
          ? `Победитель: ${winnerInfo.winner}`
          : `Ходит: ${isXNext ? "X" : "O"}`
        }
      </div>

      <div className="board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={"cell " +
              (cell === "X" ? "x" : cell === "O" ? "o" : "") +
              (winnerInfo?.line.includes(i) ? " win" : "")
            }
            onClick={() => handleClick(i)}
          >
            {cell === "X" && <CloseOutlined />}
            {cell === "O" && <QuestionCircleOutlined />}
          </button>
        ))}
      </div>

      <button className="reset" onClick={resetGame}>
        <ReloadOutlined /> Заново
      </button>

      <button className="reset" onClick={goMenu}>
        <HomeOutlined /> Меню
      </button>
    </div>
  );
}

// ===== ПРОВЕРКА ПОБЕДЫ =====
function calculateWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];

  for (let line of lines) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

// ===== ИИ (МИНИМАКС) ===== 
function minimax(board, player) {
  const empty = board
    .map((v, i) => (v === null ? i : null))
    .filter(v => v !== null);

  const winner = calculateWinner(board);
  if (winner?.winner === "X") return { score: -10 };
  if (winner?.winner === "O") return { score: 10 };
  if (empty.length === 0) return { score: 0 };

  const moves = [];

  for (let i of empty) {
    const move = {};
    move.index = i;
    board[i] = player;

    const result = minimax(board, player === "O" ? "X" : "O");
    move.score = result.score;

    board[i] = null;
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

export default App;