import React, { useState } from 'react';
import { Gamepad2, Brain, RotateCcw, Sparkles, MessageCircle } from 'lucide-react';

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [marinComment, setMarinComment] = useState("Hello Players! Let the game begin!✨");
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [curr_player, setCurrent] = useState('player1');

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
        situation = "player1 starting a new game of Tic Tac Toe with the player2";
        break;
      case "player1_moved":
        situation = `The player1 just placed their X at position ${lastMove}. Player2 need to respond`;
        break;
      case "player2_moved":
        situation = `player2 just placed her O at position ${lastMove}. player2 think this was a good move!`;
        break;
      case "player1_won":
        situation = "The player1 just won against player2!";
        break;
      case "player2_won":
        situation = "player2 just won the game with their last move!";
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
          query: `As Marin is narrating a  Tic Tac Toe game between two players, give a very brief first-person response (max 2 sentences) to this situation: ${situation}`
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
        player_won: "Wow, player1 really good! Congratulations on beating player2! 🎉",
        player2_won: "Yay, player2 won! But you played really well too! 💖",
        draw: "That was a close game! Would you like to play another? 🎮"
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
    //player 2 move
    if(curr_player=='player2'){
      const newBoard = [...board];
      newBoard[index] = 'O';
      setBoard(newBoard);
      await getMarinComment("player2_moved", index);
      setCurrent('player1');
      const playerWin = checkWinner(newBoard);
      if (playerWin) {
        setGameOver(true);
        setWinner('X');
        await getMarinComment("player1_won", index);
        return;
      }
  
    }
    // Player1 move
    else{
      const newBoard = [...board];
      newBoard[index] = 'X';
      setBoard(newBoard);
      await getMarinComment("player1_moved", index);
      setCurrent('player2');
      const player2Win = checkWinner(newBoard);
      if (player2Win) {
        setGameOver(true);
        setWinner('X');
        await getMarinComment("player1_won", index);
        return;
      }
    }

    if (newBoard.filter(cell => cell).length === 9) {
      setGameOver(true);
      setWinner('Draw');
      await getMarinComment("draw", index);
      return;
    }
    setIsLoading(true);
    // await new Promise(resolve => setTimeout(resolve, 5000));
    // Marin's move
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
            Play Against Each Other
            <Sparkles className="w-8 h-8" />
          </h1>
          <p className="text-pink-400 mt-2">Tic-Tac-Toe</p>
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