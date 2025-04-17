import React, { useState } from "react";
import { Loader2, Sparkles, Pencil, BookOpen } from "lucide-react";

const LearnJapaneseWithMarin = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const askMarin = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const temp="Marin, I want to learn Japanese! Can you teach me? Here's my question: " +query;
      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query:temp })
      });
      if (!res.ok) throw new Error("Failed to get a response from Marin");

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to learn from Marin. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-100 p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-pink-600 flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8" />
          Learn Japanese with Marin
          <Sparkles className="w-8 h-8" />
        </h1>
        <p className="text-pink-400 mt-2">Marin will guide you through Japanese learning step by step! 🇯🇵✨</p>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-pink-200 mt-6">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Marin about Japanese! Example: How do I say 'hello' in Japanese?"
            className="w-full p-4 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 resize-none bg-white/50 backdrop-blur-sm min-h-[150px]"
          />

          <button
            onClick={askMarin}
            disabled={isLoading || !query.trim()}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-medium rounded-full transition-all transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Asking Marin...
              </>
            ) : (
              <>
                <Pencil className="w-5 h-5" />
                Ask Marin
              </>
            )}
          </button>
        </div>

        {response && (
          <div className="mt-6 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
            <h2 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Marin's Answer
            </h2>
            <p className="mt-2 text-gray-800">{response}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-400 text-sm p-3 bg-red-50 rounded-xl border border-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnJapaneseWithMarin;
