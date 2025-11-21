import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Loader, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';

// 👉 NEW IMPORT (SDK)
import { GoogleGenAI } from "@google/genai";

type Message = {
  text: string;
  isUser: boolean;
  timestamp: Date;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
  topic?: string;
};

const ChatBot: React.FC = () => {
  const { isChatOpen, closeChat } = useChat();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // 👉 Initialize Gemini SDK
  const ai = new GoogleGenAI({
    apiKey: "AIzaSyDeC13eXS3igAB5MQZGWArKlQdgz6WROps"
  });

  // Load conversations
  useEffect(() => {
    const saved = localStorage.getItem('chatConversations');
    if (saved) {
      const parsed = JSON.parse(saved).map((c: any) => ({
        ...c,
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
      setConversations(parsed);
    }
  }, []);

  // Save conversations
  useEffect(() => {
    localStorage.setItem('chatConversations', JSON.stringify(conversations));
  }, [conversations]);

  // Create first conversation when opened
  useEffect(() => {
    if (isChatOpen && !currentConversation) {
      createNewConversation();
    }
  }, [isChatOpen]);

  const createNewConversation = () => {
    const starter: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [
        {
          text: `Hi! I'm Youniq, your personal motivation coach. I can help you with:

• Staying motivated in your studies
• Overcoming learning challenges
• Setting and achieving goals
• Building study habits
• Managing study stress

What's on your mind today?`,
          isUser: false,
          timestamp: new Date()
        }
      ],
      lastUpdated: new Date()
    };

    setConversations(prev => [starter, ...prev]);
    setCurrentConversation(starter);
    setShowHistory(false);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversation?.id === id) setCurrentConversation(null);
  };

  const switchConversation = (conv: Conversation) => {
    setCurrentConversation(conv);
    setShowHistory(false);
  };

  const quickPrompts = [
    "I'm feeling overwhelmed with my studies",
    "How can I stay motivated?",
    "I'm struggling with procrastination",
    "Can you help me set study goals?",
    "How do I manage study stress?",
    "Tips for better study habits",
    "I'm afraid of failing",
    "How to balance studies and life?"
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    setShowQuickPrompts(false);
    setTimeout(handleSendMessage, 100);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation) return;

    const userMessage: Message = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    const updated: Conversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      lastUpdated: new Date()
    };

    setCurrentConversation(updated);
    setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));

    setInputMessage('');
    setIsLoading(true);

    try {
      // Build context (last 5 messages)
      const recent = updated.messages.slice(-5);
      const context = recent
        .map(m => `${m.isUser ? "User" : "Youniq"}: ${m.text}`)
        .join("\n");

      // 👉 GEMINI SDK CALL (replacing fetch)
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are Youniq, a motivational coach helping students succeed.

Your role:
1. Provide encouragement and positivity
2. Help students overcome learning challenges
3. Give practical study tips
4. Support them emotionally
5. Guide them in setting goals

Style:
- Warm and empathetic
- Solution-oriented
- Inspiring and uplifting
- Practical and actionable
- Personal and relatable

Conversation context:
${context}

User: ${userMessage.text}

Give a supportive motivational response:`
      });

      const botText = result?.response?.text() || "I'm sorry, I couldn't understand that.";

      const finalConv: Conversation = {
        ...updated,
        messages: [
          ...updated.messages,
          {
            text: botText,
            isUser: false,
            timestamp: new Date(),
          }
        ],
        lastUpdated: new Date(),
        title:
          updated.messages.length === 1
            ? userMessage.text.slice(0, 30) + "..."
            : updated.title
      };

      setCurrentConversation(finalConv);
      setConversations(prev => prev.map(c => c.id === finalConv.id ? finalConv : c));

    } catch (err) {
      console.error("Gemini Error:", err);

      const errConv: Conversation = {
        ...currentConversation,
        messages: [
          ...currentConversation.messages,
          {
            text: "I'm having trouble responding. Try again soon.",
            isUser: false,
            timestamp: new Date()
          }
        ]
      };

      setCurrentConversation(errConv);
      setConversations(prev => prev.map(c => c.id === errConv.id ? errConv : c));

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => (isChatOpen ? closeChat() : createNewConversation())}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-gray-900 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <MessageCircle size={20} />
                </button>
                <h3 className="text-lg font-semibold text-white">
                  {showHistory
                    ? "Question History"
                    : currentConversation?.title || "New Conversation"}
                </h3>
              </div>
              <button
                onClick={closeChat}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {showHistory ? (
                // History
                <div className="h-full overflow-y-auto p-4">
                  <button
                    onClick={createNewConversation}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg mb-4 hover:bg-blue-700 transition-colors"
                  >
                    New Conversation
                  </button>

                  <div className="space-y-2">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <button
                          onClick={() => switchConversation(conv)}
                          className="flex-1 text-left truncate"
                        >
                          {conv.title}
                        </button>
                        <button
                          onClick={() => deleteConversation(conv.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Chat Screen
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentConversation?.messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.isUser
                              ? "bg-blue-600 text-white"
                              : "bg-gray-800 text-gray-100"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{msg.text}</p>
                          <span className="text-xs opacity-50 mt-1 block">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-800 text-gray-100 rounded-lg p-3">
                          <Loader className="animate-spin" size={16} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Prompts */}
                  {showQuickPrompts &&
                    currentConversation?.messages.length === 1 && (
                      <div className="p-4 bg-gray-800 border-t border-gray-700">
                        <h4 className="text-sm text-gray-400 mb-2">
                          Quick Questions:
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {quickPrompts.map((p, i) => (
                            <button
                              key={i}
                              onClick={() => handleQuickPrompt(p)}
                              className="text-sm text-gray-300 bg-gray-700 p-2 rounded hover:bg-gray-600 transition-colors text-left"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Input Area */}
                  <div className="p-4 bg-gray-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        placeholder="Ask your question..."
                        className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
