import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const DoubtClarifier = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi! I'm your doubt clarifier. I can help you with:\n\n• Explaining complex concepts\n• Solving technical problems\n• Answering subject-specific questions\n• Providing detailed examples\n• Suggesting learning resources\n\nWhat would you like to clarify?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 3W85slWByAIgHZnnkaFDRfMgUbGEpDp6XAbJqMkb'
        },
        body: JSON.stringify({
          model: 'command',
          prompt: `You are a technical doubt clarifier focused on providing detailed, accurate explanations. Your role is to:
1. Break down complex concepts into simple terms
2. Provide step-by-step solutions to problems
3. Use relevant examples and analogies
4. Include technical details when appropriate
5. Suggest additional resources for deeper understanding

Here's the conversation context:\n\n${messages.map(msg => 
  `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`
).join('\n')}\n\nUser: ${inputMessage}\n\nProvide a detailed, educational response:`,
          max_tokens: 500,
          temperature: 0.7,
        })
      });

      const data = await response.json();
      const botResponse = data.generations[0].text.trim();

      setMessages(prev => [...prev, {
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        text: "I apologize, but I'm having trouble processing your request. Please try again.",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Doubt Clarifier</h1>
          <p className="text-xl text-gray-400">Get detailed explanations for your technical questions</p>
        </motion.div>

        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="h-[600px] overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <span className="text-xs opacity-70 mt-2 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your question..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoubtClarifier; 