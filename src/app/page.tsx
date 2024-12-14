"use client";

import { useState } from "react";

type Message = {
  role: "user" | "ai";
  content: string;
  sources?: string[];
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [urls, setUrls] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! Paste URLs and ask a question, or just ask a question directly." },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    // Add user message to the conversation
    const userMessage = {
      role: "user" as const,
      content: message
    };

    // Parse URLs if provided
    const urlList = urls.trim()
      ? urls.split(/[\s,]+/).filter(url => url.trim())
      : [];

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setUrls("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          urls: urlList
        }),
      });

      const data = await response.json();

      if (data.answer) {
        const aiMessage: Message = {
          role: "ai",
          content: data.answer,
          sources: data.sources || []
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, {
        role: "ai",
        content: "Sorry, an error occurred while processing your request."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="w-full bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold text-white">AI Answer Engine</h1>
        </div>
      </div>

      {/* URL Input */}
      <div className="w-full bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            value={urls}
            onChange={e => setUrls(e.target.value)}
            placeholder="Optional: Paste URLs separated by spaces or commas"
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400"
          />
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pb-32 pt-4">
        <div className="max-w-3xl mx-auto px-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 mb-4 ${msg.role === "ai"
                  ? "justify-start"
                  : "justify-end flex-row-reverse"
                }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.role === "ai"
                    ? "bg-gray-800 border border-gray-700 text-gray-100"
                    : "bg-cyan-600 text-white ml-auto"
                  }`}
              >
                {msg.content}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 border-t border-gray-600 pt-2">
                    <p className="text-xs text-gray-400">Sources:</p>
                    <ul className="text-xs text-blue-300">
                      {msg.sources.map((source, idx) => (
                        <li key={idx}>
                          <a
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 mb-4">
              {/* Loading indicator - same as before */}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 w-full bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-cyan-600 text-white px-5 py-3 rounded-xl hover:bg-cyan-700 transition-all disabled:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
