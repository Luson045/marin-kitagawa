import React, { useState, useEffect, useRef } from "react";
import { Mic, Play, Pause, Send, Loader2, Heart, Sparkles, FileText } from "lucide-react";
import jsPDF from "jspdf";

const ChatInterface = () => {
  const [query, setQuery] = useState("");
  const [responseText, setResponseText] = useState("");
  const [audioSrc, setAudioSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMicSupported, setIsMicSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTakingNotes, setIsTakingNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsMicSupported(true);
    }

    // Set up audio event listeners
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onpause = () => setIsPlaying(false);
    audioRef.current.onended = () => setIsPlaying(false);

    return () => {
      audioRef.current.pause();
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, []);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = isMicSupported ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setError('Failed to recognize speech. Please try again.');
    };
  }

  const handleVoiceInput = () => {
    if (!recognition) return;
    if (!isListening) {
      setError(null);
      recognition.start();
      setIsListening(true);
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setError(null);
  };

  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const textRes = await fetch("http://localhost:5000/generate", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!textRes.ok) throw new Error('Failed to get response');
      const textData = await textRes.json();
      setResponseText(textData.response);
      
      if (isTakingNotes) {
        setNotes((prevNotes) => [...prevNotes, { question: query, answer: textData.response }]);
      }

      // Handle TTS
      const encodedText = encodeURIComponent(textData.response);
      const ttsUrl = `https://bcci-kokoro-onnx-api-test.hf.space/tts/streaming?text=${encodedText}&voice=jf_alpha&speed=1.0&format=wav`;

      const audioRes = await fetch(ttsUrl);
      if (!audioRes.ok) throw new Error('Failed to generate audio');

      const audioBlob = await audioRes.blob();
      const audioURL = URL.createObjectURL(audioBlob);
      
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
      
      setAudioSrc(audioURL);
      audioRef.current.src = audioURL;
      console.log(window.location.pathname);
      if('/chat' == window.location.pathname){
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadNotes = () => {
    if (notes.length === 0) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(194, 41, 184);
    doc.text("Marin AI Notes ✨", 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0);
    
    let y = 40;
    notes.forEach((note, index) => {
      doc.setFontSize(14);
      doc.setTextColor(255, 102, 178);
      doc.text(`Q${index + 1}: ${note.question}`, 20, y);
      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(note.answer, 20, y, { maxWidth: 170 });
      y += 20;
    });
    
    doc.save("MarinAI_Notes.pdf");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-100 p-6">
      {/* Floating hearts background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <Heart
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

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-pink-600 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8" />
            Marin AI Chat
            <Sparkles className="w-8 h-8" />
          </h1>
          <p className="text-pink-400 mt-2">Your Cosplay-Loving AI Assistant! ✨</p>
        </div>

        {/* Note-taking controls */}
        <div className="flex gap-4 mb-6 justify-center">
          <button 
            onClick={() => setIsTakingNotes(!isTakingNotes)}
            className={`px-6 py-2 rounded-full text-white font-medium transition-all transform hover:scale-105 ${
              isTakingNotes 
                ? "bg-gradient-to-r from-red-400 to-red-500" 
                : "bg-gradient-to-r from-pink-400 to-pink-500"
            }`}
          >
            {isTakingNotes ? "Stop Taking Notes" : "Start Taking Notes"}
          </button>
          <button 
            onClick={handleDownloadNotes}
            disabled={notes.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-medium rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Download Notes
          </button>
        </div>

        {/* Main chat container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-pink-200">
          {/* Chat messages area */}
          {responseText && (
            <div className="mb-6 bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div className="flex-1">
                  <p className="font-medium text-pink-600 mb-1">Marin</p>
                  <p className="text-gray-700">{responseText}</p>
                  
                  {audioSrc && (
                    <button 
                      onClick={toggleAudio}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause Voice</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Play Voice</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="relative">
            <textarea
              value={query}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask Marin anything about cosplay, fashion, or just chat! ✨"
              className="w-full p-4 pr-24 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 resize-none bg-white/50 backdrop-blur-sm"
              rows={3}
            />
            
            <div className="absolute bottom-4 right-4 flex gap-2">
              {isMicSupported && (
                <button
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-full transition-all transform hover:scale-105 ${
                    isListening ? "bg-red-400" : "bg-pink-400"
                  } text-white`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={handleSubmit}
                disabled={isLoading || !query.trim()}
                className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 hover:shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-red-400 text-sm p-3 bg-red-50 rounded-xl border border-red-100">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;