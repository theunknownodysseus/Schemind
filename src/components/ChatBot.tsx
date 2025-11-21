import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Loader, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';

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

  // Load conversations on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('chatConversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations).map((conv: any) => ({
        ...conv,
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setConversations(parsed);
    }
  }, []);

  // Save conversations
  useEffect(() => {
    localStorage.setItem('chatConversations', JSON.stringify(conversations));
  }, [conversations]);

  // Create conversation on open
  useEffect(() => {
    if (isChatOpen && !currentConversation) {
      createNewConversation();
    }
  }, [isChatOpen]);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
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

    setConversations(prev => [newConv, ...prev]);
    setCurrentConversation(newConv);
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

    // Add user message
    const updatedConv: Conversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      lastUpdated: new Date()
    };

    setCurrentConversation(updatedConv);
    setConversations(prev =>
      prev.map(c => (c.id === updatedConv.id ? updatedConv : c))
    );

    setInputMessage('');
    setIsLoading(true);

    try {
      // Use last 5 msgs as context
      const recent = updatedConv.messages.slice(-5);
      const context = recent
        .map(m => `${m.isUser ? 'User' : 'Youniq'}: ${m.text}`)
        .join('\n');

      // -------- GEMINI API CALL --------
      const geminiRes = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDeC13eXS3igAB5MQZGWArKlQdgz6WROps",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are Youniq, a motivational coach helping students succeed.

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
                  }
                ]
              }
            ]
          })
        }
      );

      const json = await geminiRes.json();

     // SAFELY extract Gemini text (handles multiple formats)
let botResponse = "";

// Try unified parts array
const parts = json?.candidates?.[0]?.content?.parts;
if (Array.isArray(parts)) {
  botResponse = parts
    .map((p: any) => p?.text || "")
    .join(" ")
    .trim();
}

// Try "text" field inside "content"
if (!botResponse) {
  const content = json?.candidates?.[0]?.content;
  if (typeof content === "string") botResponse = content;
}

// Try "output_text"
if (!botResponse) {
  botResponse = json?.candidates?.[0]?.output_text || "";
}

// Final fallback
if (!botResponse || botResponse.trim() === "") {
  botResponse = "I'm sorry, I couldn't understand that.";
}

      // Add bot message
      const finalConv: Conversation = {
        ...updatedConv,
        messages: [
          ...updatedConv.messages,
          {
            text: botResponse,
            isUser: false,
            timestamp: new Date()
          }
        ],
        lastUpdated: new Date(),
        title:
          updatedConv.messages.length === 1
            ? userMessage.text.slice(0, 30) + "..."
            : updatedConv.title
      };

      setCurrentConversation(finalConv);
      setConversations(prev =>
        prev.map(c => (c.id === finalConv.id ? finalConv : c))
      );
    } catch (err) {
      console.error("Gemini error:", err);

      const errorConv: Conversation = {
        ...updatedConv,
        messages: [
          ...updatedConv.messages,
          {
            text: "I'm having trouble responding. Try again soon.",
            isUser: false,
            timestamp: new Date()
          }
        ],
        lastUpdated: new Date()
      };

      setCurrentConversation(errorConv);
      setConversations(prev =>
        prev.map(c => (c.id === errorConv.id ? errorConv : c))
      );
    } finally {
      setIsLoading(false);
    }
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
                // Chat
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
                          <p className="text-sm whitespace-pre-line">
                            {msg.text}
                          </p>
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
