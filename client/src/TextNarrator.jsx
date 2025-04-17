import React, { useState,useEffect, useRef } from "react";
import { Play, Pause, Download, Loader2, Heart, Sparkles, Save } from "lucide-react";

const TextNarrator = () => {
  const [text, setText] = useState("");
  const [audioSrc, setAudioSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  useEffect(() => {
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

  const generateNarration = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const encodedText = encodeURIComponent(text);
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
      audioRef.current.play();

    } catch (error) {
      console.error("Error:", error);
      setError("Failed to generate narration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const downloadAudio = () => {
    if (!audioSrc) return;
    
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = 'marin-narration.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-100 p-6">
      {/* Floating hearts background */}
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8" />
            Marin's Voice Generator
            <Sparkles className="w-8 h-8" />
          </h1>
          <p className="text-pink-400 mt-2">Let me narrate your text with my voice! ✨</p>
        </div>

        {/* Main content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-pink-200">
          {/* Text input */}
          <div className="mb-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste the text you want me to narrate! I'll bring it to life with my voice~ 💖"
              className="w-full p-4 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 resize-none bg-white/50 backdrop-blur-sm min-h-[200px]"
            />
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={generateNarration}
              disabled={isLoading || !text.trim()}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-medium rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Generate Narration
                </>
              )}
            </button>
          </div>

          {/* Audio player */}
          {audioSrc && (
            <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
              <div className="flex justify-center gap-4">
                <button
                  onClick={toggleAudio}
                  className="px-6 py-3 bg-pink-500 text-white font-medium rounded-full transition-all hover:bg-pink-600 flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Play
                    </>
                  )}
                </button>
                <button
                  onClick={downloadAudio}
                  className="px-6 py-3 bg-purple-500 text-white font-medium rounded-full transition-all hover:bg-purple-600 flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>
            </div>
          )}

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

export default TextNarrator;