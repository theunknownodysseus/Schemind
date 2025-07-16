import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Loader, Trash2, BookOpen, Brain, HelpCircle } from 'lucide-react';
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

  // Load conversations from localStorage on component mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('chatConversations');
    if (savedConversations) {
      const parsedConversations = JSON.parse(savedConversations).map((conv: any) => ({
        ...conv,
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setConversations(parsedConversations);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatConversations', JSON.stringify(conversations));
  }, [conversations]);

  // Create new conversation when chat is opened
  useEffect(() => {
    if (isChatOpen && !currentConversation) {
      createNewConversation();
    }
  }, [isChatOpen]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [{
        text: "Hi! I'm Geetha, your personal motivation coach. I can help you with:\n\n• Staying motivated in your studies\n• Overcoming learning challenges\n• Setting and achieving goals\n• Building study habits\n• Managing study stress\n\nWhat's on your mind today?",
        isUser: false,
        timestamp: new Date()
      }],
      lastUpdated: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    setShowHistory(false);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
    }
  };

  const switchConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setShowHistory(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    setShowQuickPrompts(false);
    // Send the message immediately
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation) return;

    const userMessage = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    // Update current conversation
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      lastUpdated: new Date()
    };
    setCurrentConversation(updatedConversation);
    setConversations(prev => 
      prev.map(conv => 
        conv.id === currentConversation.id ? updatedConversation : conv
      )
    );
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get the last 5 messages for context
      const recentMessages = updatedConversation.messages.slice(-5);
      const context = recentMessages.map(msg => 
        `${msg.isUser ? 'User' : 'Geetha'}: ${msg.text}`
      ).join('\n');

      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 3W85slWByAIgHZnnkaFDRfMgUbGEpDp6XAbJqMkb'
        },
        body: JSON.stringify({
          model: 'command',
          prompt: `You are Geetha, a motivational coach focused on helping students achieve their learning goals. Your role is to:
1. Provide encouragement and positive reinforcement
2. Help students overcome learning challenges
3. Share practical tips for study success
4. Offer emotional support during difficult times
5. Guide students in setting and achieving goals

Your communication style should be:
- Warm and empathetic
- Solution-oriented
- Inspiring and uplifting
- Practical and actionable
- Personal and relatable

Here's the conversation context:\n\n${context}\n\nUser: ${inputMessage}\n\nProvide a supportive, motivational response:`,
          max_tokens: 300,
          temperature: 0.8,
        })
      });

      const data = await response.json();
      const botResponse = data.generations[0].text.trim();

      // Update conversation with bot response
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, {
          text: botResponse,
          isUser: false,
          timestamp: new Date()
        }],
        lastUpdated: new Date(),
        title: updatedConversation.messages.length === 1 ? inputMessage.slice(0, 30) + '...' : updatedConversation.title
      };
      setCurrentConversation(finalConversation);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id ? finalConversation : conv
        )
      );
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, {
          text: "I'm sorry, I'm having trouble responding right now. Please try again.",
          isUser: false,
          timestamp: new Date()
        }],
        lastUpdated: new Date()
      };
      setCurrentConversation(errorConversation);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversation.id ? errorConversation : conv
        )
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
        onClick={() => isChatOpen ? closeChat() : createNewConversation()}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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
                  {showHistory ? 'Question History' : currentConversation?.title || 'New Conversation'}
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
                // Conversation History
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
                // Current Conversation
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentConversation?.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.isUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.text}</p>
                          <span className="text-xs opacity-50 mt-1 block">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
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
                  {showQuickPrompts && currentConversation?.messages.length === 1 && (
                    <div className="p-4 bg-gray-800 border-t border-gray-700">
                      <h4 className="text-sm text-gray-400 mb-2">Quick Questions:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {quickPrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickPrompt(prompt)}
                            className="text-sm text-gray-300 bg-gray-700 p-2 rounded hover:bg-gray-600 transition-colors text-left"
                          >
                            {prompt}
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
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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