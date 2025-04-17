from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
from collections import defaultdict
import random
import os

app = Flask(__name__)
CORS(app)

class LoadedAgent:
    def __init__(self):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, 'best_agent.pkl')
        
        with open(model_path, 'rb') as f:
            q_table_dict = pickle.load(f)

        self.q_table = defaultdict(lambda: defaultdict(lambda: 0.0))
        self.q_table.update(q_table_dict)

    def get_state_key(self, board):
        return ''.join([''.join(row) for row in board])

    def get_available_moves(self, board):
        return [(i, j) for i in range(3) for j in range(3) if board[i][j] == ' ']

    def choose_action(self, board):
        state = self.get_state_key(board)
        q_values = self.q_table[state]

        available_moves = self.get_available_moves(board)
        if not q_values:
            return random.choice(available_moves)

        #move with maximum Q-value
        max_q = max(q_values.values())
        best_moves = [move for move, q in q_values.items()
                     if q == max_q and eval(move) in available_moves]

        return eval(random.choice(best_moves)) if best_moves else random.choice(available_moves)

#Initialization
try:
    agent = LoadedAgent()
    print("Successfully loaded RL model!")
except Exception as e:
    print(f"Error loading RL model: {e}")
    raise

@app.route('/')
def home():
    return "Tic Tac Toe RL Agent API is running!"

@app.route('/api/move', methods=['POST'])
def get_move():
    try:
        data = request.json
        board_1d = data['board']
        board_2d = [[' ' for _ in range(3)] for _ in range(3)]
        for i in range(3):
            for j in range(3):
                board_2d[i][j] = board_1d[i * 3 + j] if board_1d[i * 3 + j] else ' '
        move = agent.choose_action(board_2d)
        move_1d = move[0] * 3 + move[1]
        
        return jsonify({
            'move': move_1d,
            'status': 'success'
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)