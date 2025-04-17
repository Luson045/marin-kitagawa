import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MessageCircle, Mic, Home, Languages, Dices } from 'lucide-react';
import ChatInterface from './ChatInterface';
import TextNarrator from './TextNarrator';
import LearnJapaneseWithMarin from './Japanese';
import TicTacToe from './TicTacToe';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-pink-200 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-pink-600 font-bold text-xl"
          >
            <Home className="w-6 h-6" />
            Marin AI
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-4">
            <Link
              to="/chat"
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                location.pathname === '/chat'
                  ? 'bg-pink-100 text-pink-600'
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              Chat
            </Link>
            <Link
              to="/narrator"
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                location.pathname === '/narrator'
                  ? 'bg-pink-100 text-pink-600'
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              <Mic className="w-5 h-5" />
              Voice Generator
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-100 pt-24 p-6">
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-pink-600 mb-6">Welcome to Marin AI! ✨</h1>
      <p className="text-lg text-gray-700 mb-8">Your AI companion</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          to="/chat" 
          className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <MessageCircle className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-pink-600 mb-2">Chat with Marin</h2>
          <p className="text-gray-600">Have a conversation about cosplay, fashion, or anything else!</p>
        </Link>

        <Link 
          to="/narrator" 
          className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <Mic className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-pink-600 mb-2">Voice Generator</h2>
          <p className="text-gray-600">Let Marin narrate your text with her voice!</p>
        </Link>
        <Link 
          to="/learn" 
          className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <Languages className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-pink-600 mb-2">Learn Japanese With Marin</h2>
          <p className="text-gray-600">Let Marin cook!</p>
        </Link>
        <Link 
          to="/tic-tac-toe" 
          className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <Dices className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-pink-600 mb-2">Tic-Tac-Toe with Marin</h2>
          <p className="text-gray-600">Marin is a pro Tic-Tac-Toe player! Can you beat her?</p>
        </Link>
      </div>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-100 pt-20">
        <Navbar/>
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/chat" element={<ChatInterface/>} />
          <Route path="/narrator" element={<TextNarrator/>} />
          <Route path="/learn" element={<LearnJapaneseWithMarin/>} />
          <Route path="/tic-tac-toe" element={<TicTacToe/>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;