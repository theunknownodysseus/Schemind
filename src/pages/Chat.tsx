import React, { useState } from "react";
import * as GoogleAI from "@google/generative-ai";

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchResponse = async (message: string) => {
    const apiKey = 'AIzaSyDeC13eXS3igAB5MQZGWArKlQdgz6WROps';

    const genAI = new GoogleAI.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    try {
      setLoading(true);

      const result = await model.generateContent(message);
      const responseText =
        result.response.text().trim() || "Sorry, I couldn't understand.";

      setMessages((prev) => [
        ...prev,
        `User: ${message}`,
        `AI: ${responseText}`,
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, "Error fetching response."]);
    }

    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    fetchResponse(input);
    setInput("");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Chatbot</h2>

      <div
        style={{
          height: "300px",
          overflowY: "scroll",
          border: "1px solid black",
          padding: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "80%", padding: "10px", marginTop: "10px" }}
      />

      <button
        onClick={handleSend}
        style={{ padding: "10px", marginLeft: "10px" }}
      >
        {loading ? "Loading..." : "Send"}
      </button>
    </div>
  );
};

export default Chatbot;
