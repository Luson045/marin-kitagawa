import React, { useState } from 'react';
import { Gamepad2, Brain, RotateCcw, Sparkles, MessageCircle } from 'lucide-react';

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [marinComment, setMarinComment] = useState("Hi! I'm Marin~ Let's play a game of Tic Tac Toe! You'll be X and I'll be O ✨");
  const [isCommentLoading, setIsCommentLoading] = useState(false);

  const getGameState = (squares, lastMove, isPlayerMove) => {
    const emptyCount = squares.filter(square => !square).length;
    if (emptyCount === 9) return "start";
    if (winner === 'X') return "player_won";
    if (winner === 'O') return "marin_won";
    if (winner === 'Draw') return "draw";
    return isPlayerMove ? "player_moved" : "marin_moved";
  };

  const getMarinComment = async (gameState, lastMove) => {
    setIsCommentLoading(true);
    let situation = "";
    
    switch(gameState) {
      case "start":
        situation = "Marin starting a new game of Tic Tac Toe with the player";
        break;
      case "player_moved":
        situation = `The player just placed their X at position ${lastMove}. Marin need to respond`;
        break;
      case "marin_moved":
        situation = `Marin just placed her O at position ${lastMove}. Marin think this was a good move!`;
        break;
      case "player_won":
        situation = "The player just won against Marin!";
        break;
      case "marin_won":
        situation = "Marin just won the game with her last move!";
        break;
      case "draw":
        situation = "The game ended in a draw!";
        break;
    }

    try {
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: `As Marin playing Tic Tac Toe against the player, give a very brief first-person response (max 2 sentences) to this situation: ${situation}`
        })
      });

      if (!response.ok) throw new Error("Failed to get comment");
      const data = await response.json();
      setMarinComment(data.response);
    } catch (error) {
      console.error("Error:", error);
      // Fallback comments based on game state
      const fallbackComments = {
        start: "Let's have a fun game! I'll do my best~ 💖",
        player_moved: "Hmm, interesting move! Let me think about my response... 🤔",
        marin_moved: "I think this is a good spot for my O! What will you do next? ✨",
        player_won: "Wow, you're really good! Congratulations on beating me! 🎉",
        marin_won: "Yay, I won! But you played really well too! 💖",
        draw: "That was a close game! Shall we play another? 🎮"
      };
      setMarinComment(fallbackComments[gameState] || "Hmm, what an interesting situation! 💭");
    } finally {
      setIsCommentLoading(false);
    }
  };

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = async (index) => {
    if (board[index] || gameOver || isLoading) return;

    // Player move
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    await getMarinComment("player_moved", index);

    const playerWin = checkWinner(newBoard);
    if (playerWin) {
      setGameOver(true);
      setWinner('X');
      await getMarinComment("player_won", index);
      return;
    }

    if (newBoard.filter(cell => cell).length === 9) {
      setGameOver(true);
      setWinner('Draw');
      await getMarinComment("draw", index);
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Marin's move
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: newBoard })
      });
      
      const data = await response.json();
      const agentBoard = [...newBoard];
      agentBoard[data.move] = 'O';
      setBoard(agentBoard);

      const agentWin = checkWinner(agentBoard);
      if (agentWin) {
        setGameOver(true);
        setWinner('O');
        await getMarinComment("marin_won", data.move);
      } else if (agentBoard.filter(cell => cell).length === 9) {
        setGameOver(true);
        setWinner('Draw');
        await getMarinComment("draw", data.move);
      } else {
        await getMarinComment("marin_moved", data.move);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(''));
    setGameOver(false);
    setWinner(null);
    getMarinComment("start");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-100 p-6">
      {/* Floating game controllers background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <Gamepad2
            key={i}
            className="absolute text-pink-200 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              transform: `scale(${0.5 + Math.random()})`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8" />
            Play Against Marin
            <Sparkles className="w-8 h-8" />
          </h1>
          <p className="text-pink-400 mt-2">Can you beat me at Tic Tac Toe? 💖</p>
        </div>

        {/* Game board */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-pink-200">
          {/* Marin's Comment Box */}
          <div className="bg-pink-50 rounded-xl p-4 mb-6 border-2 border-pink-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-pink-400" />
              <span className="font-bold text-pink-600">Marin:</span>
            </div>
            <div className="min-h-[3rem] text-pink-600">
              {isCommentLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-bounce">💭</div>
                  Thinking...
                </div>
              ) : (
                marinComment
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={cell || gameOver || isLoading}
                className="aspect-square bg-pink-50 rounded-xl border-2 border-pink-200 text-4xl font-bold text-pink-600 hover:bg-pink-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {cell}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="text-center">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-pink-600">
                <Brain className="w-6 h-6 animate-bounce" />
                I'm thinking...
              </div>
            ) : gameOver ? (
              <div className="text-xl font-bold text-pink-600">
                {winner === 'Draw' ? "It's a draw!" : winner === 'X' ? "You won!" : "I won!"}
              </div>
            ) : (
              <div className="text-pink-600">Your turn!</div>
            )}
          </div>

          {/* Reset button */}
          {gameOver && (
            <div className="flex justify-center mt-4">
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-medium rounded-full transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;