import React, { useState, useRef } from 'react';
import { Upload, FileText, Send, Loader, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

type Message = {
  text: string;
  isUser: boolean;
  timestamp: Date;
};

type Document = {
  name: string;
  content: string;
  type: string;
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text:
        "Hi! I'm your document analysis assistant. You can:\n\n• Upload any document (PDF, DOC, TXT)\n• Ask questions about the content\n• Get detailed explanations\n• Request summaries\n\nUpload a document to get started!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini client
  const ai = new GoogleGenAI({
    apiKey: 'AIzaSyDeC13eXS3igAB5MQZGWArKlQdgz6WROps', // or use env var
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const document: Document = {
        name: file.name,
        content,
        type: file.type,
      };
      setCurrentDocument(document);

      setMessages((prev) => [
        ...prev,
        {
          text: `I've processed your document "${file.name}". You can now ask questions about its content.`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      setIsUploading(false);
    };

    reader.onerror = (err) => {
      console.error('File read error:', err);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I couldn’t read this file.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg: Message = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build context
      const recent = messages
        .slice(-5)
        .map((m) => `${m.isUser ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n');
      const docCtx = currentDocument
        ? `\nDocument Content:\n${currentDocument.content.slice(0, 2000)}...`
        : '';

      // Call Gemini generateContent
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // or whichever Gemini model you want
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `
You are a helpful document analysis assistant. Your role is to:
1. Answer questions about the document content
2. Provide clear explanations
3. Summarize sections when requested
4. Help understand complex parts
5. Point out key information

${docCtx}

Recent conversation:
${recent}

User: ${inputMessage}

Provide a helpful response based ONLY on the document:`,
              },
            ],
          },
        ],
        config: {
          // You can optionally set temperature or “thinking” budget per docs :contentReference[oaicite:1]{index=1}
          temperature: 0.7,
        },
      });

      const botResponse = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      setMessages((prev) => [
        ...prev,
        {
          text: botResponse || "Sorry, I couldn't understand.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error('Gemini API error:', err);
      setMessages((prev) => [
        ...prev,
        {
          text: "Oops! Something went wrong with the AI.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeDocument = () => {
    setCurrentDocument(null);
    setMessages((prev) => [
      ...prev,
      {
        text: "Document removed. You can upload a new one to analyze.",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Upload */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Document Analysis</h2>
            {currentDocument ? (
              <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-500" size={24} />
                  <div>
                    <p className="font-medium">{currentDocument.name}</p>
                    <p className="text-sm text-gray-400">{currentDocument.type}</p>
                  </div>
                </div>
                <button
                  onClick={removeDocument}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.doc,.docx,.pdf"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  {isUploading ? (
                    <Loader className="animate-spin" size={20} />
                  ) : (
                    <Upload size={20} />
                  )}
                  {isUploading ? "Processing..." : "Upload Document"}
                </button>
                <p className="text-gray-400 mt-2 text-sm">
                  Supported: PDF, DOC, DOCX, TXT
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="h-[60vh] overflow-y-auto mb-4 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isUser ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <span className="text-xs opacity-50 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-lg p-3">
                  <Loader className="animate-spin" size={16} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={currentDocument ? "Ask about the document..." : "Upload a document first..."}
              disabled={!currentDocument}
              className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !currentDocument}
              className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
