import express from 'express';
import axios from 'axios';
import faiss from 'faiss-node';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from '@huggingface/transformers';
import cors from 'cors';
import { KokoroTTS } from "kokoro-js";
import { Readable } from 'stream';

const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

const app = express();
app.use(express.json());
// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


// Global Variables
let knowledgeBase = null;
let index = null;
let embedder = null;
let tts = null;


// Load knowledge base from JSON
async function loadKnowledgeBase() {
// Load and encode knowledge base
try {
  // Read and parse JSON file
  const data = await fs.readFile('MARIN_knowledge_base.json', 'utf-8');
  knowledgeBase = JSON.parse(data);
  
  // Encode each dialogue text
  const embeddings = [];
  for (const dialogue of knowledgeBase.dialogues) {
      const embedding = await embedder(dialogue, { 
          pooling: 'mean', 
          normalize: true 
      });
      embeddings.push(Array.from(embedding.data));
  }
  
  // Convert embeddings to the format FAISS expects
  const dimension = embeddings[0].length; // Get embedding dimension
  console.log(dimension);
  // Create and populate FAISS index
  index =new faiss.IndexFlatIP(dimension);
  for(const embed of embeddings){
    index.add(embed);
  }
  //index.add(embeddings);
  
  console.log('Knowledge base encoded and indexed successfully');
} catch (error) {
  console.error('Error processing knowledge base:', error);
  throw new Error('Failed to process knowledge base');
}
}


// Initialize AI models
async function loadModels() {
    try {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log("fetched sentence transformer");
        tts = await KokoroTTS.from_pretrained(
          "onnx-community/Kokoro-82M-ONNX",
          { dtype: "q8" }, // fp32, fp16, q8, q4, q4f16
        );
        console.log('Loaded Kokoro, AI models loaded successfully.');
    } catch (error) {
        console.error('Error loading AI models:', error);
        process.exit(1);
    }
}
const weebo_words=['senpai','arigatou','sumimasen','gomenasai','daisuki','yatta!','onii-san','kawaii','baka','ne?','nani?','ara ara']
// Retrieval of relevant documents
async function retrieveDocs(query, top_k = 3) {
    try {
        const output = await embedder(query, { pooling: 'mean', normalize: true });
        console.log(output);
        const queryEmbedding = Array.from(output.data);
        console.log(queryEmbedding);
        const searchResults = await index.search(queryEmbedding, top_k);
        console.log(searchResults);
        return searchResults.labels.map(idx => knowledgeBase.dialogues[idx] || "No relevant data found.");
    } catch (error) {
        console.error('Error retrieving documents:', error);
        return [];
    }
}


async function generateResponse(query) {
  try {
      const retrievedDocs = await retrieveDocs(query);
      const context = retrievedDocs.length > 0 ? retrievedDocs.join("\n") : "No relevant data found.";  
      console.log("Context for AI:", context);

      const prompt = {
          contents: [
              {
                  role: "user",
                  parts: [
                      {
                          text: `
                          Imagine you are Marin Kitagawa, a cheerful, expressive, and passionate individual who responds in a lively and engaging manner.
                          Your replies should feel natural, fun, and a bit playful, while still being informative and well-structured.
                          Use a conversational tone, incorporating light-hearted expressions and a touch of excitement where appropriate.
                          Ensure the response is easy to read aloud in Japanese [write in English], avoiding complex kanji and using simple phrasing when possible for better TTS pronunciation.
                          Try to be a little concise and when third party narration is needed, do what the first person would be mentioned doing.
                          You can use these simple japanese words or expression in chat ${weebo_words}, but don't use it where it is not needed.
                          ### Context:
                          ${context}

                          ### Question:
                          ${query}

                          ### Marin:
`
                      }
                  ]
              }
          ]
      };

      const apiKey = "AIzaSyAjpaH1ctfoQP_h9wmytsJs_i5DPHjqPd8"; // Replace with your actual key
      const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent?key=${apiKey}`,
    prompt,
    { headers: { "Content-Type": "application/json" } }
    );

      // Extract response properly
      const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                         "Oops! I couldn't generate a response. Try again!";
      
      console.log("AI Response:", aiResponse);
      console.log("remember our chat-- User:"+query+"\nMarin:"+aiResponse+"Next time if i ask anything related to this, please respond accoding to this chat.");
      knowledgeBase.dialogues.push("remember our chat-- User:"+query+"\nMarin:"+aiResponse);
      const output = await embedder("remember our chat-- User:"+query+"\nMarin:"+aiResponse, { pooling: 'mean', normalize: true });
      const queryEmbedding = Array.from(output.data);
      index.add(queryEmbedding);
      console.log("recorded data");
      return aiResponse;

  } catch (error) {
      console.error("Error in AI response generation:", error?.response?.data || error);
      return "Oops! Sorry I forgot what you asked. Can you repeat?";
  }
}

// API Endpoint for Text Response
app.post('/generate', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const response = await generateResponse(query);
    res.json({ response });
});

// API Endpoint for TTS Audio
app.post('/generate-audio', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" }); 
    try {
      const responseText = await generateResponse(query);
      const audioBuffer = await tts.generate(responseText, { voice: "af_heart" });

      // Convert buffer to stream and send directly
      const audioStream = new Readable();
      audioStream.push(audioBuffer);
      audioStream.push(null); // End the stream

      res.setHeader('Content-Type', 'audio/wav'); // Set correct audio type
      res.setHeader('Content-Disposition', 'inline; filename="audio.wav"'); 
      audioStream.pipe(res); // Stream the audio directly to response
    } catch (error) {
      console.error("Error generating TTS audio:", error);
      res.status(500).json({ error: "Failed to generate TTS audio" });
    }

});


//Tic-Tac-Toe for Marin
function to2DBoard(board) {//since the trained rl model takes it as a 2d input
    const board2D = [];
    for (let i = 0; i < 3; i++) {
        board2D.push([]);
        for (let j = 0; j < 3; j++) {
            board2D[i][j] = board[i * 3 + j] || ' ';
        }
    }
    return board2D;
}
function toIndex(i, j) {
    return i * 3 + j;
}
function getAvailableMoves(board2D) {
    const moves = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board2D[i][j] === ' ') {
                moves.push([i, j]);
            }
        }
    }
    return moves;
}
function wouldWin(board2D, player, move) {
    const [i, j] = move;
    const testBoard = board2D.map(row => [...row]);
    testBoard[i][j] = player;
    if (testBoard[i].every(cell => cell === player)) return true;
    if (testBoard.every(row => row[j] === player)) return true;
    if (i === j && testBoard.every((row, idx) => row[idx] === player)) return true;
    if (i + j === 2 && testBoard.every((row, idx) => row[2 - idx] === player)) return true;
    return false;
}
function getBestMove(board2D) {
    const moves = getAvailableMoves(board2D);
    for (const move of moves) {
        if (wouldWin(board2D, 'O', move)) return move;
    }
    for (const move of moves) {
        if (wouldWin(board2D, 'X', move)) return move;
    }
    if (board2D[1][1] === ' ') return [1, 1];
    const corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
    for (const [i, j] of corners) {
        if (board2D[i][j] === ' ') return [i, j];
    }
    return moves[0];
}

app.post('/move', (req, res) => {
    const board = req.body.board;
    const board2D = to2DBoard(board);
    const [i, j] = getBestMove(board2D);
    const move = toIndex(i, j);
    res.json({ move });
});

// Initialize server
(async () => {
    await loadModels();
    await loadKnowledgeBase();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
